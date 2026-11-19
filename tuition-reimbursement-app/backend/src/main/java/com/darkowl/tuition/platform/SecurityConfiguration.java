package com.darkowl.tuition.platform;

import java.util.ArrayList;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Sign-in is a Cognito identity token, validated as a standard OIDC resource
 * server. Only the health check is open; every other operation needs a token
 * this Employer's user pool issued for this app.
 */
@Configuration
class SecurityConfiguration {

  @Bean
  SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http.csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            requests ->
                requests
                    .requestMatchers(HttpMethod.GET, "/health")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
        .build();
  }

  /**
   * The keys are fetched from {@code app.oidc.jwk-set-uri} rather than discovered
   * from the issuer, because the AWS Emulator puts its own loopback address in
   * {@code iss} and a container cannot resolve that name. The {@code iss} claim is
   * still checked, against {@code app.oidc.issuer}.
   */
  @Bean
  JwtDecoder jwtDecoder(OidcProperties oidc) {
    NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(oidc.jwkSetUri()).build();
    decoder.setJwtValidator(tokenValidator(oidc));
    return decoder;
  }

  private static OAuth2TokenValidator<Jwt> tokenValidator(OidcProperties oidc) {
    List<OAuth2TokenValidator<Jwt>> validators = new ArrayList<>();
    validators.add(new JwtTimestampValidator());
    validators.add(new JwtIssuerValidator(oidc.issuer()));
    // The identity token is what carries the Person's name and email, so an
    // access token for the same user is not accepted in its place.
    validators.add(new JwtClaimValidator<String>("token_use", "id"::equals));
    if (oidc.audience() != null && !oidc.audience().isBlank()) {
      validators.add(
          new JwtClaimValidator<List<String>>(
              JwtClaimNames.AUD, audience -> audience != null && audience.contains(oidc.audience())));
    }
    return new DelegatingOAuth2TokenValidator<>(validators);
  }

  @Bean
  JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setPrincipalClaimName(JwtClaimNames.SUB);
    return converter;
  }
}
