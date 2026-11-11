package com.rideforce.domain;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MatchController {

    private final RideMatchingService rideMatchingService;

    public MatchController(RideMatchingService rideMatchingService) {
        this.rideMatchingService = rideMatchingService;
    }

    @GetMapping("/matches")
    public List<MatchRecommendation> getMatches() {
        return rideMatchingService.findRankedMatches();
    }

    @GetMapping("/matches/confirmed")
    public List<RideMatch> getConfirmedMatches() {
        return rideMatchingService.getConfirmedMatches();
    }

    @PostMapping("/matches")
    @ResponseStatus(HttpStatus.CREATED)
    public MatchDispatchResponse dispatchMatch(@RequestBody MatchDispatchRequest request) {
        return rideMatchingService.dispatchMatch(request.riderId(), request.driverId());
    }

    @PostMapping("/reset")
    public Map<String, String> resetDemoData() {
        rideMatchingService.resetDemoData();
        return Map.of(
                "status", "SUCCESS",
                "message", "Fleet, riders, and matches reset to initial demo state."
        );
    }
}
