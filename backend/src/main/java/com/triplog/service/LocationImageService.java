package com.triplog.service;

import com.triplog.dto.response.ImageResponse;
import com.triplog.entity.Location;
import com.triplog.entity.LocationImage;
import com.triplog.exception.CustomException;
import com.triplog.repository.LocationImageRepository;
import com.triplog.repository.LocationRepository;
import com.triplog.util.UploadRateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationImageService {

    private static final int MAX_IMAGES_PER_LOCATION = 10;

    private final LocationImageRepository locationImageRepository;
    private final LocationRepository locationRepository;
    private final TripService tripService;
    private final UploadRateLimiter uploadRateLimiter;
    private final StorageService storageService;

    @Transactional
    public ImageResponse saveImage(Long locationId, MultipartFile file, String email) {
        Location location = findLocation(locationId);
        requireAccess(location, email);

        if (!uploadRateLimiter.tryAcquire(email)) {
            throw CustomException.tooManyRequests("업로드 요청이 너무 많습니다. 잠시 후 다시 시도하세요.");
        }

        long count = locationImageRepository.countByLocationId(locationId);
        if (count >= MAX_IMAGES_PER_LOCATION) {
            throw CustomException.badRequest("장소당 최대 " + MAX_IMAGES_PER_LOCATION + "장까지 업로드할 수 있습니다.");
        }

        String imageUrl = storageService.upload(file, "locations/" + locationId);

        LocationImage image = locationImageRepository.save(
                LocationImage.builder().location(location).imageUrl(imageUrl).build()
        );
        log.info("Location image uploaded for location: {}", locationId);
        return toResponse(image);
    }

    @Transactional(readOnly = true)
    public List<ImageResponse> getImages(Long locationId) {
        findLocation(locationId);
        return locationImageRepository.findByLocationId(locationId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteImage(Long imageId, String email) {
        LocationImage image = locationImageRepository.findById(imageId)
                .orElseThrow(() -> CustomException.notFound("Image not found: " + imageId));
        requireAccess(image.getLocation(), email);
        locationImageRepository.delete(image);
        log.info("Location image deleted: {} by: {}", imageId, email);
    }

    private Location findLocation(Long locationId) {
        return locationRepository.findById(locationId)
                .orElseThrow(() -> CustomException.notFound("Location not found: " + locationId));
    }

    private void requireAccess(Location location, String email) {
        if (!tripService.hasMemberAccess(location.getTripDay().getTrip(), email)) {
            throw CustomException.forbidden("이 여행을 수정할 권한이 없습니다.");
        }
    }

    private ImageResponse toResponse(LocationImage image) {
        return ImageResponse.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .build();
    }
}
