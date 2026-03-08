package com.triplog.controller;

import com.triplog.dto.response.ApiResponse;
import com.triplog.dto.response.ImageResponse;
import com.triplog.service.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ImageResponse>> uploadImage(
            @PathVariable Long tripId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        ImageResponse image = imageService.saveImage(tripId, file, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Image uploaded successfully", image));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ImageResponse>>> getImages(
            @PathVariable Long tripId,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ImageResponse> images = imageService.getImages(tripId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(images));
    }
}
