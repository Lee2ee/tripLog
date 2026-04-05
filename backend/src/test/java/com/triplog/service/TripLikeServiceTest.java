package com.triplog.service;

import com.triplog.entity.Trip;
import com.triplog.entity.TripLike;
import com.triplog.entity.User;
import com.triplog.exception.CustomException;
import com.triplog.repository.TripLikeRepository;
import com.triplog.repository.TripRepository;
import com.triplog.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripLikeServiceTest {

    @Mock TripLikeRepository tripLikeRepository;
    @Mock TripRepository tripRepository;
    @Mock UserRepository userRepository;

    @InjectMocks TripLikeService tripLikeService;

    private UUID tripId;
    private User user;
    private Trip publicTrip;
    private Trip privateTrip;

    @BeforeEach
    void setUp() {
        tripId = UUID.randomUUID();
        user = User.builder().id(1L).email("user@test.com").nickname("tester").build();
        publicTrip = Trip.builder().id(tripId).user(user).title("공개여행")
                .startDate(LocalDate.now()).endDate(LocalDate.now().plusDays(3))
                .isPublic(true).build();
        privateTrip = Trip.builder().id(tripId).user(user).title("비공개여행")
                .startDate(LocalDate.now()).endDate(LocalDate.now().plusDays(3))
                .isPublic(false).build();
    }

    @Test
    @DisplayName("좋아요 토글 - 처음 누를 때 좋아요 추가")
    void toggle_addLike() {
        given(tripRepository.findById(tripId)).willReturn(Optional.of(publicTrip));
        given(userRepository.findByEmail(user.getEmail())).willReturn(Optional.of(user));
        given(tripLikeRepository.findByUserIdAndTripId(user.getId(), tripId)).willReturn(Optional.empty());
        given(tripLikeRepository.existsByUserIdAndTripId(user.getId(), tripId)).willReturn(true);
        given(tripLikeRepository.countByTripId(tripId)).willReturn(1L);

        Map<String, Object> result = tripLikeService.toggle(tripId, user.getEmail());

        assertThat(result.get("liked")).isEqualTo(true);
        assertThat(result.get("likeCount")).isEqualTo(1L);
        verify(tripLikeRepository).save(any(TripLike.class));
    }

    @Test
    @DisplayName("좋아요 토글 - 이미 눌렀을 때 좋아요 취소")
    void toggle_removeLike() {
        TripLike existingLike = TripLike.builder().id(1L).user(user).trip(publicTrip).build();
        given(tripRepository.findById(tripId)).willReturn(Optional.of(publicTrip));
        given(userRepository.findByEmail(user.getEmail())).willReturn(Optional.of(user));
        given(tripLikeRepository.findByUserIdAndTripId(user.getId(), tripId)).willReturn(Optional.of(existingLike));
        given(tripLikeRepository.existsByUserIdAndTripId(user.getId(), tripId)).willReturn(false);
        given(tripLikeRepository.countByTripId(tripId)).willReturn(0L);

        Map<String, Object> result = tripLikeService.toggle(tripId, user.getEmail());

        assertThat(result.get("liked")).isEqualTo(false);
        assertThat(result.get("likeCount")).isEqualTo(0L);
        verify(tripLikeRepository).delete(existingLike);
    }

    @Test
    @DisplayName("좋아요 토글 - 비공개 여행이면 예외 발생")
    void toggle_privateTrip_throwsForbidden() {
        given(tripRepository.findById(tripId)).willReturn(Optional.of(privateTrip));

        assertThatThrownBy(() -> tripLikeService.toggle(tripId, user.getEmail()))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("비공개");
    }

    @Test
    @DisplayName("좋아요 토글 - 존재하지 않는 여행이면 예외 발생")
    void toggle_tripNotFound_throwsNotFound() {
        given(tripRepository.findById(tripId)).willReturn(Optional.empty());

        assertThatThrownBy(() -> tripLikeService.toggle(tripId, user.getEmail()))
                .isInstanceOf(CustomException.class);
    }

    @Test
    @DisplayName("좋아요 상태 조회 - 로그인 사용자, 좋아요 누름")
    void getStatus_loggedIn_liked() {
        given(tripLikeRepository.countByTripId(tripId)).willReturn(5L);
        given(userRepository.findByEmail(user.getEmail())).willReturn(Optional.of(user));
        given(tripLikeRepository.existsByUserIdAndTripId(user.getId(), tripId)).willReturn(true);

        Map<String, Object> result = tripLikeService.getStatus(tripId, user.getEmail());

        assertThat(result.get("liked")).isEqualTo(true);
        assertThat(result.get("likeCount")).isEqualTo(5L);
    }

    @Test
    @DisplayName("좋아요 상태 조회 - 비로그인 사용자 (liked=false)")
    void getStatus_anonymous() {
        given(tripLikeRepository.countByTripId(tripId)).willReturn(3L);

        Map<String, Object> result = tripLikeService.getStatus(tripId, null);

        assertThat(result.get("liked")).isEqualTo(false);
        assertThat(result.get("likeCount")).isEqualTo(3L);
        verifyNoInteractions(userRepository);
    }
}
