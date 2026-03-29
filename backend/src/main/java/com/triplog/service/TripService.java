package com.triplog.service;

import com.triplog.dto.request.TripRequest;
import com.triplog.dto.response.*;
import com.triplog.entity.Trip;
import com.triplog.entity.TripDay;
import com.triplog.entity.User;
import com.triplog.exception.CustomException;
import com.triplog.entity.Notification;
import com.triplog.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final TripDayRepository tripDayRepository;
    private final LocationRepository locationRepository;
    private final TripImageRepository tripImageRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    // ── 여행 CRUD ──────────────────────────────────────────────────────

    @Transactional
    public TripResponse createTrip(TripRequest request, String email) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw CustomException.badRequest("End date must be after or equal to start date");
        }

        User user = findUserByEmail(email);

        Trip trip = Trip.builder()
                .user(user)
                .title(request.getTitle())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isPublic(Boolean.TRUE.equals(request.getIsPublic()))
                .build();
        trip = tripRepository.save(trip);

        List<TripDay> tripDays = new ArrayList<>();
        LocalDate current = request.getStartDate();
        while (!current.isAfter(request.getEndDate())) {
            tripDays.add(TripDay.builder().trip(trip).date(current).build());
            current = current.plusDays(1);
        }
        tripDayRepository.saveAll(tripDays);
        trip.setTripDays(tripDays);

        log.info("Trip created: {} for user: {}", trip.getTitle(), email);
        return mapToTripSummary(trip, email);
    }

    @Transactional(readOnly = true)
    public List<TripResponse> getTrips(String email) {
        User user = findUserByEmail(email);

        List<Trip> ownedTrips = tripRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<Trip> memberTrips = tripRepository.findMemberTripsByUserId(user.getId());

        // owned first, then member trips not already included
        Map<Long, Trip> combined = new LinkedHashMap<>();
        ownedTrips.forEach(t -> combined.put(t.getId(), t));
        memberTrips.forEach(t -> combined.putIfAbsent(t.getId(), t));

        return combined.values().stream()
                .map(t -> mapToTripSummary(t, email))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TripResponse getTripById(Long tripId, String email) {
        Trip trip = findTripById(tripId);
        requireAccess(trip, email);
        return mapToTripResponseFull(trip, email);
    }

    // ── 공개 여행 ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TripResponse> getPublicTrips() {
        return tripRepository.findByIsPublicTrueOrderByCreatedAtDesc().stream()
                .map(this::mapToPublicTripSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TripResponse getPublicTripById(Long tripId) {
        Trip trip = findTripById(tripId);
        if (!trip.isPublic()) {
            throw CustomException.forbidden("비공개 여행입니다.");
        }
        return mapToTripResponseFull(trip, null);
    }

    @Transactional
    public TripResponse updateVisibility(Long tripId, boolean isPublic, String email) {
        Trip trip = findTripById(tripId);
        requireOwner(trip, email, "공개/비공개 설정은 소유자만 변경할 수 있습니다.");
        trip.setPublic(isPublic);
        tripRepository.save(trip);
        log.info("Trip {} visibility set to {} by {}", tripId, isPublic ? "public" : "private", email);
        return mapToTripSummary(trip, email);
    }

    @Transactional
    public void deleteTrip(Long tripId, String email) {
        Trip trip = findTripById(tripId);
        requireOwner(trip, email, "Only the trip owner can delete this trip");
        tripRepository.delete(trip);
        log.info("Trip deleted: {} by owner: {}", tripId, email);
    }

    // ── 멤버 관리 ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TripMemberResponse> getMembers(Long tripId, String email) {
        Trip trip = findTripById(tripId);
        requireAccess(trip, email);
        return trip.getMembers().stream()
                .map(this::toMemberResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TripMemberResponse inviteMemberById(Long tripId, Long inviteeId, String requesterEmail) {
        Trip trip = findTripById(tripId);
        requireOwner(trip, requesterEmail, "Only the trip owner can invite members");

        if (trip.getUser().getId().equals(inviteeId)) {
            throw CustomException.badRequest("여행 소유자는 멤버로 추가할 수 없습니다.");
        }

        User invitee = userRepository.findById(inviteeId)
                .orElseThrow(() -> CustomException.notFound("사용자를 찾을 수 없습니다."));

        boolean alreadyMember = trip.getMembers().stream()
                .anyMatch(m -> m.getId().equals(inviteeId));
        if (alreadyMember) {
            throw CustomException.conflict("이미 해당 여행의 멤버입니다.");
        }

        trip.getMembers().add(invitee);
        tripRepository.save(trip);

        // 초대 알림 생성
        User requester = findUserByEmail(requesterEmail);
        notificationRepository.save(Notification.builder()
                .recipient(invitee)
                .message(requester.getNickname() + "님이 '" + trip.getTitle() + "' 여행에 초대했습니다.")
                .tripId(tripId)
                .build());

        log.info("User {} invited to trip {} by {}", invitee.getNickname(), tripId, requesterEmail);
        return toMemberResponse(invitee);
    }

    @Transactional
    public void removeMember(Long tripId, Long memberId, String requesterEmail) {
        Trip trip = findTripById(tripId);
        User requester = findUserByEmail(requesterEmail);

        boolean isOwner = isOwner(trip, requesterEmail);
        boolean isSelf = requester.getId().equals(memberId);

        if (!isOwner && !isSelf) {
            throw CustomException.forbidden("멤버를 내보낼 권한이 없습니다.");
        }
        if (isOwner && isSelf) {
            throw CustomException.badRequest("소유자는 멤버에서 제거할 수 없습니다.");
        }

        boolean removed = trip.getMembers().removeIf(m -> m.getId().equals(memberId));
        if (!removed) {
            throw CustomException.notFound("해당 멤버를 찾을 수 없습니다.");
        }

        tripRepository.save(trip);
        log.info("Member {} removed from trip {} by {}", memberId, tripId, requesterEmail);
    }

    @Transactional
    public void leaveTrip(Long tripId, String email) {
        Trip trip = findTripById(tripId);
        if (isOwner(trip, email)) {
            throw CustomException.badRequest("소유자는 여행에서 나갈 수 없습니다. 여행을 삭제해주세요.");
        }
        User user = findUserByEmail(email);
        boolean removed = trip.getMembers().removeIf(m -> m.getId().equals(user.getId()));
        if (!removed) {
            throw CustomException.notFound("해당 여행의 멤버가 아닙니다.");
        }
        tripRepository.save(trip);
        log.info("User {} left trip {}", email, tripId);
    }

    // ── 권한 헬퍼 ──────────────────────────────────────────────────────

    public boolean hasMemberAccess(Trip trip, String email) {
        if (isOwner(trip, email)) return true;
        return trip.getMembers().stream().anyMatch(m -> m.getEmail().equals(email));
    }

    boolean isOwner(Trip trip, String email) {
        return trip.getUser().getEmail().equals(email);
    }

    private void requireAccess(Trip trip, String email) {
        if (!hasMemberAccess(trip, email)) {
            throw CustomException.forbidden("이 여행에 접근할 권한이 없습니다.");
        }
    }

    private void requireOwner(Trip trip, String email, String message) {
        if (!isOwner(trip, email)) {
            throw CustomException.forbidden(message);
        }
    }

    // ── 조회 헬퍼 ──────────────────────────────────────────────────────

    private Trip findTripById(Long tripId) {
        return tripRepository.findById(tripId)
                .orElseThrow(() -> CustomException.notFound("Trip not found: " + tripId));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("User not found: " + email));
    }

    // ── 매핑 ──────────────────────────────────────────────────────────

    private TripMemberResponse toMemberResponse(User u) {
        return TripMemberResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .nickname(u.getNickname())
                .build();
    }

    private TripResponse mapToTripSummary(Trip trip, String email) {
        return TripResponse.builder()
                .id(trip.getId())
                .title(trip.getTitle())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .createdAt(trip.getCreatedAt())
                .isPublic(trip.isPublic())
                .ownerId(trip.getUser().getId())
                .ownerNickname(trip.getUser().getNickname())
                .isOwner(isOwner(trip, email))
                .memberCount(trip.getMembers().size())
                .tripDays(List.of())
                .images(List.of())
                .build();
    }

    private TripResponse mapToPublicTripSummary(Trip trip) {
        return TripResponse.builder()
                .id(trip.getId())
                .title(trip.getTitle())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .createdAt(trip.getCreatedAt())
                .isPublic(true)
                .ownerId(trip.getUser().getId())
                .ownerNickname(trip.getUser().getNickname())
                .memberCount(trip.getMembers().size())
                .tripDays(List.of())
                .images(List.of())
                .build();
    }

    private TripResponse mapToTripResponseFull(Trip trip, String email) {
        List<TripDayResponse> dayResponses = tripDayRepository.findByTripIdOrderByDate(trip.getId())
                .stream()
                .map(day -> {
                    List<LocationResponse> locations = locationRepository
                            .findByTripDayIdOrderByOrderIndex(day.getId()).stream()
                            .map(loc -> LocationResponse.builder()
                                    .id(loc.getId())
                                    .name(loc.getName())
                                    .latitude(loc.getLatitude())
                                    .longitude(loc.getLongitude())
                                    .orderIndex(loc.getOrderIndex())
                                    .category(loc.getCategory())
                                    .memo(loc.getMemo())
                                    .build())
                            .collect(Collectors.toList());
                    return TripDayResponse.builder()
                            .id(day.getId())
                            .date(day.getDate())
                            .locations(locations)
                            .build();
                })
                .collect(Collectors.toList());

        List<ImageResponse> imageResponses = tripImageRepository.findByTripId(trip.getId()).stream()
                .map(img -> ImageResponse.builder().id(img.getId()).imageUrl(img.getImageUrl()).build())
                .collect(Collectors.toList());

        List<TripMemberResponse> memberResponses = trip.getMembers().stream()
                .map(this::toMemberResponse)
                .collect(Collectors.toList());

        return TripResponse.builder()
                .id(trip.getId())
                .title(trip.getTitle())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .createdAt(trip.getCreatedAt())
                .isPublic(trip.isPublic())
                .ownerId(trip.getUser().getId())
                .ownerNickname(trip.getUser().getNickname())
                .isOwner(email != null ? isOwner(trip, email) : null)
                .memberCount(trip.getMembers().size())
                .members(memberResponses)
                .tripDays(dayResponses)
                .images(imageResponses)
                .build();
    }
}
