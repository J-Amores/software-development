package com.rideforce.domain;

import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RideMatchingService {

    private final DriverRepository driverRepository;
    private final RiderRepository riderRepository;
    private final RideMatchRepository rideMatchRepository;
    private final EntityManager entityManager;

    public RideMatchingService(DriverRepository driverRepository,
                               RiderRepository riderRepository,
                               RideMatchRepository rideMatchRepository,
                               EntityManager entityManager) {
        this.driverRepository = driverRepository;
        this.riderRepository = riderRepository;
        this.rideMatchRepository = rideMatchRepository;
        this.entityManager = entityManager;
    }

    public List<MatchRecommendation> findRankedMatches() {
        List<Rider> allRiders = riderRepository.findAll();
        List<Driver> availableDrivers = driverRepository.findByStatusAndCapacityGreaterThan("AVAILABLE", 0);

        Set<Long> matchedRiderIds = rideMatchRepository.findAll().stream()
                .map(RideMatch::getRiderId)
                .collect(Collectors.toSet());

        List<Rider> waitingRiders = allRiders.stream()
                .filter(r -> !matchedRiderIds.contains(r.getId()))
                .toList();

        List<MatchRecommendation> recommendations = new ArrayList<>();

        for (Rider rider : waitingRiders) {
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

    public List<RideMatch> getConfirmedMatches() {
        return rideMatchRepository.findAll();
    }

    @Transactional
    public void resetDemoData() {
        entityManager.createNativeQuery("TRUNCATE TABLE ride_matches, drivers, riders RESTART IDENTITY CASCADE").executeUpdate();

        driverRepository.saveAll(List.of(
                new Driver(null, "Alice Johnson", 3, "Downtown", "AVAILABLE"),
                new Driver(null, "Bob Smith", 4, "Uptown", "AVAILABLE"),
                new Driver(null, "Carol Davis", 0, "Midtown", "BUSY")
        ));

        riderRepository.saveAll(List.of(
                new Rider(null, "David Miller", "Downtown", "Airport"),
                new Rider(null, "Emma Wilson", "Uptown", "Suburbs")
        ));
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
