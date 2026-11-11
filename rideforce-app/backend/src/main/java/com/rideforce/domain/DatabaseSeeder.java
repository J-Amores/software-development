package com.rideforce.domain;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseSeeder implements ApplicationRunner {

    private final DriverRepository driverRepository;
    private final RiderRepository riderRepository;

    public DatabaseSeeder(DriverRepository driverRepository, RiderRepository riderRepository) {
        this.driverRepository = driverRepository;
        this.riderRepository = riderRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (driverRepository.count() == 0) {
            driverRepository.saveAll(List.of(
                    new Driver(null, "Alice Johnson", 3, "Downtown", "AVAILABLE"),
                    new Driver(null, "Bob Smith", 4, "Uptown", "AVAILABLE"),
                    new Driver(null, "Carol Davis", 0, "Midtown", "BUSY")
            ));
        }

        if (riderRepository.count() == 0) {
            riderRepository.saveAll(List.of(
                    new Rider(null, "David Miller", "Downtown", "Airport"),
                    new Rider(null, "Emma Wilson", "Uptown", "Suburbs")
            ));
        }
    }
}
