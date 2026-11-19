/**
 * Applications, Courses, the status lifecycle, the Timeline, Completion, Extensions and Expiry.
 *
 * <p>Empty until the slice that needs it (ticket 01 only establishes the
 * boundary). Other modules reach this one through its public interface
 * alone, which Spring Modulith verifies (ADR 0006).
 */
@org.springframework.modulith.ApplicationModule(displayName = "applications")
package com.darkowl.tuition.applications;
