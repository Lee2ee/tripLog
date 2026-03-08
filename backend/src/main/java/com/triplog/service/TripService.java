package com.triplog.service;

import com.triplog.dto.request.TripRequest;
import com.triplog.dto.response.LocationResponse;
import com.triplog.dto.response.TripDayResponse;
import com.triplog.dto.response.TripResponse;
import com.triplog.entity.Trip;
import com.triplog.entity.TripDay;
import com.triplog.entity.User;
import com.triplog.exception.CustomException;
import com.triplog.repository.LocationRepository;
import com.triplog.repository.TripDayRepository;
import com.triplog.repository.TripImageRepository;
import com.triplog.repository.TripRepository;
import com.triplog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
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

    @Transactional
    public TripResponse createTrip(TripRequest request, String email) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw CustomException.badRequest("End date must be after or equal to start date");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("User not found"));

        Trip trip = Trip.builder()
                .user(user)
                .title(request.getTitle())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        trip = tripRepository.save(trip);

        // Generate a TripDay for each date in range
        List<TripDay> tripDays = new ArrayList<>();
        LocalDate current = request.getStartDate();
        while (!current.isAfter(request.getEndDate())) {
            TripDay tripDay = TripDay.builder()
                    .trip(trip)
                    .date(current)
                    .build();
            tripDays.add(tripDay);
            current = current.plusDays(1);
        }
        tripDayRepository.saveAll(tripDays);
        trip.setTripDays(tripDays);

        log.info("Trip created: {} for user: {}", trip.getTitle(), email);
        return mapToTripResponse(trip);
    }

    @Transactional(readOnly = true)
    public List<TripResponse> getTrips(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("User not found"));

        return tripRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(trip -> TripResponse.builder()
                        .id(trip.getId())
                        .title(trip.getTitle())
                        .startDate(trip.getStartDate())
                        .endDate(trip.getEndDate())
                        .createdAt(trip.getCreatedAt())
                        .tripDays(List.of())
                        .images(List.of())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TripResponse getTripById(Long tripId, String email) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> CustomException.notFound("Trip not found with id: " + tripId));

        if (!trip.getUser().getEmail().equals(email)) {
            throw CustomException.forbidden("You do not have permission to access this trip");
        }

        return mapToTripResponseFull(trip);
    }

    @Transactional
    public void deleteTrip(Long tripId, String email) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> CustomException.notFound("Trip not found with id: " + tripId));

        if (!trip.getUser().getEmail().equals(email)) {
            throw CustomException.forbidden("You do not have permission to delete this trip");
        }

        tripRepository.delete(trip);
        log.info("Trip deleted: {} by user: {}", tripId, email);
    }

    private TripResponse mapToTripResponse(Trip trip) {
        List<TripDayResponse> dayResponses = trip.getTripDays().stream()
                .map(day -> TripDayResponse.builder()
                        .id(day.getId())
                        .date(day.getDate())
                        .locations(List.of())
                        .build())
                .collect(Collectors.toList());

        return TripResponse.builder()
                .id(trip.getId())
                .title(trip.getTitle())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .createdAt(trip.getCreatedAt())
                .tripDays(dayResponses)
                .images(List.of())
                .build();
    }

    private TripResponse mapToTripResponseFull(Trip trip) {
        List<TripDayResponse> dayResponses = tripDayRepository.findByTripIdOrderByDate(trip.getId())
                .stream()
                .map(day -> {
                    List<LocationResponse> locations = locationRepository.findByTripDayIdOrderByOrderIndex(day.getId())
                            .stream()
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
                            .locations(locations)
                            .build();
                })
                .collect(Collectors.toList());

        List<com.triplog.dto.response.ImageResponse> imageResponses =
                tripImageRepository.findByTripId(trip.getId())
                        .stream()
                        .map(img -> com.triplog.dto.response.ImageResponse.builder()
                                .id(img.getId())
                                .imageUrl(img.getImageUrl())
                                .build())
                        .collect(Collectors.toList());

        return TripResponse.builder()
                .id(trip.getId())
                .title(trip.getTitle())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .createdAt(trip.getCreatedAt())
                .tripDays(dayResponses)
                .images(imageResponses)
                .build();
    }
}
