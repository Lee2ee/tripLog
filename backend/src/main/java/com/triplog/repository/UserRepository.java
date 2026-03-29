package com.triplog.repository;

import com.triplog.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.nickname LIKE %:q% AND u.id != :excludeId ORDER BY u.nickname")
    List<User> searchByNickname(@Param("q") String q, @Param("excludeId") Long excludeId);
}
