package com.rideforce.domain;

public class MatchRecommendation {
    private Long riderId;
    private String riderName;
    private String pickupLocation;
    private String destination;
    private Long driverId;
    private String driverName;
    private String driverLocation;
    private int driverCapacity;
    private int score;

    public MatchRecommendation() {}

    public MatchRecommendation(Long riderId, String riderName, String pickupLocation, String destination,
                               Long driverId, String driverName, String driverLocation, int driverCapacity, int score) {
        this.riderId = riderId;
        this.riderName = riderName;
        this.pickupLocation = pickupLocation;
        this.destination = destination;
        this.driverId = driverId;
        this.driverName = driverName;
        this.driverLocation = driverLocation;
        this.driverCapacity = driverCapacity;
        this.score = score;
    }

    public Long getRiderId() {
        return riderId;
    }

    public void setRiderId(Long riderId) {
        this.riderId = riderId;
    }

    public String getRiderName() {
        return riderName;
    }

    public void setRiderName(String riderName) {
        this.riderName = riderName;
    }

    public String getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getDriverLocation() {
        return driverLocation;
    }

    public void setDriverLocation(String driverLocation) {
        this.driverLocation = driverLocation;
    }

    public int getDriverCapacity() {
        return driverCapacity;
    }

    public void setDriverCapacity(int driverCapacity) {
        this.driverCapacity = driverCapacity;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }
}
