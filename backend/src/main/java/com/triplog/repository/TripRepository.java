package com.triplog.repository;

import com.triplog.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TripRepository extends JpaRepository<Trip, UUID> {

    List<Trip> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT DISTINCT t FROM Trip t JOIN t.members m WHERE m.id = :userId ORDER BY t.createdAt DESC")
    List<Trip> findMemberTripsByUserId(@Param("userId") Long userId);

    List<Trip> findByIsPublicTrueOrderByCreatedAtDesc();

    long countByUserId(Long userId);
}
