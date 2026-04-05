package com.triplog.controller;

import com.triplog.dto.response.ApiResponse;
import com.triplog.dto.response.UserProfileResponse;
import com.triplog.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(userProfileService.getProfile(userDetails.getUsername())));
    }

    @PatchMapping("/profile/nickname")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateNickname(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String nickname = body.get("nickname");
        UserProfileResponse profile = userProfileService.updateNickname(userDetails.getUsername(), nickname);
        return ResponseEntity.ok(ApiResponse.success("닉네임이 변경되었습니다.", profile));
    }
}
