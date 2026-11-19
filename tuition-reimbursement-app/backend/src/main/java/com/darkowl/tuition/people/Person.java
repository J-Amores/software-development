package com.darkowl.tuition.people;

import java.util.UUID;

/**
 * Anyone with an account in the system, normally an employee of the Employer.
 *
 * <p>A Person has two identifiers and they are not interchangeable. {@code
 * personId} is the application-generated UUID every other table refers to them by
 * (ADR 0003). The Cognito subject their token carries is how the user pool knows
 * them, and it stays inside this module: nothing else in the system records it.
 *
 * @param personId the Person's key, a UUID this application generated
 * @param displayName the Person's name as their Employer account records it
 * @param email the Person's work email
 */
public record Person(UUID personId, String displayName, String email) {}
