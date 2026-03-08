package com.triplog.service;

import com.triplog.dto.request.LocationRequest;
import com.triplog.dto.response.LocationResponse;
import com.triplog.entity.Location;
import com.triplog.entity.TripDay;
import com.triplog.exception.CustomException;
import com.triplog.repository.LocationRepository;
import com.triplog.repository.TripDayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final TripDayRepository tripDayRepository;

    @Transactional
    public LocationResponse addLocation(Long tripId, Long dayId, LocationRequest request, String email) {
        TripDay tripDay = tripDayRepository.findById(dayId)
                .orElseThrow(() -> CustomException.notFound("Trip day not found with id: " + dayId));

        if (!tripDay.getTrip().getId().equals(tripId)) {
            throw CustomException.badRequest("Trip day does not belong to the specified trip");
        }

        if (!tripDay.getTrip().getUser().getEmail().equals(email)) {
            throw CustomException.forbidden("You do not have permission to modify this trip");
        }

        Location location = Location.builder()
                .tripDay(tripDay)
                .name(request.getName())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .orderIndex(request.getOrderIndex())
                .build();

        location = locationRepository.save(location);
        log.info("Location added: {} to day: {}", location.getName(), dayId);

        return mapToResponse(location);
    }

    @Transactional
    public LocationResponse updateLocation(Long locationId, LocationRequest request, String email) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> CustomException.notFound("Location not found with id: " + locationId));

        if (!location.getTripDay().getTrip().getUser().getEmail().equals(email)) {
            throw CustomException.forbidden("You do not have permission to modify this location");
        }

        location.setName(request.getName());
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setOrderIndex(request.getOrderIndex());

        location = locationRepository.save(location);
        log.info("Location updated: {}", locationId);

        return mapToResponse(location);
    }

    @Transactional
    public void deleteLocation(Long locationId, String email) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> CustomException.notFound("Location not found with id: " + locationId));

        if (!location.getTripDay().getTrip().getUser().getEmail().equals(email)) {
            throw CustomException.forbidden("You do not have permission to delete this location");
        }

        locationRepository.delete(location);
        log.info("Location deleted: {}", locationId);
    }

    private LocationResponse mapToResponse(Location location) {
        return LocationResponse.builder()
                .id(location.getId())
                .name(location.getName())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .orderIndex(location.getOrderIndex())
                .build();
    }
}
