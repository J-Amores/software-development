package com.darkowl.tuition.applications;

import java.util.Locale;

/**
 * Where an Application stands.
 *
 * <p>Only the two statuses this slice can produce. The rest of the lifecycle
 * arrives with the slices that make those Status Changes possible, so an
 * unreachable status is never a value here.
 */
enum ApplicationStatus {
  DRAFT,
  SUBMITTED;

  com.darkowl.contract.model.ApplicationStatus asContract() {
    return com.darkowl.contract.model.ApplicationStatus.fromValue(name().toLowerCase(Locale.ROOT));
  }
}
