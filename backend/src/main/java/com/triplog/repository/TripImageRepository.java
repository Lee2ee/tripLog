package com.triplog.repository;

import com.triplog.entity.TripImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TripImageRepository extends JpaRepository<TripImage, Long> {
    List<TripImage> findByTripId(UUID tripId);
    long countByTripId(UUID tripId);
    Optional<TripImage> findFirstByTripId(UUID tripId);

    @Query("SELECT COUNT(i) FROM TripImage i WHERE i.trip.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);
}
