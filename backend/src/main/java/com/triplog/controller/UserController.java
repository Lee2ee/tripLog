package com.triplog.controller;

import com.triplog.dto.response.ApiResponse;
import com.triplog.dto.response.TripMemberResponse;
import com.triplog.entity.User;
import com.triplog.exception.CustomException;
import com.triplog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TripMemberResponse>>> searchUsers(
            @RequestParam String q,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (q == null || q.trim().length() < 1) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }

        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> CustomException.notFound("User not found"));

        List<TripMemberResponse> results = userRepository
                .searchByNickname(q.trim(), currentUser.getId())
                .stream()
                .limit(10)
                .map(u -> TripMemberResponse.builder()
                        .id(u.getId())
                        .email(u.getEmail())
                        .nickname(u.getNickname())
                        .build())
                .toList();

        return ResponseEntity.ok(ApiResponse.success(results));
    }
}
