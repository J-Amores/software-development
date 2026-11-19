import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { components } from "../api/generated/schema";
import { resetApplications } from "../mocks/fixtures";
import { freezeClock, openApp } from "./harness";

const withATimeline: components["schemas"]["Application"] = {
  applicationId: "33333333-3333-4333-8333-333333333333",
  status: "submitted",
  course: {
    institution: "Riverside University",
    title: "Advanced Databases",
    startDate: "2027-03-15",
    endDate: "2027-06-10",
    cost: "3200.00",
    degreeProgram: "MSc Data Engineering",
  },
  eligibleCost: "2950.00",
  createdAt: "2026-11-02T09:15:00Z",
  updatedAt: "2026-11-04T16:40:00Z",
  timeline: [
    { to: "draft", actorName: "Ada Lovelace", at: "2026-11-02T09:15:00Z" },
    {
      from: "draft",
      to: "submitted",
      actorName: "Ada Lovelace",
      at: "2026-11-04T16:40:00Z",
      reason: "The Course starts before the next intake.",
    },
  ],
};

/**
 * Seam 3: one Application's own screen, reached the way an Applicant reaches it.
 * Covers the frontend behavior 25 of ticket 02.
 */
describe("An Application's own screen", () => {
  beforeEach(() => {
    freezeClock();
    resetApplications([withATimeline]);
  });

  it("shows the Course details and the Timeline, naming the actor, the time and the reason", async () => {
    const user = openApp("/");

    await user.click(await screen.findByRole("link", { name: "Advanced Databases" }));

    expect(await screen.findByRole("heading", { name: "Advanced Databases" })).toBeInTheDocument();
    expect(screen.getByText("Riverside University")).toBeInTheDocument();
    expect(screen.getByText("15 March 2027")).toBeInTheDocument();
    expect(screen.getByText("10 June 2027")).toBeInTheDocument();
    expect(screen.getByText("3200.00")).toBeInTheDocument();
    expect(screen.getByText("2950.00")).toBeInTheDocument();
    expect(screen.getByText("MSc Data Engineering")).toBeInTheDocument();

    const timeline = screen.getByRole("list", { name: "Timeline" });
    const entries = within(timeline).getAllByRole("listitem");
    expect(entries).toHaveLength(2);
    expect(entries[0]).toHaveTextContent(
      "Moved to Draft by Ada Lovelace on 2 November 2026 at 09:15 UTC",
    );
    expect(entries[0]).not.toHaveTextContent("Reason:");
    expect(entries[1]).toHaveTextContent(
      "Moved to Submitted by Ada Lovelace on 4 November 2026 at 16:40 UTC",
    );
    expect(entries[1]).toHaveTextContent("Reason: The Course starts before the next intake.");
  });
});
