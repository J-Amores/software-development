import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { resetApplications } from "../mocks/fixtures";
import { freezeClock, openApp } from "./harness";

/**
 * Seam 3: the Applicant home page, driven as an Applicant drives it, against the
 * mock generated from the contract. Covers the frontend behaviors 18 and 19 of
 * ticket 02.
 */
describe("The Applicant home page", () => {
  beforeEach(() => {
    freezeClock();
    resetApplications();
  });

  it("lists the signed-in Person's Applications with their statuses", async () => {
    openApp("/");

    const submitted = await screen.findByRole("row", { name: /Distributed Systems/ });
    expect(within(submitted).getByText("Submitted")).toBeInTheDocument();

    const draft = screen.getByRole("row", { name: /Technical Writing/ });
    expect(within(draft).getByText("Draft")).toBeInTheDocument();
  });

  it("tells the Applicant how to start one when they have no Applications", async () => {
    resetApplications([]);
    openApp("/");

    expect(
      await screen.findByText(/Start an Application to have the tuition for a Course reimbursed/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start an Application" })).toBeInTheDocument();
  });
});
