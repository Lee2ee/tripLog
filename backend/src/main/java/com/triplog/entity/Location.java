package com.triplog.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_day_id", nullable = false)
    private TripDay tripDay;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private Integer orderIndex;

    @Column
    private String category;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "transport_mode")
    private String transportMode; // DRIVING, WALKING, TRANSIT, BICYCLING (이전 장소에서 이 장소까지의 이동 수단)
}
