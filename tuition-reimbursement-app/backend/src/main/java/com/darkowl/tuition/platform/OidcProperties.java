package com.darkowl.tuition.platform;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Where tokens come from. Configuration, never code (ADR 0002), because the AWS
 * Emulator's Cognito issues tokens under its own address rather than a real
 * Cognito one.
 *
 * <p>The issuer and the key set are separate settings on purpose: the emulator
 * puts its loopback address in the {@code iss} claim, which a container cannot
 * resolve by that name, so the keys are fetched from an address that is reachable
 * while {@code iss} is still checked against the value below.
 *
 * @param issuer the exact {@code iss} claim every token must carry
 * @param jwkSetUri where the issuer's signing keys are published
 * @param audience the client the tokens are for, unchecked when blank
 */
@ConfigurationProperties(prefix = "app.oidc")
public record OidcProperties(String issuer, String jwkSetUri, String audience) {}
