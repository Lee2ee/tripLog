package com.triplog.repository;

import com.triplog.entity.TripImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TripImageRepository extends JpaRepository<TripImage, Long> {
    List<TripImage> findByTripId(UUID tripId);
    long countByTripId(UUID tripId);
    Optional<TripImage> findFirstByTripId(UUID tripId);
}
