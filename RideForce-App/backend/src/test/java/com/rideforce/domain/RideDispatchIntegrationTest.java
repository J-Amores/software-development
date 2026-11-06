package com.rideforce.domain;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RideDispatchIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void dispatchingMatchPersistsConfirmedRecordAndMutatesDriverCapacityViaHttpInterface() {
        // Driver 1 starts with capacity 3, AVAILABLE
        Map<String, Object> request = Map.of(
                "riderId", 1,
                "driverId", 1
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        // 1. Dispatch match
        ResponseEntity<Map<String, Object>> dispatchResponse = restTemplate.exchange(
                "/api/matches",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(dispatchResponse.getStatusCode()).isIn(HttpStatus.CREATED, HttpStatus.OK);
        Map<String, Object> match = dispatchResponse.getBody();
        assertThat(match).isNotNull();
        assertThat(match.get("riderId")).isEqualTo(1);
        assertThat(match.get("driverId")).isEqualTo(1);
        assertThat(match.get("status")).isEqualTo("CONFIRMED");

        // 2. Query public GET /api/drivers to verify capacity mutated from 3 to 2
        ResponseEntity<List<Map<String, Object>>> driversResponse = restTemplate.exchange(
                "/api/drivers",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
        );
        assertThat(driversResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> drivers = driversResponse.getBody();
        assertThat(drivers).isNotNull();

        Map<String, Object> driver1 = drivers.stream()
                .filter(d -> Integer.valueOf(1).equals(d.get("id")))
                .findFirst()
                .orElseThrow();
        assertThat(driver1.get("capacity")).isEqualTo(2);
        assertThat(driver1.get("status")).isEqualTo("AVAILABLE");

        // 3. Dispatch two more matches for driver 1 to drive capacity to 0 and verify transition to BUSY
        restTemplate.exchange("/api/matches", HttpMethod.POST, entity, new ParameterizedTypeReference<>() {});
        restTemplate.exchange("/api/matches", HttpMethod.POST, entity, new ParameterizedTypeReference<>() {});

        ResponseEntity<List<Map<String, Object>>> updatedDriversResponse = restTemplate.exchange(
                "/api/drivers",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
        );
        List<Map<String, Object>> updatedDrivers = updatedDriversResponse.getBody();
        assertThat(updatedDrivers).isNotNull();
        Map<String, Object> busyDriver = updatedDrivers.stream()
                .filter(d -> Integer.valueOf(1).equals(d.get("id")))
                .findFirst()
                .orElseThrow();
        assertThat(busyDriver.get("capacity")).isEqualTo(0);
        assertThat(busyDriver.get("status")).isEqualTo("BUSY");
    }
}
