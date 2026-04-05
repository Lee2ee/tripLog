package com.triplog.service;

import com.triplog.dto.response.UserProfileResponse;
import com.triplog.entity.User;
import com.triplog.entity.Wishlist;
import com.triplog.exception.CustomException;
import com.triplog.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock UserRepository userRepository;
    @Mock TripRepository tripRepository;
    @Mock LocationRepository locationRepository;
    @Mock TripImageRepository tripImageRepository;
    @Mock WishlistRepository wishlistRepository;

    @InjectMocks UserProfileService userProfileService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L).email("user@test.com").nickname("tester")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("프로필 조회 - 통계 포함 정상 반환")
    void getProfile_returnsProfileWithStats() {
        Wishlist w1 = Wishlist.builder().id(1L).user(user).name("장소1")
                .latitude(37.0).longitude(127.0).createdAt(LocalDateTime.now()).build();
        Wishlist w2 = Wishlist.builder().id(2L).user(user).name("장소2")
                .latitude(38.0).longitude(128.0).createdAt(LocalDateTime.now()).build();

        given(userRepository.findByEmail(user.getEmail())).willReturn(Optional.of(user));
        given(tripRepository.countByUserId(user.getId())).willReturn(5L);
        given(tripImageRepository.countByUserId(user.getId())).willReturn(12L);
        given(wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId())).willReturn(List.of(w1, w2));

        UserProfileResponse result = userProfileService.getProfile(user.getEmail());

        assertThat(result.getEmail()).isEqualTo("user@test.com");
        assertThat(result.getNickname()).isEqualTo("tester");
        assertThat(result.getTripCount()).isEqualTo(5L);
        assertThat(result.getImageCount()).isEqualTo(12L);
        assertThat(result.getWishlistCount()).isEqualTo(2L);
    }

    @Test
    @DisplayName("프로필 조회 - 존재하지 않는 사용자이면 예외")
    void getProfile_userNotFound_throwsException() {
        given(userRepository.findByEmail("ghost@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> userProfileService.getProfile("ghost@test.com"))
                .isInstanceOf(CustomException.class);
    }

    @Test
    @DisplayName("닉네임 변경 - 정상 변경")
    void updateNickname_success() {
        given(userRepository.findByEmail(user.getEmail())).willReturn(Optional.of(user));
        given(tripRepository.countByUserId(user.getId())).willReturn(0L);
        given(tripImageRepository.countByUserId(user.getId())).willReturn(0L);
        given(wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId())).willReturn(List.of());

        UserProfileResponse result = userProfileService.updateNickname(user.getEmail(), "새닉네임");

        assertThat(result.getNickname()).isEqualTo("새닉네임");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("닉네임 변경 - 1자이면 예외")
    void updateNickname_tooShort_throwsException() {
        assertThatThrownBy(() -> userProfileService.updateNickname(user.getEmail(), "a"))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("2~20자");
    }

    @Test
    @DisplayName("닉네임 변경 - 21자이면 예외")
    void updateNickname_tooLong_throwsException() {
        String longNick = "a".repeat(21);
        assertThatThrownBy(() -> userProfileService.updateNickname(user.getEmail(), longNick))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("2~20자");
    }

    @Test
    @DisplayName("닉네임 변경 - null이면 예외")
    void updateNickname_null_throwsException() {
        assertThatThrownBy(() -> userProfileService.updateNickname(user.getEmail(), null))
                .isInstanceOf(CustomException.class);
    }

    @Test
    @DisplayName("닉네임 변경 - 공백만 있으면 예외")
    void updateNickname_blank_throwsException() {
        assertThatThrownBy(() -> userProfileService.updateNickname(user.getEmail(), "   "))
                .isInstanceOf(CustomException.class);
    }
}
