package com.darkowl.tuition.people;

/**
 * What the rest of the system asks this module about Persons.
 *
 * <p>This interface and {@link Person} are in the module's own base package, which
 * is its public interface; everything behind them is internal and Spring Modulith
 * keeps it that way (ADR 0006).
 */
public interface People {

  /**
   * The Person a signed-in identity belongs to, created on first sight of that
   * identity.
   *
   * <p>Sign-in is a Cognito user pool, and a Person exists in this application
   * only once they have signed in at least once. Taking their name and email from
   * the token each time means the app follows what their Employer account says
   * rather than a copy of it.
   *
   * @param cognitoSubject the subject claim of their token, stable for their account
   * @param displayName their name, as the token reports it
   * @param email their work email, as the token reports it
   * @return the Person, with the UUID every other table refers to them by
   */
  Person personWithSubject(String cognitoSubject, String displayName, String email);
}
