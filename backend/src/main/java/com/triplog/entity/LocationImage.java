package com.triplog.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "location_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(nullable = false)
    private String imageUrl;
}
