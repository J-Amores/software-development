package com.darkowl.tuition.applications;

import java.util.List;
import java.util.UUID;
import org.springframework.data.repository.CrudRepository;

/** The Applications table, with each Application's Status Changes. */
interface Applications extends CrudRepository<Application, UUID> {

  /** One Applicant's own Applications, the most recently changed first. */
  List<Application> findByApplicantPersonIdOrderByUpdatedAtDesc(UUID applicantPersonId);
}
