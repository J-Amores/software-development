// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FormView } from "../src/views/form-view.js";
import { createFakeApiClient } from "../src/api/index.js";

describe("FormView Component (Team Member Provisioning Seam)", () => {
  let container;
  let view;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "test-view-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (view) {
      view.unmount();
      view = null;
    }
    container.remove();
  });

  it("mounts scene header, breadcrumbs, and renders semantic form", () => {
    const fakeClient = createFakeApiClient();
    view = new FormView({ apiClient: fakeClient });
    view.mount(container);

    const titleEl = container.querySelector("#form-title");
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toContain("Create User");

    const breadcrumbs = container.querySelector(".scene-breadcrumbs");
    expect(breadcrumbs).not.toBeNull();
    expect(breadcrumbs.textContent).toContain("Pages");
    expect(breadcrumbs.textContent).toContain("Profile Form");

    const form = container.querySelector("form.provision-form");
    expect(form).not.toBeNull();
    expect(form.hasAttribute("novalidate")).toBe(true);

    expect(container.querySelector("#member-name")).not.toBeNull();
    expect(container.querySelector("#member-email")).not.toBeNull();
    expect(container.querySelector("#member-age")).not.toBeNull();
    expect(container.querySelector("#member-phone")).not.toBeNull();
    expect(container.querySelector("#member-access")).not.toBeNull();
  });

  it("validates required fields on submit and displays accessible inline errors", async () => {
    const fakeClient = createFakeApiClient();
    const createSpy = vi.spyOn(fakeClient, "createTeamMember");

    view = new FormView({ apiClient: fakeClient });
    view.mount(container);

    const form = container.querySelector("form.provision-form");
    form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));

    // API should NOT be called on invalid submission
    expect(createSpy).not.toHaveBeenCalled();

    // Verify inline errors displayed for empty fields
    const nameError = container.querySelector("#member-name-error");
    expect(nameError).not.toBeNull();
    expect(nameError.textContent).toMatch(/required/i);
    expect(container.querySelector("#member-name").getAttribute("aria-invalid")).toBe("true");

    const emailError = container.querySelector("#member-email-error");
    expect(emailError).not.toBeNull();

    const accessError = container.querySelector("#member-access-error");
    expect(accessError).not.toBeNull();
  });

  it("validates email format and displays typeMismatch error message", async () => {
    const fakeClient = createFakeApiClient();
    view = new FormView({ apiClient: fakeClient });
    view.mount(container);

    const nameInput = container.querySelector("#member-name");
    const emailInput = container.querySelector("#member-email");
    const form = container.querySelector("form.provision-form");

    nameInput.value = "Arya Stark";
    emailInput.value = "not-an-email";

    form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));

    const emailError = container.querySelector("#member-email-error");
    expect(emailError).not.toBeNull();
    expect(emailError.textContent).toMatch(/valid email/i);
    expect(emailInput.getAttribute("aria-invalid")).toBe("true");
  });

  it("clears inline error when input receives valid input", async () => {
    const fakeClient = createFakeApiClient();
    view = new FormView({ apiClient: fakeClient });
    view.mount(container);

    const nameInput = container.querySelector("#member-name");
    const form = container.querySelector("form.provision-form");

    // Trigger error first
    form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    expect(container.querySelector("#member-name-error")).not.toBeNull();

    // Type valid value
    nameInput.value = "John Doe";
    nameInput.dispatchEvent(new Event("input", { bubbles: true }));

    expect(container.querySelector("#member-name-error")).toBeNull();
    expect(nameInput.getAttribute("aria-invalid")).toBe("false");
  });

  it("submits valid form data, calls apiClient.createTeamMember, resets form, and displays success banner", async () => {
    const fakeClient = createFakeApiClient();
    const createSpy = vi.spyOn(fakeClient, "createTeamMember");

    view = new FormView({ apiClient: fakeClient });
    view.mount(container);

    const nameInput = container.querySelector("#member-name");
    const emailInput = container.querySelector("#member-email");
    const ageInput = container.querySelector("#member-age");
    const phoneInput = container.querySelector("#member-phone");
    const accessSelect = container.querySelector("#member-access");
    const form = container.querySelector("form.provision-form");

    nameInput.value = "Arya Stark";
    emailInput.value = "arya@stark.com";
    ageInput.value = "18";
    phoneInput.value = "(555) 123-4567";
    accessSelect.value = "user";

    form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));

    await view.submitPromise;

    expect(createSpy).toHaveBeenCalledWith({
      name: "Arya Stark",
      email: "arya@stark.com",
      age: 18,
      phone: "(555) 123-4567",
      access: "user",
    });

    // Form fields reset
    expect(nameInput.value).toBe("");
    expect(emailInput.value).toBe("");

    // Success banner with role="status"
    const successBanner = container.querySelector('[data-testid="form-success"]');
    expect(successBanner).not.toBeNull();
    expect(successBanner.getAttribute("role")).toBe("status");
    expect(successBanner.textContent).toContain("Arya Stark");
    expect(successBanner.textContent).toContain("user");

    // Direct action to navigate to /team
    const navLink = successBanner.querySelector('a[href="/team"]');
    expect(navLink).not.toBeNull();
  });

  it("displays accessible error alert when API call rejects", async () => {
    const fakeClient = createFakeApiClient({
      shouldThrow: true,
      errorMessage: "Email address already registered",
    });

    view = new FormView({ apiClient: fakeClient });
    view.mount(container);

    container.querySelector("#member-name").value = "Duplicate User";
    container.querySelector("#member-email").value = "dup@test.com";
    container.querySelector("#member-age").value = "25";
    container.querySelector("#member-phone").value = "(555) 999-0000";
    container.querySelector("#member-access").value = "manager";

    const form = container.querySelector("form.provision-form");
    form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));

    await view.submitPromise;

    const errorBanner = container.querySelector('[data-testid="form-error"]');
    expect(errorBanner).not.toBeNull();
    expect(errorBanner.getAttribute("role")).toBe("alert");
    expect(errorBanner.textContent).toContain("Email address already registered");
  });

  it("cleans up resources and unmounts DOM element cleanly", () => {
    const fakeClient = createFakeApiClient();
    view = new FormView({ apiClient: fakeClient });
    view.mount(container);

    expect(container.querySelector(".form-scene")).not.toBeNull();

    view.unmount();
    expect(container.querySelector(".form-scene")).toBeNull();
  });
});
