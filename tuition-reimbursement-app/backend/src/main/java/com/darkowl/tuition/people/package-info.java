/**
 * Persons, Reporting Lines, permissions and Deactivation.
 *
 * <p>Empty until the slice that needs it (ticket 01 only establishes the
 * boundary). Other modules reach this one through its public interface
 * alone, which Spring Modulith verifies (ADR 0006).
 */
@org.springframework.modulith.ApplicationModule(displayName = "people")
package com.darkowl.tuition.people;
