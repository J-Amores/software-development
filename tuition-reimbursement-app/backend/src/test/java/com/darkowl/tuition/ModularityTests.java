package com.darkowl.tuition;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/**
 * Spring Modulith's own check that the domain modules only use each other's public
 * interfaces (ADR 0006). It is wired up with the walking skeleton and starts
 * catching real violations with the first slice in which one module calls another.
 */
class ModularityTests {

  private static final ApplicationModules MODULES = ApplicationModules.of(TuitionApplication.class);

  @Test
  void modulesOnlyUseEachOthersPublicInterfaces() {
    MODULES.verify();
  }
}
