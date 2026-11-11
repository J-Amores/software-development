package com.rideforce.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ride_matches")
public class RideMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "rider_id", nullable = false)
    private Rider rider;

    @ManyToOne(optional = false)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private Instant createdAt;

    public RideMatch() {}

    public RideMatch(Rider rider, Driver driver, String status, Instant createdAt) {
        this.rider = rider;
        this.driver = driver;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    @JsonIgnore
    public Rider getRider() {
        return rider;
    }

    public void setRider(Rider rider) {
        this.rider = rider;
    }

    @JsonIgnore
    public Driver getDriver() {
        return driver;
    }

    public void setDriver(Driver driver) {
        this.driver = driver;
    }

    @JsonProperty("riderId")
    public Long getRiderId() {
        return rider != null ? rider.getId() : null;
    }

    @JsonProperty("driverId")
    public Long getDriverId() {
        return driver != null ? driver.getId() : null;
    }

    @JsonProperty("riderName")
    public String getRiderName() {
        return rider != null ? rider.getName() : null;
    }

    @JsonProperty("driverName")
    public String getDriverName() {
        return driver != null ? driver.getName() : null;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
