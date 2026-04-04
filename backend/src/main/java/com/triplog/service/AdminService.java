package com.triplog.service;

import com.triplog.dto.request.AdminCreateTripRequest;
import com.triplog.dto.request.AdminUpdateUserRequest;
import com.triplog.dto.request.TripRequest;
import com.triplog.dto.response.*;
import com.triplog.entity.Role;
import com.triplog.entity.Trip;
import com.triplog.entity.TripDay;
import com.triplog.entity.TripImage;
import com.triplog.entity.User;
import com.triplog.exception.CustomException;
import com.triplog.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final TripDayRepository tripDayRepository;
    private final LocationRepository locationRepository;
    private final TripImageRepository tripImageRepository;
    private final PasswordEncoder passwordEncoder;

    // ── 대시보드 통계 ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long totalTrips = tripRepository.count();
        long totalImages = tripImageRepository.count();

        List<Trip> allTrips = tripRepository.findAll();
        List<User> allUsers = userRepository.findAll();

        List<AdminStatsResponse.MonthlyCount> tripsPerMonth = buildMonthlyStats(
                allTrips.stream().map(Trip::getCreatedAt).collect(Collectors.toList()), 6);

        List<AdminStatsResponse.MonthlyCount> usersPerMonth = buildMonthlyStats(
                allUsers.stream().map(User::getCreatedAt).collect(Collectors.toList()), 6);

        Map<Long, Long> tripCountByUser = allTrips.stream()
                .collect(Collectors.groupingBy(t -> t.getUser().getId(), Collectors.counting()));

        List<AdminStatsResponse.TopUser> topUsers = allUsers.stream()
                .map(u -> AdminStatsResponse.TopUser.builder()
                        .nickname(u.getNickname())
                        .email(u.getEmail())
                        .tripCount(tripCountByUser.getOrDefault(u.getId(), 0L))
                        .build())
                .sorted(Comparator.comparingLong(AdminStatsResponse.TopUser::getTripCount).reversed())
                .limit(5)
                .collect(Collectors.toList());

        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalTrips(totalTrips)
                .totalImages(totalImages)
                .tripsPerMonth(tripsPerMonth)
                .usersPerMonth(usersPerMonth)
                .topUsers(topUsers)
                .build();
    }

    private List<AdminStatsResponse.MonthlyCount> buildMonthlyStats(List<LocalDateTime> dates, int months) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        LocalDateTime cutoff = LocalDateTime.now().minusMonths(months);

        Map<String, Long> counts = new LinkedHashMap<>();
        for (int i = months - 1; i >= 0; i--) {
            counts.put(LocalDateTime.now().minusMonths(i).format(fmt), 0L);
        }

        dates.stream()
                .filter(d -> d != null && d.isAfter(cutoff))
                .forEach(d -> counts.merge(d.format(fmt), 1L, Long::sum));

        return counts.entrySet().stream()
                .map(e -> AdminStatsResponse.MonthlyCount.builder()
                        .month(e.getKey()).count(e.getValue()).build())
                .collect(Collectors.toList());
    }

    // ── 회원 관리 ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> CustomException.notFound("User not found: " + userId));
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateUser(Long userId, AdminUpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> CustomException.notFound("User not found: " + userId));

        userRepository.findByEmail(request.getEmail())
                .filter(existing -> !existing.getId().equals(userId))
                .ifPresent(existing -> { throw CustomException.conflict("이미 사용 중인 이메일입니다."); });

        user.setEmail(request.getEmail());
        user.setNickname(request.getNickname());

        try {
            user.setRole(Role.valueOf(request.getRole().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw CustomException.badRequest("유효하지 않은 권한입니다: " + request.getRole());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getNewPassword().length() < 8) {
                throw CustomException.badRequest("비밀번호는 8자 이상이어야 합니다.");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            log.info("Admin reset password for user: {}", user.getEmail());
        }

        userRepository.save(user);
        log.info("Admin updated user info: {}", user.getEmail());
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateUserRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> CustomException.notFound("User not found: " + userId));

        try {
            user.setRole(Role.valueOf(role.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw CustomException.badRequest("Invalid role: " + role + ". Must be USER or ADMIN");
        }

        userRepository.save(user);
        log.info("Admin changed role of user {} to {}", user.getEmail(), role);
        return UserResponse.from(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> CustomException.notFound("User not found: " + userId));

        if (user.getRole() == Role.ADMIN) {
            throw CustomException.badRequest("Cannot delete an admin account");
        }

        userRepository.delete(user);
        log.info("Admin deleted user: {}", user.getEmail());
    }

    // ── 여행 관리 ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TripResponse> getAllTrips() {
        return tripRepository.findAll().stream()
                .map(this::mapToTripSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TripResponse getTripById(UUID tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> CustomException.notFound("Trip not found: " + tripId));
        return mapToTripFull(trip);
    }

    @Transactional
    public TripResponse createTrip(AdminCreateTripRequest request) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw CustomException.badRequest("종료일은 시작일 이후여야 합니다.");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> CustomException.notFound("User not found: " + request.getUserId()));

        Trip trip = Trip.builder()
                .user(user)
                .title(request.getTitle())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();
        trip = tripRepository.save(trip);

        List<TripDay> tripDays = new ArrayList<>();
        LocalDate current = request.getStartDate();
        while (!current.isAfter(request.getEndDate())) {
            tripDays.add(TripDay.builder().trip(trip).date(current).build());
            current = current.plusDays(1);
        }
        tripDayRepository.saveAll(tripDays);

        log.info("Admin created trip '{}' for user: {}", trip.getTitle(), user.getEmail());
        return mapToTripSummary(trip);
    }

    @Transactional
    public TripResponse updateTrip(UUID tripId, TripRequest request) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> CustomException.notFound("Trip not found: " + tripId));

        trip.setTitle(request.getTitle());
        trip.setStartDate(request.getStartDate());
        trip.setEndDate(request.getEndDate());
        tripRepository.save(trip);

        log.info("Admin updated trip: {}", tripId);
        return mapToTripSummary(trip);
    }

    @Transactional
    public void deleteTrip(UUID tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> CustomException.notFound("Trip not found: " + tripId));
        tripRepository.delete(trip);
        log.info("Admin deleted trip: {}", tripId);
    }

    // ── 이미지 관리 ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ImageResponse> getAllImages() {
        return tripImageRepository.findAll().stream()
                .map(img -> ImageResponse.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteImage(Long imageId) {
        TripImage image = tripImageRepository.findById(imageId)
                .orElseThrow(() -> CustomException.notFound("Image not found: " + imageId));
        tripImageRepository.delete(image);
        log.info("Admin deleted image: {}", imageId);
    }

    // ── 내부 매핑 ──────────────────────────────────────────────────────

    private TripResponse mapToTripSummary(Trip trip) {
        return TripResponse.builder()
                .id(trip.getId())
                .title(trip.getTitle())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .createdAt(trip.getCreatedAt())
                .userEmail(trip.getUser().getEmail())
                .userNickname(trip.getUser().getNickname())
                .tripDays(List.of())
                .images(List.of())
                .build();
    }

    private TripResponse mapToTripFull(Trip trip) {
        List<TripDayResponse> days = tripDayRepository.findByTripIdOrderByDate(trip.getId()).stream()
                .map(day -> {
                    List<LocationResponse> locs = locationRepository
                            .findByTripDayIdOrderByOrderIndex(day.getId()).stream()
                            .map(loc -> LocationResponse.builder()
                                    .id(loc.getId())
                                    .name(loc.getName())
                                    .latitude(loc.getLatitude())
                                    .longitude(loc.getLongitude())
                                    .orderIndex(loc.getOrderIndex())
                                    .build())
                            .collect(Collectors.toList());
                    return TripDayResponse.builder()
                            .id(day.getId())
                            .date(day.getDate())
                            .locations(locs)
                            .build();
                })
                .collect(Collectors.toList());

        List<ImageResponse> images = tripImageRepository.findByTripId(trip.getId()).stream()
                .map(img -> ImageResponse.builder().id(img.getId()).imageUrl(img.getImageUrl()).build())
                .collect(Collectors.toList());

        return TripResponse.builder()
                .id(trip.getId())
                .title(trip.getTitle())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .createdAt(trip.getCreatedAt())
                .userEmail(trip.getUser().getEmail())
                .userNickname(trip.getUser().getNickname())
                .tripDays(days)
                .images(images)
                .build();
    }
}
