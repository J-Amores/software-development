package com.darkowl.tuition.platform;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Who is making this request, read from the token the resource server has already
 * validated. Nothing takes a caller's word for who they are, so there is one place
 * that answers the question.
 *
 * <p>What this holds is the token's subject, not a Person's key. The two are not
 * interchangeable: a Person's {@code personId} is the application-generated UUID
 * every table refers to them by, and the {@code people} module is the only thing
 * that can turn a subject into one. Naming the accessor after what it holds keeps
 * a caller from passing one where the other belongs.
 *
 * @param tokenSubject the subject claim of their token, stable for their account
 * @param displayName the Person's name as their Employer account records it
 * @param email the Person's work email
 */
public record SignedInPerson(String tokenSubject, String displayName, String email) {

  /** The Person this request is being made by. */
  public static SignedInPerson current() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !(authentication.getPrincipal() instanceof Jwt token)) {
      throw new IllegalStateException(
          "No validated token on this request: an endpoint that needs a Person is reachable without one");
    }
    return readFrom(token);
  }

  static SignedInPerson readFrom(Jwt token) {
    return new SignedInPerson(token.getSubject(), nameIn(token), token.getClaimAsString("email"));
  }

  private static String nameIn(Jwt token) {
    String given = token.getClaimAsString("given_name");
    String family = token.getClaimAsString("family_name");
    if (given != null && family != null) {
      return given + " " + family;
    }
    String username = token.getClaimAsString("cognito:username");
    return username != null ? username : token.getSubject();
  }
}
