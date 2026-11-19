package com.darkowl.tuition.people.internal;

import com.darkowl.tuition.people.People;
import com.darkowl.tuition.people.Person;
import java.time.Clock;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

/** Answers the questions the rest of the system asks about Persons. */
@Component
class PersonDirectory implements People {

  private final PersonRecords persons;
  private final Clock clock;

  PersonDirectory(PersonRecords persons, Clock clock) {
    this.persons = persons;
    this.clock = clock;
  }

  @Override
  public Person personWithSubject(String cognitoSubject, String displayName, String email) {
    return asPerson(record(cognitoSubject, displayName, email));
  }

  private PersonRecord record(String cognitoSubject, String displayName, String email) {
    return persons
        .findByCognitoSubject(cognitoSubject)
        .map(known -> known.renameTo(displayName, email) ? persons.save(known) : known)
        .orElseGet(() -> firstSight(cognitoSubject, displayName, email));
  }

  private PersonRecord firstSight(String cognitoSubject, String displayName, String email) {
    try {
      return persons.save(
          PersonRecord.firstSightOf(cognitoSubject, displayName, email, clock.instant()));
    } catch (DataIntegrityViolationException someoneElseGotThereFirst) {
      // The subject is unique, so two requests racing on a Person's first sign-in
      // end with one row and both callers holding it.
      return persons
          .findByCognitoSubject(cognitoSubject)
          .orElseThrow(() -> someoneElseGotThereFirst);
    }
  }

  private static Person asPerson(PersonRecord record) {
    return new Person(record.personId(), record.displayName(), record.email());
  }
}
