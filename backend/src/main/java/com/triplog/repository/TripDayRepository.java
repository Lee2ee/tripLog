package com.triplog.repository;

import com.triplog.entity.TripDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TripDayRepository extends JpaRepository<TripDay, Long> {
    List<TripDay> findByTripIdOrderByDate(UUID tripId);
}
