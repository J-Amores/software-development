// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { createApiClient, createFakeApiClient } from "../src/api/index.js";

describe("Frontend API Client Adapter Seam", () => {
  describe("createApiClient", () => {
    it("fetches /api/v1/health and returns parsed JSON on 200 OK", async () => {
      const mockResponseData = {
        status: "ok",
        environment: "development",
        timestamp: "2026-10-16T09:00:00.000Z",
        database: {
          status: "connected",
          latencyMs: 8,
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockResponseData),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.getHealth();

      expect(mockFetch).toHaveBeenCalledWith("http://api.local:8080/api/v1/health", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      expect(result).toEqual(mockResponseData);
    });

    it("parses and returns 503 degraded health response payload", async () => {
      const degradedResponseData = {
        status: "degraded",
        environment: "production",
        timestamp: "2026-10-16T09:00:00.000Z",
        database: {
          status: "disconnected",
          error: "Connection timeout",
        },
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: vi.fn().mockResolvedValue(degradedResponseData),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.getHealth();
      expect(result).toEqual(degradedResponseData);
    });

    it("throws descriptive error when network fetch fails", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      await expect(client.getHealth()).rejects.toThrow(/failed to reach api/i);
    });

    it("throws descriptive error on unexpected HTTP error codes", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: vi.fn().mockResolvedValue({ error: "Fatal crash" }),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      await expect(client.getHealth()).rejects.toThrow(/api error: 500/i);
    });
    it("fetches team members with query parameters", async () => {
      const mockMembers = [{ id: 1, name: "Jon Snow", access: "admin" }];
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockMembers),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.getTeamMembers({ q: "jon", sort: "name", order: "asc" });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://api.local:8080/api/v1/team?q=jon&sort=name&order=asc",
        {
          method: "GET",
          headers: { Accept: "application/json" },
        },
      );
      expect(result).toEqual(mockMembers);
    });

    it("updates team member access via PATCH", async () => {
      const updatedMember = { id: 1, name: "Jon Snow", access: "manager" };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(updatedMember),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.updateTeamMemberAccess(1, "manager");

      expect(mockFetch).toHaveBeenCalledWith("http://api.local:8080/api/v1/team/1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ access: "manager" }),
      });
      expect(result).toEqual(updatedMember);
    });

    it("provisions a new team member via POST /api/v1/team", async () => {
      const newMember = {
        name: "Arya Stark",
        email: "arya@stark.com",
        age: 18,
        phone: "(555) 123-4567",
        access: "user",
      };
      const createdMember = { id: 4, ...newMember };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue(createdMember),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.createTeamMember(newMember);

      expect(mockFetch).toHaveBeenCalledWith("http://api.local:8080/api/v1/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(newMember),
      });
      expect(result).toEqual(createdMember);
    });

    it("throws error when createTeamMember fails on server", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: vi.fn().mockResolvedValue({ message: "body must have required property 'email'" }),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      await expect(client.createTeamMember({ name: "Incomplete" })).rejects.toThrow(
        "body must have required property 'email'",
      );
    });

    it("deletes a team member via DELETE /api/v1/team/:id", async () => {
      const deleteResponse = {
        success: true,
        id: 2,
        message: "Team Member 2 successfully removed",
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(deleteResponse),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.deleteTeamMember(2);

      expect(mockFetch).toHaveBeenCalledWith("http://api.local:8080/api/v1/team/2", {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      expect(result).toEqual(deleteResponse);
    });

    it("throws error when deleteTeamMember fails on server", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: vi.fn().mockResolvedValue({ message: "Team Member with ID 99 not found" }),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      await expect(client.deleteTeamMember(99)).rejects.toThrow("Team Member with ID 99 not found");
    });

    it("fetches contacts with query parameters via GET /api/v1/contacts", async () => {
      const mockContacts = [
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
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockContacts),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.getContacts({ q: "jon", sort: "name", order: "asc" });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://api.local:8080/api/v1/contacts?q=jon&sort=name&order=asc",
        {
          method: "GET",
          headers: { Accept: "application/json" },
        },
      );
      expect(result).toEqual(mockContacts);
    });

    it("provisions a new contact via POST /api/v1/contacts", async () => {
      const newContact = {
        name: "Brienne of Tarth",
        email: "brienne@tarth.com",
        age: 32,
        phone: "(555) 777-8888",
        address: "Evenfall Hall, Tarth",
        city: "Tarth",
        zipCode: "99123",
        registrarId: 654321,
      };
      const createdContact = { id: 4, ...newContact };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue(createdContact),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.createContact(newContact);

      expect(mockFetch).toHaveBeenCalledWith("http://api.local:8080/api/v1/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(newContact),
      });
      expect(result).toEqual(createdContact);
    });

    it("fetches invoices with query parameters via GET /api/v1/invoices", async () => {
      const mockInvoices = [
        {
          id: 1,
          name: "Jon Snow",
          email: "jonsnow@gmail.com",
          phone: "(665)121-5454",
          amount: 21.24,
          date: "2022-03-12T00:00:00.000Z",
        },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockInvoices),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.getInvoices({ q: "snow", sort: "amount", order: "desc" });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://api.local:8080/api/v1/invoices?q=snow&sort=amount&order=desc",
        {
          method: "GET",
          headers: { Accept: "application/json" },
        },
      );
      expect(result).toEqual(mockInvoices);
    });

    it("deletes an invoice via DELETE /api/v1/invoices/:id", async () => {
      const deleteResponse = {
        success: true,
        id: 1,
        message: "Invoice 1 successfully removed",
      };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(deleteResponse),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.deleteInvoice(1);

      expect(mockFetch).toHaveBeenCalledWith("http://api.local:8080/api/v1/invoices/1", {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      expect(result).toEqual(deleteResponse);
    });

    it("throws error when deleteInvoice fails on server", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: vi.fn().mockResolvedValue({ message: "Invoice with ID 999 not found" }),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      await expect(client.deleteInvoice(999)).rejects.toThrow("Invoice with ID 999 not found");
    });

    it("fetches /api/v1/events with query params and returns parsed JSON", async () => {
      const mockEvents = [
        { id: 1, title: "Meeting", start: "2026-10-01", allDay: true },
        { id: 2, title: "Review", start: "2026-10-05", allDay: false },
      ];
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockEvents),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.getEvents({ sort: "start", order: "desc" });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://api.local:8080/api/v1/events?sort=start&order=desc",
        {
          method: "GET",
          headers: { Accept: "application/json" },
        },
      );
      expect(result).toEqual(mockEvents);
    });

    it("provisions a new event via POST /api/v1/events", async () => {
      const newEvent = {
        title: "Summit",
        start: "2026-10-20",
        allDay: true,
      };
      const createdEvent = { id: 3, ...newEvent };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue(createdEvent),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.createEvent(newEvent);

      expect(mockFetch).toHaveBeenCalledWith("http://api.local:8080/api/v1/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(newEvent),
      });
      expect(result).toEqual(createdEvent);
    });

    it("removes an event via DELETE /api/v1/events/:id", async () => {
      const deleteResponse = { success: true, id: 1, message: "Calendar Event 1 removed" };
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(deleteResponse),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.deleteEvent(1);

      expect(mockFetch).toHaveBeenCalledWith("http://api.local:8080/api/v1/events/1", {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      expect(result).toEqual(deleteResponse);
    });

    it("throws error when deleteEvent fails on server", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: vi.fn().mockResolvedValue({ message: "Calendar Event with ID 999 not found" }),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      await expect(client.deleteEvent(999)).rejects.toThrow("Calendar Event with ID 999 not found");
    });

    it("fetches /api/v1/faqs with query string parameters", async () => {
      const mockFaqsData = [
        {
          id: 1,
          question: "How are administrative Access Levels assigned?",
          answer: "Operators manage Team Member Access Levels in the directory.",
          category: "Access & Security",
        },
      ];

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockFaqsData),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      const result = await client.getFaqs({ q: "Access", category: "Access & Security" });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://api.local:8080/api/v1/faqs?q=Access&category=Access+%26+Security",
        {
          method: "GET",
          headers: { Accept: "application/json" },
        },
      );
      expect(result).toEqual(mockFaqsData);
    });

    it("throws error when getFaqs fails with 500 server error", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: vi.fn().mockResolvedValue({ message: "Database connection failed" }),
      });

      const client = createApiClient({
        baseUrl: "http://api.local:8080",
        fetchFn: mockFetch,
      });

      await expect(client.getFaqs()).rejects.toThrow("Database connection failed");
    });
  });

  describe("createFakeApiClient", () => {
    it("returns mock health data in memory without network calls", async () => {
      const fakeClient = createFakeApiClient({
        healthResponse: {
          status: "ok",
          environment: "test",
          timestamp: "2026-10-16T09:00:00.000Z",
          database: {
            status: "connected",
            latencyMs: 2,
          },
        },
      });

      const result = await fakeClient.getHealth();
      expect(result.status).toBe("ok");
      expect(result.database.latencyMs).toBe(2);
    });

    it("simulates network errors when configured with shouldThrow", async () => {
      const fakeClient = createFakeApiClient({
        shouldThrow: true,
        errorMessage: "Simulated offline error",
      });

      await expect(fakeClient.getHealth()).rejects.toThrow("Simulated offline error");
      await expect(fakeClient.getTeamMembers()).rejects.toThrow("Simulated offline error");
      await expect(fakeClient.updateTeamMemberAccess(1, "manager")).rejects.toThrow(
        "Simulated offline error",
      );
    });

    it("provides in-memory CRUD operations for team members", async () => {
      const fakeClient = createFakeApiClient();

      // Query all
      const all = await fakeClient.getTeamMembers();
      expect(all).toHaveLength(3);
      expect(all[0].name).toBe("Jon Snow");

      // Query with search
      const filtered = await fakeClient.getTeamMembers({ q: "lannister" });
      expect(filtered).toHaveLength(2);

      // Update access level
      const updated = await fakeClient.updateTeamMemberAccess(3, "manager");
      expect(updated.id).toBe(3);
      expect(updated.access).toBe("manager");

      // Verify mutation persists in in-memory store
      const reFetched = await fakeClient.getTeamMembers();
      const jaime = reFetched.find((m) => m.id === 3);
      expect(jaime.access).toBe("manager");

      // Provision new member
      const created = await fakeClient.createTeamMember({
        name: "Daenerys Targaryen",
        email: "daenerys@dragon.com",
        age: 22,
        phone: "(555) 333-4444",
        access: "admin",
      });
      expect(created.id).toBe(4);
      expect(created.name).toBe("Daenerys Targaryen");

      // Verify store length incremented
      const afterCreation = await fakeClient.getTeamMembers();
      expect(afterCreation).toHaveLength(4);
    });

    it("throws error when creating a team member with missing fields in fake client", async () => {
      const fakeClient = createFakeApiClient();
      await expect(fakeClient.createTeamMember({ name: "Incomplete" })).rejects.toThrow(
        "Missing required fields",
      );
    });

    it("deletes a team member in fake client and removes them from store", async () => {
      const fakeClient = createFakeApiClient();
      const initial = await fakeClient.getTeamMembers();
      expect(initial).toHaveLength(3);

      const result = await fakeClient.deleteTeamMember(2);
      expect(result.success).toBe(true);
      expect(result.id).toBe(2);

      const after = await fakeClient.getTeamMembers();
      expect(after).toHaveLength(2);
      expect(after.some((m) => m.id === 2)).toBe(false);
    });

    it("throws error when deleting nonexistent team member in fake client", async () => {
      const fakeClient = createFakeApiClient();
      await expect(fakeClient.deleteTeamMember(999)).rejects.toThrow(
        "Team Member with ID 999 not found",
      );
    });

    it("provides in-memory querying and creation for contacts", async () => {
      const fakeClient = createFakeApiClient();

      // Query all
      const all = await fakeClient.getContacts();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThan(0);

      // Query with search
      const searched = await fakeClient.getContacts({ q: "new york" });
      expect(searched.length).toBeGreaterThan(0);
      expect(
        searched.every(
          (c) =>
            c.city.toLowerCase().includes("new york") ||
            c.address.toLowerCase().includes("new york"),
        ),
      ).toBe(true);

      // Create new contact
      const initialCount = (await fakeClient.getContacts()).length;
      const created = await fakeClient.createContact({
        name: "Brienne of Tarth",
        email: "brienne@tarth.com",
        age: 32,
        phone: "(555) 777-8888",
        address: "Evenfall Hall, Tarth",
        city: "Tarth",
        zipCode: "99123",
        registrarId: 654321,
      });

      expect(created.name).toBe("Brienne of Tarth");
      expect(created.id).toBe(initialCount + 1);

      const after = await fakeClient.getContacts();
      expect(after).toHaveLength(initialCount + 1);
    });

    it("throws error when creating a contact with missing fields in fake client", async () => {
      const fakeClient = createFakeApiClient();
      await expect(fakeClient.createContact({ name: "Incomplete Contact" })).rejects.toThrow(
        "Missing required fields",
      );
    });

    it("provides in-memory querying and deletion for invoices", async () => {
      const fakeClient = createFakeApiClient();

      // Query all
      const all = await fakeClient.getInvoices();
      expect(Array.isArray(all)).toBe(true);
      expect(all).toHaveLength(3);

      // Query with search
      const searched = await fakeClient.getInvoices({ q: "cersei" });
      expect(searched).toHaveLength(1);
      expect(searched[0].name).toBe("Cersei Lannister");

      // Query with sort
      const sorted = await fakeClient.getInvoices({ sort: "amount", order: "desc" });
      expect(sorted[0].amount).toBe(21.24);

      // Delete invoice
      const result = await fakeClient.deleteInvoice(2);
      expect(result.success).toBe(true);
      expect(result.id).toBe(2);

      const afterDelete = await fakeClient.getInvoices();
      expect(afterDelete).toHaveLength(2);
      expect(afterDelete.some((inv) => inv.id === 2)).toBe(false);
    });

    it("throws error when deleting nonexistent invoice in fake client", async () => {
      const fakeClient = createFakeApiClient();
      await expect(fakeClient.deleteInvoice(999)).rejects.toThrow("Invoice with ID 999 not found");
    });

    it("provides in-memory querying, creation, and deletion for events in fake client", async () => {
      const fakeClient = createFakeApiClient();

      // Query all
      const all = await fakeClient.getEvents();
      expect(Array.isArray(all)).toBe(true);
      expect(all).toHaveLength(3);

      // Query with sort descending
      const sorted = await fakeClient.getEvents({ sort: "start", order: "desc" });
      expect(sorted[0].id).toBe(3);

      // Create event
      const created = await fakeClient.createEvent({
        title: "Team Retrospective",
        start: "2026-10-30",
        allDay: true,
      });
      expect(created.id).toBe(4);
      expect(created.title).toBe("Team Retrospective");

      const afterCreate = await fakeClient.getEvents();
      expect(afterCreate).toHaveLength(4);

      // Delete event
      const result = await fakeClient.deleteEvent(1);
      expect(result.success).toBe(true);
      expect(result.id).toBe(1);

      const afterDelete = await fakeClient.getEvents();
      expect(afterDelete).toHaveLength(3);
      expect(afterDelete.some((e) => e.id === 1)).toBe(false);
    });

    it("throws error when creating an event with missing fields in fake client", async () => {
      const fakeClient = createFakeApiClient();
      await expect(fakeClient.createEvent({ title: "No Date" })).rejects.toThrow(
        "Missing required fields",
      );
    });

    it("throws error when deleting nonexistent event in fake client", async () => {
      const fakeClient = createFakeApiClient();
      await expect(fakeClient.deleteEvent(9999)).rejects.toThrow(
        "Calendar Event with ID 9999 not found",
      );
    });

    it("provides in-memory querying and text filtering for curated FAQs", async () => {
      const fakeClient = createFakeApiClient();

      // Query all
      const all = await fakeClient.getFaqs();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThanOrEqual(4);

      // Query with text search q matching question
      const accessFaqs = await fakeClient.getFaqs({ q: "Access Levels" });
      expect(accessFaqs).toHaveLength(1);
      expect(accessFaqs[0].id).toBe(1);

      // Query with text search q matching answer text
      const billingFaqs = await fakeClient.getFaqs({ q: "net-30 settlement" });
      expect(billingFaqs).toHaveLength(1);
      expect(billingFaqs[0].id).toBe(2);

      // Query with category filter
      const planningFaqs = await fakeClient.getFaqs({ category: "Planning & Schedules" });
      expect(planningFaqs).toHaveLength(1);
      expect(planningFaqs[0].id).toBe(3);

      // Query with no matches
      const empty = await fakeClient.getFaqs({ q: "xyz987nonexistent" });
      expect(empty).toEqual([]);
    });
  });
});
