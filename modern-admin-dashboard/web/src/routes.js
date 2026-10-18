import { CalendarView } from "./views/calendar-view.js";
import { ContactsView } from "./views/contacts-view.js";
import { DashboardView } from "./views/dashboard-view.js";
import { FaqView } from "./views/faq-view.js";
import { FormView } from "./views/form-view.js";
import { InvoicesView } from "./views/invoices-view.js";
import { PlaceholderView } from "./views/placeholder-view.js";
import { TeamView } from "./views/team-view.js";

/**
 * Route definitions mapping paths to view factory functions.
 */
export const routes = {
  "/": () => new DashboardView(),
  "/team": () => new TeamView(),
  "/contacts": () => new ContactsView(),
  "/invoices": () => new InvoicesView(),
  "/form": () => new FormView(),
  "/calendar": () => new CalendarView(),
  "/faq": () => new FaqView(),
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
