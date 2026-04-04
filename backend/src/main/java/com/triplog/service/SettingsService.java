package com.triplog.service;

import com.triplog.dto.request.AppSettingsRequest;
import com.triplog.dto.response.AppSettingsResponse;
import com.triplog.entity.AppSettings;
import com.triplog.repository.AppSettingsRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SettingsService {

    static final String KEY_MAX_TRIPS_PER_USER = "MAX_TRIPS_PER_USER";
    static final String KEY_MAX_LOCATIONS_PER_DAY = "MAX_LOCATIONS_PER_DAY";
    static final String KEY_MAX_IMAGES_PER_TRIP = "MAX_IMAGES_PER_TRIP";

    private final AppSettingsRepository settingsRepository;

    @PostConstruct
    @Transactional
    public void initDefaults() {
        seedIfAbsent(KEY_MAX_TRIPS_PER_USER, "100");
        seedIfAbsent(KEY_MAX_LOCATIONS_PER_DAY, "20");
        seedIfAbsent(KEY_MAX_IMAGES_PER_TRIP, "50");
        log.info("App settings initialized");
    }

    @Transactional(readOnly = true)
    public AppSettingsResponse getSettings() {
        return AppSettingsResponse.builder()
                .maxTripsPerUser(getInt(KEY_MAX_TRIPS_PER_USER, 100))
                .maxLocationsPerDay(getInt(KEY_MAX_LOCATIONS_PER_DAY, 20))
                .maxImagesPerTrip(getInt(KEY_MAX_IMAGES_PER_TRIP, 50))
                .build();
    }

    @Transactional
    public AppSettingsResponse updateSettings(AppSettingsRequest request) {
        set(KEY_MAX_TRIPS_PER_USER, request.getMaxTripsPerUser());
        set(KEY_MAX_LOCATIONS_PER_DAY, request.getMaxLocationsPerDay());
        set(KEY_MAX_IMAGES_PER_TRIP, request.getMaxImagesPerTrip());
        log.info("App settings updated: maxTrips={}, maxLocations={}, maxImages={}",
                request.getMaxTripsPerUser(), request.getMaxLocationsPerDay(), request.getMaxImagesPerTrip());
        return getSettings();
    }

    public int getMaxTripsPerUser() {
        return getInt(KEY_MAX_TRIPS_PER_USER, 100);
    }

    public int getMaxLocationsPerDay() {
        return getInt(KEY_MAX_LOCATIONS_PER_DAY, 20);
    }

    public int getMaxImagesPerTrip() {
        return getInt(KEY_MAX_IMAGES_PER_TRIP, 50);
    }

    private int getInt(String key, int defaultValue) {
        return settingsRepository.findById(key)
                .map(s -> {
                    try { return Integer.parseInt(s.getSettingValue()); }
                    catch (NumberFormatException e) { return defaultValue; }
                })
                .orElse(defaultValue);
    }

    private void set(String key, int value) {
        settingsRepository.save(new AppSettings(key, String.valueOf(value)));
    }

    private void seedIfAbsent(String key, String defaultValue) {
        if (!settingsRepository.existsById(key)) {
            settingsRepository.save(new AppSettings(key, defaultValue));
        }
    }
}
