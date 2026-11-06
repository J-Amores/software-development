package com.rideforce.domain;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final RideMatchingService rideMatchingService;

    public MatchController(RideMatchingService rideMatchingService) {
        this.rideMatchingService = rideMatchingService;
    }

    @GetMapping
    public List<MatchRecommendation> getMatches() {
        return rideMatchingService.findRankedMatches();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MatchDispatchResponse dispatchMatch(@RequestBody MatchDispatchRequest request) {
        return rideMatchingService.dispatchMatch(request.riderId(), request.driverId());
    }
}
