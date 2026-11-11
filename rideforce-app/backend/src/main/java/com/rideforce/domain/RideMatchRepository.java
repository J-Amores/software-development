package com.rideforce.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RideMatchRepository extends JpaRepository<RideMatch, Long> {
}
