package com.darkowl.tuition.applications;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Amounts of money cross the API as exact decimal strings with two places, and are
 * {@link BigDecimal} everywhere inside. No amount ever passes through a binary
 * float: an Approved Amount and a Reimbursed Amount have to be exact to the cent.
 */
final class Amounts {

  private Amounts() {}

  static BigDecimal read(String amount) {
    return amount == null || amount.isBlank() ? null : new BigDecimal(amount);
  }

  static String write(BigDecimal amount) {
    return amount == null ? null : amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
  }
}
