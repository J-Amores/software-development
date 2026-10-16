import { DashboardView } from "./views/dashboard-view.js";
import { PlaceholderView } from "./views/placeholder-view.js";

/**
 * Route definitions mapping paths to view factory functions.
 */
export const routes = {
  "/": () => new DashboardView(),
  "/team": () =>
    new PlaceholderView({
      title: "Manage Team",
      subtitle: "Internal organizational personnel and collaborators",
      section: "Data Management",
      domainConcept:
        "Team Member profiles, organizational affiliations, and Access Level assignments.",
    }),
  "/contacts": () =>
    new PlaceholderView({
      title: "Contacts Information",
      subtitle: "External client and institutional contacts directory",
      section: "Data Management",
      domainConcept: "Contact records, communication logs, and customer relationship information.",
    }),
  "/invoices": () =>
    new PlaceholderView({
      title: "Invoices Balances",
      subtitle: "Accounts receivable, balances, and billing transactions",
      section: "Data Management",
      domainConcept: "Invoice requests, payment records, and financial Transaction settlements.",
    }),
  "/form": () =>
    new PlaceholderView({
      title: "Profile Form",
      subtitle: "Operator profile creation and access configuration",
      section: "Pages",
      domainConcept: "Operator credentials, contact preferences, and administrative Access Levels.",
    }),
  "/calendar": () =>
    new PlaceholderView({
      title: "Calendar",
      subtitle: "Scheduled milestones, appointments, and operations",
      section: "Pages",
      domainConcept: "Calendar Event schedules, deadlines, and organizational appointments.",
    }),
  "/faq": () =>
    new PlaceholderView({
      title: "FAQ Page",
      subtitle: "Common organizational guidelines and procedures",
      section: "Pages",
      domainConcept: "Curated FAQ Entry items providing verified answers to operational questions.",
    }),
  "/bar": () =>
    new PlaceholderView({
      title: "Bar Chart",
      subtitle: "Revenue and performance comparative analytics",
      section: "Charts & Analytics",
      domainConcept: "Campaign Metric comparisons across administrative departments.",
    }),
  "/pie": () =>
    new PlaceholderView({
      title: "Pie Chart",
      subtitle: "Operational expenditure and category breakdown",
      section: "Charts & Analytics",
      domainConcept: "Categorized Campaign Metric allocations and budget distribution.",
    }),
  "/line": () =>
    new PlaceholderView({
      title: "Line Chart",
      subtitle: "Longitudinal growth and trend monitoring",
      section: "Charts & Analytics",
      domainConcept: "Continuous Campaign Metric telemetry over operational quarters.",
    }),
  "/geography": () =>
    new PlaceholderView({
      title: "Geography Chart",
      subtitle: "Global distribution and regional engagement",
      section: "Charts & Analytics",
      domainConcept: "Geospatial distribution of Contacts and commercial operations.",
    }),
};
