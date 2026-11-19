package com.darkowl.tuition;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

/**
 * Seam 2: the clock the app reads, under the test's control. Every date rule in the
 * Program — whether a Course has already started, and later the Business Day
 * windows — is decided from this, so a test sets the day it wants rather than
 * waiting for it.
 *
 * <p>Its zone is the Employer's, because that is where Business Days are counted.
 */
final class SettableClock extends Clock {

  private final ZoneId zone;
  private volatile Instant instant;

  SettableClock(ZoneId zone, Instant instant) {
    this.zone = zone;
    this.instant = instant;
  }

  /** Moves the app's idea of now. */
  void set(Instant now) {
    this.instant = now;
  }

  @Override
  public ZoneId getZone() {
    return zone;
  }

  @Override
  public Clock withZone(ZoneId other) {
    return new SettableClock(other, instant);
  }

  @Override
  public Instant instant() {
    return instant;
  }
}
