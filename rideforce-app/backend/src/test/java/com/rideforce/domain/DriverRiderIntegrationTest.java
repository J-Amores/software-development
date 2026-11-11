package com.rideforce.domain;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DriverRiderIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void seededDriversAndRidersCanBeQueriedViaPublicHttpInterface() {
        // Query drivers
        ResponseEntity<List<Map<String, Object>>> driversResponse = restTemplate.exchange(
                "/api/drivers",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
        );
        assertThat(driversResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> drivers = driversResponse.getBody();
        assertThat(drivers).isNotNull().isNotEmpty();
        Map<String, Object> firstDriver = drivers.get(0);
        assertThat(firstDriver).containsKeys("id", "name", "capacity", "location", "status");
        assertThat(firstDriver.get("name")).isEqualTo("Alice Johnson");
        assertThat(firstDriver.get("capacity")).isEqualTo(3);
        assertThat(firstDriver.get("location")).isEqualTo("Downtown");
        assertThat(firstDriver.get("status")).isEqualTo("AVAILABLE");

        // Query riders
        ResponseEntity<List<Map<String, Object>>> ridersResponse = restTemplate.exchange(
                "/api/riders",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
        );
        assertThat(ridersResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> riders = ridersResponse.getBody();
        assertThat(riders).isNotNull().isNotEmpty();
        Map<String, Object> firstRider = riders.get(0);
        assertThat(firstRider).containsKeys("id", "name", "pickupLocation", "destination");
        assertThat(firstRider.get("name")).isEqualTo("David Miller");
        assertThat(firstRider.get("pickupLocation")).isEqualTo("Downtown");
        assertThat(firstRider.get("destination")).isEqualTo("Airport");
    }
}
