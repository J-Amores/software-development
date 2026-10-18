/**
 * API Client Adapter Module
 * Provides an injectable seam for making requests to the backend API.
 * Supports both network fetch adapter and in-memory fake client adapter for tests.
 */

/**
 * Creates a network-backed API client adapter.
 *
 * @param {Object} [options={}]
 * @param {string} [options.baseUrl] - Base API URL (e.g., http://localhost:8080)
 * @param {typeof fetch} [options.fetchFn] - Fetch implementation (defaults to global fetch)
 * @returns {{ getHealth(): Promise<any> }}
 */
export function createApiClient(options = {}) {
  const baseUrl =
    options.baseUrl ??
    (typeof window !== "undefined" && window.__API_BASE_URL__
      ? window.__API_BASE_URL__
      : "http://localhost:8080");

  const fetchFn =
    options.fetchFn ?? (typeof fetch !== "undefined" ? fetch.bind(globalThis) : undefined);

  return {
    async getHealth() {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const url = `${cleanBase}/api/v1/health`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      // 200 OK and 503 Service Unavailable (degraded health check) both carry structured health JSON payloads
      if (!response.ok && response.status !== 503) {
        throw new Error(`API error: ${response.status} ${response.statusText || ""}`.trim());
      }

      return data;
    },

    async getTeamMembers(params = {}) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const searchParams = new URLSearchParams();
      if (params.q) searchParams.set("q", params.q);
      if (params.sort) searchParams.set("sort", params.sort);
      if (params.order) searchParams.set("order", params.order);
      if (params.access) searchParams.set("access", params.access);

      const qs = searchParams.toString();
      const url = `${cleanBase}/api/v1/team${qs ? `?${qs}` : ""}`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async updateTeamMemberAccess(id, access) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const url = `${cleanBase}/api/v1/team/${id}`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ access }),
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async createTeamMember(memberData) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const url = `${cleanBase}/api/v1/team`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(memberData),
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async deleteTeamMember(id) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const url = `${cleanBase}/api/v1/team/${id}`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async getContacts(params = {}) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const searchParams = new URLSearchParams();
      if (params.q) searchParams.set("q", params.q);
      if (params.sort) searchParams.set("sort", params.sort);
      if (params.order) searchParams.set("order", params.order);

      const qs = searchParams.toString();
      const url = `${cleanBase}/api/v1/contacts${qs ? `?${qs}` : ""}`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async createContact(contactData) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const url = `${cleanBase}/api/v1/contacts`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(contactData),
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async getInvoices(params = {}) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const searchParams = new URLSearchParams();
      if (params.q) searchParams.set("q", params.q);
      if (params.sort) searchParams.set("sort", params.sort);
      if (params.order) searchParams.set("order", params.order);

      const qs = searchParams.toString();
      const url = `${cleanBase}/api/v1/invoices${qs ? `?${qs}` : ""}`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async deleteInvoice(id) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const url = `${cleanBase}/api/v1/invoices/${id}`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async getEvents(params = {}) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const searchParams = new URLSearchParams();
      if (params.sort) searchParams.set("sort", params.sort);
      if (params.order) searchParams.set("order", params.order);

      const qs = searchParams.toString();
      const url = `${cleanBase}/api/v1/events${qs ? `?${qs}` : ""}`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async createEvent(eventData) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const url = `${cleanBase}/api/v1/events`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(eventData),
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async deleteEvent(id) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const url = `${cleanBase}/api/v1/events/${id}`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async getFaqs(params = {}) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const searchParams = new URLSearchParams();
      if (params.q) searchParams.set("q", params.q);
      if (params.category) searchParams.set("category", params.category);
      if (params.sort) searchParams.set("sort", params.sort);
      if (params.order) searchParams.set("order", params.order);

      const qs = searchParams.toString();
      const url = `${cleanBase}/api/v1/faqs${qs ? `?${qs}` : ""}`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async getMetrics(dataset) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const url = `${cleanBase}/api/v1/metrics/${encodeURIComponent(dataset)}`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async getTransactions(params = {}) {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const searchParams = new URLSearchParams();
      if (params.limit !== undefined) searchParams.set("limit", String(params.limit));

      const qs = searchParams.toString();
      const url = `${cleanBase}/api/v1/transactions${qs ? `?${qs}` : ""}`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },

    async getDashboardSummary() {
      if (!fetchFn) {
        throw new Error("No fetch implementation available.");
      }

      const cleanBase = baseUrl.replace(/\/$/, "");
      const url = `${cleanBase}/api/v1/dashboard`;

      let response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
      } catch (err) {
        throw new Error(`Failed to reach API at ${baseUrl}: ${err.message}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Invalid JSON response from ${url}: ${err.message}`);
      }

      if (!response.ok) {
        const errorMsg =
          data?.message || `API error: ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(errorMsg);
      }

      return data;
    },
  };
}

/**
 * Creates an in-memory fake API client for component and route tests.
 *
 * @param {Object} [options={}]
 * @param {any | (() => any)} [options.healthResponse] - Data or generator function returning health payload
 * @param {boolean} [options.shouldThrow=false] - Whether to simulate network rejection
 * @param {string} [options.errorMessage="Network request failed"] - Error message when rejecting
 * @param {number} [options.delayMs=0] - Optional latency delay simulation
 * @returns {{ getHealth(): Promise<any> }}
 */
export function createFakeApiClient(options = {}) {
  const {
    healthResponse = {
      status: "ok",
      environment: "test",
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
        latencyMs: 1,
      },
    },
    teamMembers = [
      {
        id: 1,
        name: "Jon Snow",
        email: "jonsnow@gmail.com",
        age: 35,
        phone: "(665)121-5454",
        access: "admin",
      },
      {
        id: 2,
        name: "Cersei Lannister",
        email: "cerseilannister@gmail.com",
        age: 42,
        phone: "(421)314-2288",
        access: "manager",
      },
      {
        id: 3,
        name: "Jaime Lannister",
        email: "jaimelannister@gmail.com",
        age: 45,
        phone: "(422)982-6739",
        access: "user",
      },
    ],
    contacts = [
      {
        id: 1,
        name: "Jon Snow",
        email: "jonsnow@gmail.com",
        age: 35,
        phone: "(665)121-5454",
        address: "0912 Won Street, Alabama, SY 10001",
        city: "New York",
        zipCode: "10001",
        registrarId: 123512,
      },
      {
        id: 2,
        name: "Cersei Lannister",
        email: "cerseilannister@gmail.com",
        age: 42,
        phone: "(421)314-2288",
        address: "1234 Main Street, New York, NY 10001",
        city: "New York",
        zipCode: "13151",
        registrarId: 123512,
      },
      {
        id: 3,
        name: "Jaime Lannister",
        email: "jaimelannister@gmail.com",
        age: 45,
        phone: "(422)982-6739",
        address: "3333 Want Blvd, Estanza, NAY 42125",
        city: "Estanza",
        zipCode: "42125",
        registrarId: 413251,
      },
    ],
    invoices = [
      {
        id: 1,
        name: "Jon Snow",
        email: "jonsnow@gmail.com",
        phone: "(665)121-5454",
        amount: 21.24,
        date: "2022-03-12T00:00:00.000Z",
      },
      {
        id: 2,
        name: "Cersei Lannister",
        email: "cerseilannister@gmail.com",
        phone: "(421)314-2288",
        amount: 1.24,
        date: "2021-06-15T00:00:00.000Z",
      },
      {
        id: 3,
        name: "Jaime Lannister",
        email: "jaimelannister@gmail.com",
        phone: "(422)982-6739",
        amount: 11.24,
        date: "2022-05-02T00:00:00.000Z",
      },
    ],
    events = [
      {
        id: 1,
        title: "All-Day Operational Review",
        start: "2026-10-01",
        allDay: true,
      },
      {
        id: 2,
        title: "Quarterly Strategic Planning",
        start: "2026-10-07",
        end: "2026-10-09",
        allDay: true,
      },
      {
        id: 3,
        title: "Infrastructure Maintenance Window",
        start: "2026-10-14T02:00:00.000Z",
        end: "2026-10-14T06:00:00.000Z",
        allDay: false,
      },
    ],
    faqs = [
      {
        id: 1,
        question:
          "How are administrative Access Levels assigned and audited across the organization?",
        answer:
          "Operators manage Team Member Access Levels (Admin, Manager, User) directly through the Manage Team directory. Changes take effect immediately and establish the operational authority tier for that collaborator.",
        category: "Access & Security",
      },
      {
        id: 2,
        question: "What is the standard settlement window for issued commercial Invoices?",
        answer:
          "Commercial invoices carry a standard net-30 settlement expectation from the date of formal issuance. Outstanding balances and payment histories can be audited in real time via the Invoices balances ledger.",
        category: "Billing & Invoices",
      },
      {
        id: 3,
        question: "How are operational milestones and appointments scheduled on the Calendar?",
        answer:
          "Authorized operators can schedule new Calendar Events directly through the calendar grid or via the Add Event action. Events support all-day operational windows as well as designated hour-bound appointment blocks.",
        category: "Planning & Schedules",
      },
      {
        id: 4,
        question: "What procedures govern external Contact record retention and data privacy?",
        answer:
          "External Contact profiles, registrar references, and address information are retained under organizational compliance mandates and can only be modified or exported by authorized administrators.",
        category: "Compliance & Contacts",
      },
    ],
    metrics = {
      bar: [
        { country: "AD", "hot dog": 137, burger: 96, kebab: 72, donut: 140 },
        { country: "AE", "hot dog": 55, burger: 28, kebab: 58, donut: 29 },
        { country: "AF", "hot dog": 109, burger: 23, kebab: 34, donut: 152 },
      ],
      pie: [
        { id: "hack", label: "hack", value: 239, color: "hsl(104, 70%, 50%)" },
        { id: "make", label: "make", value: 170, color: "hsl(162, 70%, 50%)" },
        { id: "go", label: "go", value: 322, color: "hsl(291, 70%, 50%)" },
      ],
      line: [
        {
          id: "japan",
          color: "#4cceac",
          data: [
            { x: "plane", y: 101 },
            { x: "helicopter", y: 75 },
            { x: "boat", y: 36 },
          ],
        },
      ],
      geography: [
        { id: "USA", value: 800000 },
        { id: "CHN", value: 650000 },
        { id: "DEU", value: 450000 },
      ],
    },
    transactions = [
      { txId: "tx-1", user: "johndoe", date: "2026-10-01T12:00:00.000Z", amount: 43.95 },
      { txId: "tx-2", user: "jackdower", date: "2026-10-02T14:30:00.000Z", amount: 133.45 },
      { txId: "tx-3", user: "goodmanave", date: "2026-10-05T09:15:00.000Z", amount: 200.95 },
    ],
    dashboardSummary = null,
    shouldThrow = false,
    errorMessage = "Network request failed",
    delayMs = 0,
  } = options;

  const membersStore =
    typeof teamMembers === "function" ? null : teamMembers.map((m) => ({ ...m }));
  const contactsStore = typeof contacts === "function" ? null : contacts.map((c) => ({ ...c }));
  const invoicesStore = typeof invoices === "function" ? null : invoices.map((inv) => ({ ...inv }));
  const eventsStore = typeof events === "function" ? null : events.map((e) => ({ ...e }));
  const faqsStore = typeof faqs === "function" ? null : faqs.map((f) => ({ ...f }));

  return {
    async getHealth() {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }
      return typeof healthResponse === "function" ? healthResponse() : healthResponse;
    },

    async getTeamMembers(params = {}) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      const raw = typeof teamMembers === "function" ? teamMembers() : membersStore;
      let list = raw.map((m) => ({ ...m }));

      if (params.q) {
        const qLower = params.q.toLowerCase();
        list = list.filter(
          (m) => m.name.toLowerCase().includes(qLower) || m.email.toLowerCase().includes(qLower),
        );
      }
      if (params.access) {
        list = list.filter((m) => m.access === params.access.toLowerCase());
      }
      if (params.sort) {
        const key = params.sort;
        const dir = params.order === "desc" ? -1 : 1;
        list.sort((a, b) => {
          if (a[key] < b[key]) return -1 * dir;
          if (a[key] > b[key]) return 1 * dir;
          return 0;
        });
      }

      return list;
    },

    async updateTeamMemberAccess(id, access) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      const numId = Number(id);
      const member = membersStore.find((m) => m.id === numId);
      if (!member) {
        throw new Error(`Team Member with ID ${id} not found`);
      }

      member.access = access.toLowerCase();
      return { ...member };
    },

    async createTeamMember(memberData) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      if (
        !memberData.name ||
        !memberData.email ||
        !memberData.phone ||
        memberData.age == null ||
        !memberData.access
      ) {
        throw new Error("Missing required fields for team member creation");
      }

      const currentStore = typeof teamMembers === "function" ? teamMembers() : membersStore;
      const nextId =
        currentStore && currentStore.length > 0
          ? Math.max(...currentStore.map((m) => m.id)) + 1
          : 1;

      const created = {
        id: nextId,
        name: memberData.name,
        email: memberData.email,
        age: Number(memberData.age),
        phone: memberData.phone,
        access: memberData.access.toLowerCase(),
      };

      if (Array.isArray(membersStore)) {
        membersStore.push(created);
      }

      return { ...created };
    },

    async deleteTeamMember(id) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      const numId = Number(id);
      const index = membersStore ? membersStore.findIndex((m) => m.id === numId) : -1;
      if (index === -1) {
        throw new Error(`Team Member with ID ${id} not found`);
      }

      membersStore.splice(index, 1);
      return { success: true, id: numId, message: `Team Member ${id} successfully removed` };
    },

    async getContacts(params = {}) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      const raw = typeof contacts === "function" ? contacts() : contactsStore;
      let list = raw.map((c) => ({ ...c }));

      if (params.q) {
        const qLower = params.q.toLowerCase();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(qLower) ||
            c.email.toLowerCase().includes(qLower) ||
            c.city.toLowerCase().includes(qLower) ||
            c.address.toLowerCase().includes(qLower) ||
            String(c.registrarId).includes(qLower),
        );
      }

      if (params.sort) {
        const key = params.sort;
        const dir = params.order === "desc" ? -1 : 1;
        list.sort((a, b) => {
          if (a[key] < b[key]) return -1 * dir;
          if (a[key] > b[key]) return 1 * dir;
          return 0;
        });
      }

      return list;
    },

    async createContact(contactData) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      if (
        !contactData.name ||
        !contactData.email ||
        !contactData.phone ||
        !contactData.address ||
        !contactData.city ||
        !contactData.zipCode ||
        contactData.age == null ||
        contactData.registrarId == null
      ) {
        throw new Error("Missing required fields for contact creation");
      }

      const currentStore = typeof contacts === "function" ? contacts() : contactsStore;
      const nextId =
        currentStore && currentStore.length > 0
          ? Math.max(...currentStore.map((c) => c.id)) + 1
          : 1;

      const created = {
        id: nextId,
        name: contactData.name,
        email: contactData.email,
        age: Number(contactData.age),
        phone: contactData.phone,
        address: contactData.address,
        city: contactData.city,
        zipCode: contactData.zipCode,
        registrarId: Number(contactData.registrarId),
      };

      if (Array.isArray(contactsStore)) {
        contactsStore.push(created);
      }

      return { ...created };
    },

    async getInvoices(params = {}) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      const raw = typeof invoices === "function" ? invoices() : invoicesStore;
      let list = raw.map((inv) => ({ ...inv }));

      if (params.q) {
        const qLower = params.q.toLowerCase();
        list = list.filter(
          (inv) =>
            inv.name.toLowerCase().includes(qLower) || inv.email.toLowerCase().includes(qLower),
        );
      }

      if (params.sort) {
        const key = params.sort;
        const dir = params.order === "desc" ? -1 : 1;
        list.sort((a, b) => {
          if (a[key] < b[key]) return -1 * dir;
          if (a[key] > b[key]) return 1 * dir;
          return 0;
        });
      }

      return list;
    },

    async deleteInvoice(id) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      const numId = Number(id);
      const index = invoicesStore ? invoicesStore.findIndex((inv) => inv.id === numId) : -1;
      if (index === -1) {
        throw new Error(`Invoice with ID ${id} not found`);
      }

      invoicesStore.splice(index, 1);
      return { success: true, id: numId, message: `Invoice ${id} successfully removed` };
    },

    async getEvents(params = {}) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      const raw = typeof events === "function" ? events() : eventsStore;
      let list = raw.map((e) => ({ ...e }));

      if (params.sort) {
        const key = params.sort;
        const dir = params.order === "desc" ? -1 : 1;
        list.sort((a, b) => {
          if (a[key] < b[key]) return -1 * dir;
          if (a[key] > b[key]) return 1 * dir;
          return 0;
        });
      } else {
        list.sort((a, b) => {
          if (a.start < b.start) return -1;
          if (a.start > b.start) return 1;
          return 0;
        });
      }

      return list;
    },

    async createEvent(eventData) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      if (!eventData.title || !eventData.start) {
        throw new Error("Missing required fields for event creation");
      }

      const currentStore = typeof events === "function" ? events() : eventsStore;
      const nextId =
        currentStore && currentStore.length > 0
          ? Math.max(...currentStore.map((e) => e.id)) + 1
          : 1;

      const created = {
        id: nextId,
        title: eventData.title,
        start: eventData.start,
        allDay: eventData.allDay !== undefined ? Boolean(eventData.allDay) : true,
        ...(eventData.end ? { end: eventData.end } : {}),
      };

      if (Array.isArray(eventsStore)) {
        eventsStore.push(created);
      }

      return { ...created };
    },

    async deleteEvent(id) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      const numId = Number(id);
      const index = eventsStore ? eventsStore.findIndex((e) => e.id === numId) : -1;
      if (index === -1) {
        throw new Error(`Calendar Event with ID ${id} not found`);
      }

      eventsStore.splice(index, 1);
      return { success: true, id: numId, message: `Calendar Event ${id} successfully removed` };
    },

    async getFaqs(params = {}) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      const raw = typeof faqs === "function" ? faqs() : faqsStore;
      let list = raw.map((f) => ({ ...f }));

      if (params.category) {
        list = list.filter((f) => f.category === params.category);
      }

      if (params.q) {
        const queryLower = params.q.toLowerCase();
        list = list.filter((f) => {
          return (
            (f.question && f.question.toLowerCase().includes(queryLower)) ||
            (f.answer && f.answer.toLowerCase().includes(queryLower)) ||
            (f.category && f.category.toLowerCase().includes(queryLower))
          );
        });
      }

      if (params.sort) {
        const key = params.sort;
        const dir = params.order === "desc" ? -1 : 1;
        list.sort((a, b) => {
          if (a[key] < b[key]) return -1 * dir;
          if (a[key] > b[key]) return 1 * dir;
          return 0;
        });
      } else {
        list.sort((a, b) => a.id - b.id);
      }

      return list;
    },

    async getMetrics(dataset) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      const rawMetrics = typeof metrics === "function" ? metrics() : metrics;
      if (!rawMetrics || !rawMetrics[dataset]) {
        throw new Error(`Metric dataset '${dataset}' not found`);
      }

      return {
        metricKey: dataset,
        data: JSON.parse(JSON.stringify(rawMetrics[dataset])),
      };
    },

    async getTransactions(params = {}) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      const raw = typeof transactions === "function" ? transactions() : transactions;
      let list = raw.map((t) => ({ ...t }));
      list.sort((a, b) => (a.date < b.date ? 1 : -1));

      if (params.limit !== undefined) {
        list = list.slice(0, Number(params.limit));
      }

      return list;
    },

    async getDashboardSummary() {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (shouldThrow) {
        throw new Error(errorMessage);
      }

      if (dashboardSummary) {
        return typeof dashboardSummary === "function" ? dashboardSummary() : dashboardSummary;
      }

      const rawMetrics = typeof metrics === "function" ? metrics() : metrics;
      const rawTx = typeof transactions === "function" ? transactions() : transactions;
      const sortedTx = rawTx.map((t) => ({ ...t })).sort((a, b) => (a.date < b.date ? 1 : -1));

      return {
        summary: {
          invoicedRevenue: { total: 497.85, count: 5 },
          transactionVolume: { total: 378.35, count: rawTx.length },
          activeContacts: 3,
          teamMembers: 3,
          ratios: { emails: 0.75, sales: 0.5, clients: 0.3, traffic: 0.8 },
        },
        recentTransactions: sortedTx.slice(0, 10),
        charts: {
          revenueLine: rawMetrics?.line || [],
          salesBar: rawMetrics?.bar || [],
          geographyTraffic: rawMetrics?.geography || [],
        },
      };
    },
  };
}

// Singleton default client instance for production browser runtime
export const apiClient = createApiClient();
