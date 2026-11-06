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
class RideMatchingIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void matchesEndpointPairsWaitingRidersOnlyWithAvailableDriversHavingCapacity() {
        ResponseEntity<List<Map<String, Object>>> matchesResponse = restTemplate.exchange(
                "/api/matches",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
        );

        assertThat(matchesResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> matches = matchesResponse.getBody();
        assertThat(matches).isNotNull().hasSize(2);

        // David Miller (Downtown) should be paired with Alice Johnson (Downtown, capacity 3, AVAILABLE)
        Map<String, Object> firstMatch = matches.get(0);
        assertThat(firstMatch.get("riderId")).isEqualTo(1);
        assertThat(firstMatch.get("riderName")).isEqualTo("David Miller");
        assertThat(firstMatch.get("driverId")).isEqualTo(1);
        assertThat(firstMatch.get("driverName")).isEqualTo("Alice Johnson");

        // Emma Wilson (Uptown) should be paired with Bob Smith (Uptown, capacity 4, AVAILABLE)
        Map<String, Object> secondMatch = matches.get(1);
        assertThat(secondMatch.get("riderId")).isEqualTo(2);
        assertThat(secondMatch.get("riderName")).isEqualTo("Emma Wilson");
        assertThat(secondMatch.get("driverId")).isEqualTo(2);
        assertThat(secondMatch.get("driverName")).isEqualTo("Bob Smith");

        // Verify driver 3 (Carol Davis, BUSY, capacity 0) is never paired
        assertThat(matches).noneMatch(m -> Integer.valueOf(3).equals(m.get("driverId")));
    }
}
