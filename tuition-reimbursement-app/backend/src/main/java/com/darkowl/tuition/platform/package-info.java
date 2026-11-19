/**
 * The platform the domain modules sit on: the injected clock, sign-in as an OIDC
 * resource server, the S3 client, and the two operations the walking skeleton
 * needs ({@code GET /health} and {@code GET /me}).
 */
@org.springframework.modulith.ApplicationModule(displayName = "platform")
package com.darkowl.tuition.platform;
