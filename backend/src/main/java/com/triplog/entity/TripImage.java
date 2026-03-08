package com.triplog.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trip_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Column(nullable = false)
    private String imageUrl;
}
