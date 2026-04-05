package com.triplog.controller;

import com.triplog.dto.request.WishlistRequest;
import com.triplog.dto.response.ApiResponse;
import com.triplog.dto.response.WishlistResponse;
import com.triplog.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlists")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WishlistResponse>>> getAll(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(wishlistService.getAll(userDetails.getUsername())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WishlistResponse>> add(
            @RequestBody WishlistRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        WishlistResponse item = wishlistService.add(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(item));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        wishlistService.delete(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다.", null));
    }
}
