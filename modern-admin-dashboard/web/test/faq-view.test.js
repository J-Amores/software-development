// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FaqView } from "../src/views/faq-view.js";
import { createFakeApiClient } from "../src/api/index.js";

const sampleFaqs = [
  {
    id: 1,
    question: "How are administrative Access Levels assigned and audited across the organization?",
    answer:
      "Operators manage Team Member Access Levels (Admin, Manager, User) directly through the Manage Team directory.",
    category: "Access & Security",
  },
  {
    id: 2,
    question: "What is the standard settlement window for issued commercial Invoices?",
    answer:
      "Commercial invoices carry a standard net-30 settlement expectation from the date of formal issuance.",
    category: "Billing & Invoices",
  },
  {
    id: 3,
    question: "How are operational milestones and appointments scheduled on the Calendar?",
    answer:
      "Authorized operators can schedule new Calendar Events directly through the calendar grid or via the Add Event action.",
    category: "Planning & Schedules",
  },
  {
    id: 4,
    question: "What procedures govern external Contact record retention and data privacy?",
    answer:
      "External Contact profiles, registrar references, and address information are retained under organizational compliance mandates.",
    category: "Compliance & Contacts",
  },
];

describe("FaqView Component (/faq)", () => {
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
    if (container && container.parentNode) {
      container.remove();
    }
  });

  describe("Lifecycle & Mounting", () => {
    it("throws an error when mounted without a container", () => {
      const faqView = new FaqView();
      expect(() => faqView.mount(null)).toThrow(/target container is required/i);
    });

    it("renders the scene breadcrumbs, header, search toolbar, and loading state", () => {
      const fakeClient = createFakeApiClient({ faqs: sampleFaqs, delayMs: 100 });
      view = new FaqView({ apiClient: fakeClient });
      view.mount(container);

      // Breadcrumb & title
      expect(container.querySelector(".scene-breadcrumbs")).not.toBeNull();
      expect(container.querySelector("#faq-title")?.textContent).toBe("FAQ Page");
      expect(container.querySelector(".scene-subtitle")?.textContent).toContain(
        "Common organizational guidelines",
      );

      // Controls
      expect(container.querySelector("[data-testid='faq-search-input']")).not.toBeNull();
      expect(container.querySelector("[data-testid='faq-toggle-all-btn']")).not.toBeNull();
      expect(container.querySelector("[data-testid='faq-count-badge']")).not.toBeNull();

      // Loading state
      expect(container.querySelector("[data-testid='faq-loading']")).not.toBeNull();
    });
  });

  describe("FAQ Data Rendering", () => {
    it("renders all fetched FAQ items with semantic details and summary elements", async () => {
      const fakeClient = createFakeApiClient({ faqs: sampleFaqs });
      view = new FaqView({ apiClient: fakeClient });
      view.mount(container);

      await new Promise((r) => setTimeout(r, 10));

      expect(container.querySelector("[data-testid='faq-loading']")).toBeNull();

      const accordions = container.querySelectorAll("details.faq-accordion");
      expect(accordions.length).toBe(4);

      // Verify item contents
      const first = container.querySelector("[data-testid='faq-item-1']");
      expect(first).not.toBeNull();
      expect(first?.querySelector(".faq-question")?.textContent).toContain(
        "Access Levels assigned",
      );
      expect(first?.querySelector(".faq-category-badge")?.textContent).toBe("Access & Security");
      expect(first?.querySelector(".faq-answer")?.textContent).toContain("Manage Team directory");

      // Default state: collapsed
      expect(first?.hasAttribute("open")).toBe(false);

      // Count badge
      const badge = container.querySelector("[data-testid='faq-count-badge']");
      expect(badge?.textContent).toBe("4 questions");
    });
  });

  describe("Real-Time Search Filtering & Auto-Expansion", () => {
    it("filters items by matching question text and automatically expands matching accordions", async () => {
      const fakeClient = createFakeApiClient({ faqs: sampleFaqs });
      view = new FaqView({ apiClient: fakeClient });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const searchInput = container.querySelector("[data-testid='faq-search-input']");
      searchInput.value = "Invoices";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      const accordions = container.querySelectorAll("details.faq-accordion");
      expect(accordions.length).toBe(1);

      const matchingItem = accordions[0];
      expect(matchingItem.dataset.id).toBe("2");
      // Auto-expanded during active search!
      expect(matchingItem.hasAttribute("open")).toBe(true);

      const badge = container.querySelector("[data-testid='faq-count-badge']");
      expect(badge?.textContent).toBe("1 of 4 questions");
    });

    it("filters items by matching answer text and auto-expands", async () => {
      const fakeClient = createFakeApiClient({ faqs: sampleFaqs });
      view = new FaqView({ apiClient: fakeClient });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const searchInput = container.querySelector("[data-testid='faq-search-input']");
      searchInput.value = "compliance mandates";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      const accordions = container.querySelectorAll("details.faq-accordion");
      expect(accordions.length).toBe(1);
      expect(accordions[0].dataset.id).toBe("4");
      expect(accordions[0].hasAttribute("open")).toBe(true);
    });

    it("filters items by matching category and auto-expands", async () => {
      const fakeClient = createFakeApiClient({ faqs: sampleFaqs });
      view = new FaqView({ apiClient: fakeClient });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const searchInput = container.querySelector("[data-testid='faq-search-input']");
      searchInput.value = "Planning & Schedules";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      const accordions = container.querySelectorAll("details.faq-accordion");
      expect(accordions.length).toBe(1);
      expect(accordions[0].dataset.id).toBe("3");
    });

    it("restores all items when search input is cleared", async () => {
      const fakeClient = createFakeApiClient({ faqs: sampleFaqs });
      view = new FaqView({ apiClient: fakeClient });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const searchInput = container.querySelector("[data-testid='faq-search-input']");
      searchInput.value = "Calendar";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      expect(container.querySelectorAll("details.faq-accordion").length).toBe(1);

      // Clear search
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      expect(container.querySelectorAll("details.faq-accordion").length).toBe(4);
      expect(container.querySelector("[data-testid='faq-count-badge']")?.textContent).toBe(
        "4 questions",
      );
    });

    it("displays empty state when search query matches zero FAQ entries", async () => {
      const fakeClient = createFakeApiClient({ faqs: sampleFaqs });
      view = new FaqView({ apiClient: fakeClient });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const searchInput = container.querySelector("[data-testid='faq-search-input']");
      searchInput.value = "supercalifragilistic";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));

      const emptyEl = container.querySelector("[data-testid='faq-empty']");
      expect(emptyEl).not.toBeNull();
      expect(emptyEl?.textContent).toContain("No matching questions found");
      expect(emptyEl?.textContent).toContain("supercalifragilistic");

      expect(container.querySelector("[data-testid='faq-count-badge']")?.textContent).toBe(
        "0 of 4 questions",
      );
    });
  });

  describe("Global Expand All / Collapse All Toggle", () => {
    it("expands all visible accordions when clicking 'Expand All'", async () => {
      const fakeClient = createFakeApiClient({ faqs: sampleFaqs });
      view = new FaqView({ apiClient: fakeClient });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const toggleBtn = container.querySelector("[data-testid='faq-toggle-all-btn']");
      expect(toggleBtn?.textContent.trim()).toBe("Expand All");

      // Click Expand All
      toggleBtn?.click();

      const accordions = container.querySelectorAll("details.faq-accordion");
      accordions.forEach((acc) => {
        expect(acc.hasAttribute("open")).toBe(true);
      });
      expect(toggleBtn?.textContent.trim()).toBe("Collapse All");

      // Click Collapse All
      toggleBtn?.click();

      accordions.forEach((acc) => {
        expect(acc.hasAttribute("open")).toBe(false);
      });
      expect(toggleBtn?.textContent.trim()).toBe("Expand All");
    });

    it("updates toggle button state when user toggles individual accordions", async () => {
      const fakeClient = createFakeApiClient({ faqs: sampleFaqs });
      view = new FaqView({ apiClient: fakeClient });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const toggleBtn = container.querySelector("[data-testid='faq-toggle-all-btn']");
      expect(toggleBtn?.textContent.trim()).toBe("Expand All");

      const accordions = container.querySelectorAll("details.faq-accordion");
      // Open all manually
      accordions.forEach((acc) => {
        acc.open = true;
        acc.dispatchEvent(new Event("toggle"));
      });

      expect(toggleBtn?.textContent.trim()).toBe("Collapse All");

      // Close one manually
      accordions[0].open = false;
      accordions[0].dispatchEvent(new Event("toggle"));

      expect(toggleBtn?.textContent.trim()).toBe("Expand All");
    });
  });

  describe("Error Handling & Alert Dismissal", () => {
    it("displays error banner and empty state when API call fails", async () => {
      const fakeClient = createFakeApiClient({
        shouldThrow: true,
        errorMessage: "Database unavailable",
      });

      view = new FaqView({ apiClient: fakeClient });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const alert = container.querySelector("[data-testid='faq-alert-error']");
      expect(alert).not.toBeNull();
      expect(alert?.textContent).toContain("Failed to load FAQ entries");
      expect(alert?.textContent).toContain("Database unavailable");

      const errorState = container.querySelector("[data-testid='faq-error']");
      expect(errorState).not.toBeNull();
      expect(errorState?.textContent).toContain("Database unavailable");
    });

    it("dismisses alert banner when dismiss button is clicked", async () => {
      const fakeClient = createFakeApiClient({
        shouldThrow: true,
        errorMessage: "Network drop",
      });

      view = new FaqView({ apiClient: fakeClient });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      const alert = container.querySelector("[data-testid='faq-alert-error']");
      expect(alert).not.toBeNull();

      const dismissBtn = alert?.querySelector(".faq-alert-dismiss");
      dismissBtn?.click();

      expect(container.querySelector("[data-testid='faq-alert-error']")).toBeNull();
    });
  });

  describe("Unmount & Cleanup", () => {
    it("cleans up DOM elements and event listeners cleanly", async () => {
      const fakeClient = createFakeApiClient({ faqs: sampleFaqs });
      view = new FaqView({ apiClient: fakeClient });
      view.mount(container);
      await new Promise((r) => setTimeout(r, 10));

      expect(view.isMounted).toBe(true);
      expect(container.children.length).toBeGreaterThan(0);

      view.unmount();

      expect(view.isMounted).toBe(false);
      expect(container.innerHTML).toBe("");
    });
  });
});
