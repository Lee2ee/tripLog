package com.triplog.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trip_likes",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "trip_id"}))
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;
}
