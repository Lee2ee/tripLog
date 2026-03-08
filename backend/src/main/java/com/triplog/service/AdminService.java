package com.triplog.service;

import com.triplog.dto.request.AdminUpdateUserRequest;
import com.triplog.dto.request.TripRequest;
import com.triplog.dto.response.*;
import com.triplog.entity.Role;
import com.triplog.entity.Trip;
import com.triplog.entity.TripImage;
import com.triplog.entity.User;
import com.triplog.exception.CustomException;
import com.triplog.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

        // 이메일 중복 체크 (자기 자신 제외)
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
    public TripResponse getTripById(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> CustomException.notFound("Trip not found: " + tripId));
        return mapToTripFull(trip);
    }

    @Transactional
    public TripResponse updateTrip(Long tripId, TripRequest request) {
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
    public void deleteTrip(Long tripId) {
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
                .tripDays(days)
                .images(images)
                .build();
    }
}
