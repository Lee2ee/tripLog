package com.triplog.repository;

import com.triplog.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    List<Location> findByTripDayIdOrderByOrderIndex(Long tripDayId);

    long countByTripDayId(Long tripDayId);
}
