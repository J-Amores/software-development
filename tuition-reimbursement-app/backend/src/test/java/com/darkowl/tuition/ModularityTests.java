package com.darkowl.tuition;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/**
 * Spring Modulith's own check that the domain modules only use each other's public
 * interfaces (ADR 0006). It is wired up with the walking skeleton and starts
 * catching real violations with the first slice in which one module calls another.
 *
 * <p>Contradicts ADR 0008, which says the skeleton's "only test confirms that data
 * makes the round trip" and lists the boundary check among the connections "first
 * tested by the slice that depends on them". Ticket 01's acceptance criteria ask
 * instead that "Spring Modulith's verification runs green in CI", so it exists here.
 * It is a structural check rather than a behavior test, so it does not weaken the
 * test-first rule, but the two documents should be reconciled.
 */
class ModularityTests {

  private static final ApplicationModules MODULES = ApplicationModules.of(TuitionApplication.class);

  @Test
  void modulesOnlyUseEachOthersPublicInterfaces() {
    MODULES.verify();
  }
}
