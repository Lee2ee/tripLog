package com.triplog.service;

import com.triplog.dto.request.WishlistRequest;
import com.triplog.dto.response.WishlistResponse;
import com.triplog.entity.User;
import com.triplog.entity.Wishlist;
import com.triplog.exception.CustomException;
import com.triplog.repository.UserRepository;
import com.triplog.repository.WishlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class WishlistServiceTest {

    @Mock WishlistRepository wishlistRepository;
    @Mock UserRepository userRepository;

    @InjectMocks WishlistService wishlistService;

    private User user;
    private Wishlist wishlist;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).email("user@test.com").nickname("tester").build();
        wishlist = Wishlist.builder()
                .id(10L).user(user)
                .name("경복궁").latitude(37.579617).longitude(126.977041)
                .address("서울 종로구").memo("꼭 가보기")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("위시리스트 전체 조회")
    void getAll_returnsUserWishlists() {
        given(userRepository.findByEmail(user.getEmail())).willReturn(Optional.of(user));
        given(wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId())).willReturn(List.of(wishlist));

        List<WishlistResponse> result = wishlistService.getAll(user.getEmail());

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("경복궁");
        assertThat(result.get(0).getLatitude()).isEqualTo(37.579617);
    }

    @Test
    @DisplayName("위시리스트 추가")
    void add_savesAndReturnsItem() {
        WishlistRequest req = new WishlistRequest();
        ReflectionTestUtils.setField(req, "name", "남산타워");
        ReflectionTestUtils.setField(req, "latitude", 37.5512);
        ReflectionTestUtils.setField(req, "longitude", 126.9882);
        ReflectionTestUtils.setField(req, "address", "서울 용산구");
        ReflectionTestUtils.setField(req, "memo", "야경 보기");

        Wishlist saved = Wishlist.builder()
                .id(20L).user(user)
                .name("남산타워").latitude(37.5512).longitude(126.9882)
                .address("서울 용산구").memo("야경 보기")
                .createdAt(LocalDateTime.now())
                .build();

        given(userRepository.findByEmail(user.getEmail())).willReturn(Optional.of(user));
        given(wishlistRepository.save(any(Wishlist.class))).willReturn(saved);

        WishlistResponse result = wishlistService.add(req, user.getEmail());

        assertThat(result.getName()).isEqualTo("남산타워");
        assertThat(result.getId()).isEqualTo(20L);
        verify(wishlistRepository).save(any(Wishlist.class));
    }

    @Test
    @DisplayName("위시리스트 삭제 - 본인 항목 삭제 성공")
    void delete_ownItem_success() {
        given(wishlistRepository.findById(10L)).willReturn(Optional.of(wishlist));

        wishlistService.delete(10L, user.getEmail());

        verify(wishlistRepository).delete(wishlist);
    }

    @Test
    @DisplayName("위시리스트 삭제 - 타인 항목 삭제 시 예외")
    void delete_otherUserItem_throwsForbidden() {
        given(wishlistRepository.findById(10L)).willReturn(Optional.of(wishlist));

        assertThatThrownBy(() -> wishlistService.delete(10L, "other@test.com"))
                .isInstanceOf(CustomException.class);
    }

    @Test
    @DisplayName("위시리스트 삭제 - 존재하지 않는 항목이면 예외")
    void delete_notFound_throwsException() {
        given(wishlistRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> wishlistService.delete(99L, user.getEmail()))
                .isInstanceOf(CustomException.class);
    }

    @Test
    @DisplayName("존재하지 않는 사용자 조회 시 예외")
    void getAll_userNotFound_throwsException() {
        given(userRepository.findByEmail("ghost@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> wishlistService.getAll("ghost@test.com"))
                .isInstanceOf(CustomException.class);
    }
}
