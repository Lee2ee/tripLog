package com.triplog.repository;

import com.triplog.entity.TripLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TripLikeRepository extends JpaRepository<TripLike, Long> {
    long countByTripId(UUID tripId);
    boolean existsByUserIdAndTripId(Long userId, UUID tripId);
    Optional<TripLike> findByUserIdAndTripId(Long userId, UUID tripId);
}
