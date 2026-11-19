package com.darkowl.tuition.platform;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * The one Employer this deployment serves (ADR 0001), set at deploy time.
 *
 * @param name the Employer's name, shown in the app
 * @param currency the Employer's single currency, as an ISO 4217 code
 * @param timeZone the zone Business Days are counted in
 */
@ConfigurationProperties(prefix = "app.employer")
public record EmployerProperties(String name, String currency, String timeZone) {}
