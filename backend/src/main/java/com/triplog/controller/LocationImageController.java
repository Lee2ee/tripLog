package com.triplog.controller;

import com.triplog.dto.response.ApiResponse;
import com.triplog.dto.response.ImageResponse;
import com.triplog.service.LocationImageService;
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
@RequestMapping("/api/locations/{locationId}/images")
@RequiredArgsConstructor
public class LocationImageController {

    private final LocationImageService locationImageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ImageResponse>> uploadImage(
            @PathVariable Long locationId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        ImageResponse image = locationImageService.saveImage(locationId, file, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("사진이 업로드되었습니다.", image));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ImageResponse>>> getImages(
            @PathVariable Long locationId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(locationImageService.getImages(locationId)));
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @PathVariable Long locationId,
            @PathVariable Long imageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        locationImageService.deleteImage(imageId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("사진이 삭제되었습니다.", null));
    }
}
