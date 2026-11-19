import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { resetApplications } from "../mocks/fixtures";
import { freezeClock, openApp } from "./harness";

/**
 * Seam 3: the Application form, driven as an Applicant drives it, against the
 * mock generated from the contract. Covers the frontend behaviors 20 to 24 of
 * ticket 02.
 */
describe("The Application form", () => {
  beforeEach(() => {
    freezeClock();
    resetApplications();
  });

  it("keeps a saved Draft, so it is still there after leaving the screen and coming back", async () => {
    const user = openApp("/applications/new");

    await user.type(await screen.findByLabelText("Institution"), "Night School");
    await user.type(screen.getByLabelText("Course title"), "Compilers");
    await user.type(screen.getByLabelText("Start date"), "2027-09-06");
    await user.type(screen.getByLabelText("End date"), "2027-12-17");
    await user.type(screen.getByLabelText("Course cost"), "1800.00");
    await user.type(screen.getByLabelText("Eligible Cost"), "1650.00");
    await user.click(screen.getByRole("button", { name: "Save Draft" }));

    // Leave the screen...
    await user.click(await screen.findByRole("link", { name: "My Applications" }));
    // ...and come back to it.
    await user.click(await screen.findByRole("link", { name: "Compilers" }));
    await user.click(await screen.findByRole("link", { name: "Change this Draft" }));

    expect(await screen.findByLabelText("Institution")).toHaveValue("Night School");
    expect(screen.getByLabelText("Course title")).toHaveValue("Compilers");
    expect(screen.getByLabelText("Start date")).toHaveValue("2027-09-06");
    expect(screen.getByLabelText("End date")).toHaveValue("2027-12-17");
    expect(screen.getByLabelText("Course cost")).toHaveValue("1800.00");
    expect(screen.getByLabelText("Eligible Cost")).toHaveValue("1650.00");
  });

  it("says that books are not eligible where the Eligible Cost is entered", async () => {
    openApp("/applications/new");

    expect(await screen.findByLabelText("Eligible Cost")).toHaveAccessibleDescription(
      /Books are never Eligible Costs/,
    );
  });

  it("submits the Draft, so the Application becomes Submitted and the Applicant is told it worked", async () => {
    const user = openApp("/");

    await user.click(await screen.findByRole("link", { name: "Technical Writing" }));
    await user.click(await screen.findByRole("link", { name: "Change this Draft" }));
    await user.click(await screen.findByRole("button", { name: "Submit for Pre-approval" }));

    expect(await screen.findByText("Application submitted")).toBeInTheDocument();
    expect(await screen.findByText("Status: Submitted")).toBeInTheDocument();
  });

  it("refuses to submit a Course that has already started, and says why", async () => {
    const user = openApp("/");

    await user.click(await screen.findByRole("link", { name: "Technical Writing" }));
    await user.click(await screen.findByRole("link", { name: "Change this Draft" }));

    const startDate = await screen.findByLabelText("Start date");
    await user.clear(startDate);
    await user.type(startDate, "2026-11-04");
    await user.click(screen.getByRole("button", { name: "Submit for Pre-approval" }));

    expect(
      await screen.findByText(/Pre-approval must come before the Course starts/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "My Applications" }));
    const stillADraft = await screen.findByRole("row", { name: /Technical Writing/ });
    expect(within(stillADraft).getByText("Draft")).toBeInTheDocument();
  });

  it("shows which required Course details are missing before letting the Applicant submit", async () => {
    const user = openApp("/applications/new");

    await user.type(await screen.findByLabelText("Institution"), "Night School");
    await user.click(screen.getByRole("button", { name: "Submit for Pre-approval" }));

    const missing = await screen.findByRole("alert");
    expect(missing).toHaveTextContent("Course title is required.");
    expect(missing).toHaveTextContent("Start date is required.");
    expect(missing).toHaveTextContent("End date is required.");
    expect(missing).toHaveTextContent("Course cost is required.");
    expect(missing).toHaveTextContent("Eligible Cost is required.");
    expect(missing).not.toHaveTextContent("Institution is required.");
  });
});
