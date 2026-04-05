package com.triplog.repository;

import com.triplog.entity.MapsApiUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MapsApiUsageRepository extends JpaRepository<MapsApiUsage, Long> {

    Optional<MapsApiUsage> findByUsageDateAndApiType(LocalDate usageDate, String apiType);

    @Query("SELECT COALESCE(SUM(u.callCount), 0) FROM MapsApiUsage u " +
           "WHERE u.usageDate BETWEEN :from AND :to AND u.apiType = :apiType")
    int sumCallCount(@Param("from") LocalDate from,
                     @Param("to") LocalDate to,
                     @Param("apiType") String apiType);

    @Query("SELECT u FROM MapsApiUsage u WHERE u.usageDate BETWEEN :from AND :to ORDER BY u.usageDate ASC")
    List<MapsApiUsage> findByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
