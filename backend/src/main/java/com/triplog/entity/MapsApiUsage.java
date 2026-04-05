package com.triplog.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "maps_api_usage",
       uniqueConstraints = @UniqueConstraint(columnNames = {"usage_date", "api_type"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapsApiUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(name = "api_type", nullable = false, length = 20)
    private String apiType; // DIRECTIONS, PLACES

    @Column(nullable = false)
    private int callCount;
}
