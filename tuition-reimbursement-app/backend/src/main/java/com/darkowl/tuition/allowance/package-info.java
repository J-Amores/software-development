/**
 * Program Rules, Annual Allowances, Commitments, the Reimbursed Amount and Payroll Exports.
 *
 * <p>Empty until the slice that needs it (ticket 01 only establishes the
 * boundary). Other modules reach this one through its public interface
 * alone, which Spring Modulith verifies (ADR 0006).
 */
@org.springframework.modulith.ApplicationModule(displayName = "allowance")
package com.darkowl.tuition.allowance;
