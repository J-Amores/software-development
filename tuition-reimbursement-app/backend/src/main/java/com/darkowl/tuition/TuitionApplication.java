package com.darkowl.tuition;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * The Tuition Reimbursement API. Its domain areas are Spring Modulith modules
 * (ADR 0006): the direct subpackages of this one.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class TuitionApplication {

  public static void main(String[] args) {
    SpringApplication.run(TuitionApplication.class, args);
  }
}
