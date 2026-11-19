import type { components } from "../api/generated/schema";

/**
 * What the in-browser mock answers with, one function per operation in the
 * contract. The handlers that call them are generated
 * (`mocks/generated/handlers.ts`), so an operation added to the contract fails to
 * typecheck here until its fixture exists.
 *
 * Applications are kept in a store rather than returned as canned data, because a
 * Draft has to be read back as it was entered: demo mode is a working app whose
 * state lives in the browser (ADR 0005), and the frontend's tests drive these same
 * handlers (seam 3). `resetApplications` is the reset to the seeded fixtures that
 * ADR 0005 asks for, and what each test calls to start from a known place.
 *
 * The Faker cast of People and the Demo Scenarios arrive with ticket 16.
 */

type Application = components["schemas"]["Application"];
type ApplicationSummary = components["schemas"]["ApplicationSummary"];
type ApplicationDraft = components["schemas"]["ApplicationDraft"];
type StatusChange = components["schemas"]["StatusChange"];

/** What a generated handler hands a fixture: the request, and the path parameters. */
export type FixtureRequest = {
  request: Request;
  params: Record<string, string | readonly string[]>;
};

const SIGNED_IN_PERSON: components["schemas"]["Me"] = {
  personId: "00000000-0000-4000-8000-000000000001",
  name: "Ada Lovelace",
  email: "ada@darkowl.test",
};

/**
 * One Draft and one already-Submitted Application, so that a screen opened for the
 * first time has something to show and the Timeline has an entry to render.
 */
const seed = (): Application[] => [
  {
    applicationId: "11111111-1111-4111-8111-111111111111",
    status: "submitted",
    course: {
      institution: "Open University",
      title: "Distributed Systems",
      startDate: "2027-02-01",
      endDate: "2027-05-28",
      cost: "2400.00",
      degreeProgram: "MSc Computer Science",
    },
    eligibleCost: "2250.00",
    createdAt: "2026-11-02T09:15:00Z",
    updatedAt: "2026-11-04T16:40:00Z",
    timeline: [
      {
        from: "draft",
        to: "submitted",
        actorName: SIGNED_IN_PERSON.name,
        at: "2026-11-04T16:40:00Z",
      },
    ],
  },
  {
    applicationId: "22222222-2222-4222-8222-222222222222",
    status: "draft",
    course: {
      institution: "City College",
      title: "Technical Writing",
      startDate: "2027-03-15",
      endDate: "2027-06-10",
      cost: "900.00",
    },
    eligibleCost: "900.00",
    createdAt: "2026-11-10T11:00:00Z",
    updatedAt: "2026-11-10T11:00:00Z",
    timeline: [],
  },
];

let applications: Application[] = seed();

/** Start again from the seeded Applications, discarding anything the caller changed. */
export const resetApplications = (): void => {
  applications = seed();
};

const now = () => new Date().toISOString();

const pathParam = ({ params }: FixtureRequest, name: string): string => {
  const value = params[name];
  return Array.isArray(value) ? (value[0] ?? "") : ((value as string | undefined) ?? "");
};

/**
 * The mock answers only the 2xx the contract describes, because that is all a
 * generated handler can return. A caller that asks for an Application the store
 * does not hold is a bug in the caller, so it says so rather than inventing one.
 */
const stored = (applicationId: string): Application => {
  const application = applications.find((candidate) => candidate.applicationId === applicationId);
  if (!application) {
    throw new Error(`The mock holds no Application ${applicationId}`);
  }
  return application;
};

const summarise = (application: Application): ApplicationSummary => ({
  applicationId: application.applicationId,
  status: application.status,
  courseTitle: application.course.title,
  courseInstitution: application.course.institution,
  courseStartDate: application.course.startDate,
  eligibleCost: application.eligibleCost,
  updatedAt: application.updatedAt,
});

export const getHealth = (_info: FixtureRequest): components["schemas"]["Health"] => ({
  status: "up",
  postgres: { reachable: true },
  s3: { reachable: true },
  time: now(),
});

export const getMe = (_info: FixtureRequest): components["schemas"]["Me"] => SIGNED_IN_PERSON;

export const createApplication = async (info: FixtureRequest): Promise<Application> => {
  const draft = (await info.request.json()) as ApplicationDraft;
  const created: Application = {
    applicationId: crypto.randomUUID(),
    status: "draft",
    course: draft.course,
    eligibleCost: draft.eligibleCost,
    createdAt: now(),
    updatedAt: now(),
    timeline: [],
  };
  applications = [created, ...applications];
  return created;
};

export const updateApplication = async (info: FixtureRequest): Promise<Application> => {
  const draft = (await info.request.json()) as ApplicationDraft;
  const application = stored(pathParam(info, "applicationId"));
  application.course = draft.course;
  application.eligibleCost = draft.eligibleCost;
  application.updatedAt = now();
  return application;
};

export const getApplication = (info: FixtureRequest): Application =>
  stored(pathParam(info, "applicationId"));

/** Most recently changed first, as the contract promises. */
export const listApplications = (_info: FixtureRequest): ApplicationSummary[] =>
  [...applications]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(summarise);

export const submitApplication = (info: FixtureRequest): Application => {
  const application = stored(pathParam(info, "applicationId"));
  const change: StatusChange = {
    from: application.status,
    to: "submitted",
    actorName: SIGNED_IN_PERSON.name,
    at: now(),
  };
  application.status = "submitted";
  application.updatedAt = change.at;
  application.timeline = [...application.timeline, change];
  return application;
};
