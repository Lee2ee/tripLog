package com.triplog.service;

import com.triplog.dto.response.UserProfileResponse;
import com.triplog.entity.User;
import com.triplog.exception.CustomException;
import com.triplog.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final LocationRepository locationRepository;
    private final TripImageRepository tripImageRepository;
    private final WishlistRepository wishlistRepository;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("User not found"));
        long tripCount = tripRepository.countByUserId(user.getId());
        long imageCount = tripImageRepository.countByUserId(user.getId());
        long wishlistCount = wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).size();

        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .provider(user.getProvider().name())
                .createdAt(user.getCreatedAt())
                .tripCount(tripCount)
                .imageCount(imageCount)
                .wishlistCount(wishlistCount)
                .build();
    }

    @Transactional
    public UserProfileResponse updateNickname(String email, String nickname) {
        if (nickname == null || nickname.isBlank() || nickname.length() < 2 || nickname.length() > 20)
            throw CustomException.badRequest("닉네임은 2~20자 사이여야 합니다.");
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("User not found"));
        user.setNickname(nickname.trim());
        userRepository.save(user);
        return getProfile(email);
    }
}
