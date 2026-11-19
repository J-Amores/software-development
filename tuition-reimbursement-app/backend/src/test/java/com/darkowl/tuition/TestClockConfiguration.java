package com.darkowl.tuition;

import com.darkowl.tuition.platform.EmployerProperties;
import java.time.Instant;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Puts a clock the tests can set in front of the real one (seam 2).
 *
 * <p>It is {@code @Primary} rather than relying on the production clock's
 * {@code @ConditionalOnMissingBean}: that condition sits in an ordinary
 * {@code @Configuration} class, so which bean wins would depend on the order the
 * two were registered in.
 *
 * <p>This class sits in the application's own base package, so component scanning
 * finds it in every test that starts the context, and ApplicationModules does not
 * mistake it for a seventh domain module.
 */
@Configuration
class TestClockConfiguration {

  /** A Wednesday, in the middle of a Program Year, with nothing special about it. */
  static final Instant DEFAULT_NOW = Instant.parse("2026-11-18T12:00:00Z");

  @Bean
  @Primary
  SettableClock clock(EmployerProperties employer) {
    return new SettableClock(ZoneId.of(employer.timeZone()), DEFAULT_NOW);
  }
}
