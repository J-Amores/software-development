package com.darkowl.tuition.platform;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The application never calls {@code Instant.now()}: it reads the current date and
 * time from this clock, so tests can set it (Testing Decisions, seam 2) and so
 * Business Days are counted in the Employer's time zone.
 */
@Configuration
class ClockConfiguration {

  @Bean
  @ConditionalOnMissingBean
  Clock clock(EmployerProperties employer) {
    return Clock.system(ZoneId.of(employer.timeZone()));
  }
}
