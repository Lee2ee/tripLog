package com.triplog.service;

import com.triplog.dto.response.ImageResponse;
import com.triplog.entity.Trip;
import com.triplog.entity.TripImage;
import com.triplog.exception.CustomException;
import com.triplog.repository.TripImageRepository;
import com.triplog.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageService {

    private final TripImageRepository tripImageRepository;
    private final TripRepository tripRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Transactional
    public ImageResponse saveImage(Long tripId, MultipartFile file, String email) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> CustomException.notFound("Trip not found with id: " + tripId));

        if (!trip.getUser().getEmail().equals(email)) {
            throw CustomException.forbidden("You do not have permission to upload images to this trip");
        }

        if (file == null || file.isEmpty()) {
            throw CustomException.badRequest("File is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw CustomException.badRequest("Only image files are allowed");
        }

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID() + extension;

            Path targetLocation = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = "/uploads/" + filename;

            TripImage tripImage = TripImage.builder()
                    .trip(trip)
                    .imageUrl(imageUrl)
                    .build();

            tripImage = tripImageRepository.save(tripImage);
            log.info("Image saved: {} for trip: {}", filename, tripId);

            return ImageResponse.builder()
                    .id(tripImage.getId())
                    .imageUrl(tripImage.getImageUrl())
                    .build();

        } catch (IOException ex) {
            log.error("Failed to store image file: {}", ex.getMessage());
            throw CustomException.badRequest("Failed to store image file: " + ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<ImageResponse> getImages(Long tripId, String email) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> CustomException.notFound("Trip not found with id: " + tripId));

        if (!trip.getUser().getEmail().equals(email)) {
            throw CustomException.forbidden("You do not have permission to view images of this trip");
        }

        return tripImageRepository.findByTripId(tripId)
                .stream()
                .map(img -> ImageResponse.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .build())
                .collect(Collectors.toList());
    }
}
