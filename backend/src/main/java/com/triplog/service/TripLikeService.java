package com.triplog.service;

import com.triplog.entity.Trip;
import com.triplog.entity.TripLike;
import com.triplog.entity.User;
import com.triplog.exception.CustomException;
import com.triplog.repository.TripLikeRepository;
import com.triplog.repository.TripRepository;
import com.triplog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TripLikeService {

    private final TripLikeRepository tripLikeRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    @Transactional
    public Map<String, Object> toggle(UUID tripId, String email) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> CustomException.notFound("Trip not found"));
        if (!trip.isPublic()) throw CustomException.forbidden("비공개 여행에는 좋아요를 누를 수 없습니다.");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("User not found"));

        boolean liked;
        tripLikeRepository.findByUserIdAndTripId(user.getId(), tripId)
                .ifPresentOrElse(
                        like -> tripLikeRepository.delete(like),
                        () -> tripLikeRepository.save(TripLike.builder().user(user).trip(trip).build())
                );
        liked = tripLikeRepository.existsByUserIdAndTripId(user.getId(), tripId);
        long count = tripLikeRepository.countByTripId(tripId);
        return Map.of("liked", liked, "likeCount", count);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStatus(UUID tripId, String email) {
        long count = tripLikeRepository.countByTripId(tripId);
        boolean liked = false;
        if (email != null) {
            liked = userRepository.findByEmail(email)
                    .map(u -> tripLikeRepository.existsByUserIdAndTripId(u.getId(), tripId))
                    .orElse(false);
        }
        return Map.of("liked", liked, "likeCount", count);
    }
}
