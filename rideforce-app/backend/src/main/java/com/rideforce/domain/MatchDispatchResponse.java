package com.rideforce.domain;

import java.time.Instant;

public record MatchDispatchResponse(Long id, Long riderId, Long driverId, String status, Instant createdAt) {
}
