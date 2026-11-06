package com.rideforce.domain;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class RideMatchingService {

    private final DriverRepository driverRepository;
    private final RiderRepository riderRepository;
    private final RideMatchRepository rideMatchRepository;

    public RideMatchingService(DriverRepository driverRepository,
                               RiderRepository riderRepository,
                               RideMatchRepository rideMatchRepository) {
        this.driverRepository = driverRepository;
        this.riderRepository = riderRepository;
        this.rideMatchRepository = rideMatchRepository;
    }

    public List<MatchRecommendation> findRankedMatches() {
        List<Rider> riders = riderRepository.findAll();
        List<Driver> availableDrivers = driverRepository.findByStatusAndCapacityGreaterThan("AVAILABLE", 0);

        List<MatchRecommendation> recommendations = new ArrayList<>();

        for (Rider rider : riders) {
            availableDrivers.stream()
                    .min(Comparator
                            .<Driver, Boolean>comparing(d -> !d.getLocation().equalsIgnoreCase(rider.getPickupLocation()))
                            .thenComparing(Comparator.comparingInt(Driver::getCapacity).reversed()))
                    .ifPresent(bestDriver -> {
                        int score = bestDriver.getLocation().equalsIgnoreCase(rider.getPickupLocation()) ? 100 : 50;
                        recommendations.add(new MatchRecommendation(
                                rider.getId(),
                                rider.getName(),
                                rider.getPickupLocation(),
                                rider.getDestination(),
                                bestDriver.getId(),
                                bestDriver.getName(),
                                bestDriver.getLocation(),
                                bestDriver.getCapacity(),
                                score
                        ));
                    });
        }

        return recommendations;
    }

    @Transactional
    public MatchDispatchResponse dispatchMatch(Long riderId, Long driverId) {
        Rider rider = riderRepository.findById(riderId)
                .orElseThrow(() -> new IllegalArgumentException("Rider not found with id: " + riderId));
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found with id: " + driverId));

        if (!"AVAILABLE".equalsIgnoreCase(driver.getStatus()) || driver.getCapacity() <= 0) {
            throw new IllegalStateException("Driver is not available for dispatch");
        }

        int newCapacity = driver.getCapacity() - 1;
        driver.setCapacity(newCapacity);
        if (newCapacity == 0) {
            driver.setStatus("BUSY");
        }
        driverRepository.save(driver);

        RideMatch match = new RideMatch(rider, driver, "CONFIRMED", Instant.now());
        RideMatch saved = rideMatchRepository.save(match);

        return new MatchDispatchResponse(saved.getId(), rider.getId(), driver.getId(), saved.getStatus(), saved.getCreatedAt());
    }
}
