/**
 * Applications, Courses, the status lifecycle, the Timeline, Completion, Extensions and Expiry.
 *
 * <p>Holds the Application aggregate, its Course, the status lifecycle and the
 * Timeline as of ticket 02; Completion, Extensions and Expiry arrive with their
 * own tickets. Other modules reach this one through its public interface
 * alone, which Spring Modulith verifies (ADR 0006).
 */
@org.springframework.modulith.ApplicationModule(displayName = "applications")
package com.darkowl.tuition.applications;
