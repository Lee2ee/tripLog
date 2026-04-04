package com.triplog.repository;

import com.triplog.entity.LocationImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationImageRepository extends JpaRepository<LocationImage, Long> {
    List<LocationImage> findByLocationId(Long locationId);
    long countByLocationId(Long locationId);
}
