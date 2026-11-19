package com.darkowl.tuition.people.internal;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.repository.CrudRepository;

/** The Persons table. */
interface PersonRecords extends CrudRepository<PersonRecord, UUID> {

  Optional<PersonRecord> findByCognitoSubject(String cognitoSubject);
}
