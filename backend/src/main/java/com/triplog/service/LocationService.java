package com.triplog.service;

import com.triplog.dto.request.LocationRequest;
import com.triplog.dto.response.LocationResponse;
import com.triplog.entity.Location;
import com.triplog.entity.Trip;
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
    private final TripService tripService;

    @Transactional
    public LocationResponse addLocation(Long tripId, Long dayId, LocationRequest request, String email) {
        TripDay tripDay = tripDayRepository.findById(dayId)
                .orElseThrow(() -> CustomException.notFound("Trip day not found: " + dayId));

        if (!tripDay.getTrip().getId().equals(tripId)) {
            throw CustomException.badRequest("Trip day does not belong to the specified trip");
        }

        requireAccess(tripDay.getTrip(), email);

        Location location = Location.builder()
                .tripDay(tripDay)
                .name(request.getName())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .orderIndex(request.getOrderIndex())
                .category(request.getCategory())
                .memo(request.getMemo())
                .build();

        location = locationRepository.save(location);
        log.info("Location added: {} to day: {} by: {}", location.getName(), dayId, email);
        return mapToResponse(location);
    }

    @Transactional
    public LocationResponse updateLocation(Long locationId, LocationRequest request, String email) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> CustomException.notFound("Location not found: " + locationId));

        requireAccess(location.getTripDay().getTrip(), email);

        location.setName(request.getName());
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setOrderIndex(request.getOrderIndex());
        location.setCategory(request.getCategory());
        location.setMemo(request.getMemo());

        location = locationRepository.save(location);
        log.info("Location updated: {} by: {}", locationId, email);
        return mapToResponse(location);
    }

    @Transactional
    public void deleteLocation(Long locationId, String email) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> CustomException.notFound("Location not found: " + locationId));

        requireAccess(location.getTripDay().getTrip(), email);

        locationRepository.delete(location);
        log.info("Location deleted: {} by: {}", locationId, email);
    }

    private void requireAccess(Trip trip, String email) {
        if (!tripService.hasMemberAccess(trip, email)) {
            throw CustomException.forbidden("이 여행을 수정할 권한이 없습니다.");
        }
    }

    private LocationResponse mapToResponse(Location location) {
        return LocationResponse.builder()
                .id(location.getId())
                .name(location.getName())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .orderIndex(location.getOrderIndex())
                .category(location.getCategory())
                .memo(location.getMemo())
                .build();
    }
}
