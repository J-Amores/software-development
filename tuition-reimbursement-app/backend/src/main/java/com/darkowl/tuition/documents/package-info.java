/**
 * Supporting Documents, their per-phase requirements and visibility.
 *
 * <p>Empty until the slice that needs it (ticket 01 only establishes the
 * boundary). Other modules reach this one through its public interface
 * alone, which Spring Modulith verifies (ADR 0006).
 */
@org.springframework.modulith.ApplicationModule(displayName = "documents")
package com.darkowl.tuition.documents;
