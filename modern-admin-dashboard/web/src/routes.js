import { BarView } from "./views/bar-view.js";
import { CalendarView } from "./views/calendar-view.js";
import { ContactsView } from "./views/contacts-view.js";
import { DashboardView } from "./views/dashboard-view.js";
import { FaqView } from "./views/faq-view.js";
import { FormView } from "./views/form-view.js";
import { GeographyView } from "./views/geography-view.js";
import { InvoicesView } from "./views/invoices-view.js";
import { LineView } from "./views/line-view.js";
import { PieView } from "./views/pie-view.js";
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
  "/bar": () => new BarView(),
  "/pie": () => new PieView(),
  "/line": () => new LineView(),
  "/geography": () => new GeographyView(),
};
