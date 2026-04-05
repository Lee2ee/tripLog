package com.triplog.service;

import com.triplog.dto.request.WishlistRequest;
import com.triplog.dto.response.WishlistResponse;
import com.triplog.entity.User;
import com.triplog.entity.Wishlist;
import com.triplog.exception.CustomException;
import com.triplog.repository.UserRepository;
import com.triplog.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<WishlistResponse> getAll(String email) {
        User user = findUser(email);
        return wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public WishlistResponse add(WishlistRequest req, String email) {
        User user = findUser(email);
        Wishlist w = Wishlist.builder()
                .user(user)
                .name(req.getName())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .address(req.getAddress())
                .memo(req.getMemo())
                .build();
        return toResponse(wishlistRepository.save(w));
    }

    @Transactional
    public void delete(Long id, String email) {
        Wishlist w = wishlistRepository.findById(id)
                .orElseThrow(() -> CustomException.notFound("Wishlist item not found: " + id));
        if (!w.getUser().getEmail().equals(email)) throw CustomException.forbidden("No permission");
        wishlistRepository.delete(w);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("User not found"));
    }

    private WishlistResponse toResponse(Wishlist w) {
        return WishlistResponse.builder()
                .id(w.getId()).name(w.getName())
                .latitude(w.getLatitude()).longitude(w.getLongitude())
                .address(w.getAddress()).memo(w.getMemo())
                .createdAt(w.getCreatedAt()).build();
    }
}
