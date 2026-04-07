import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "@modelcontextprotocol/sdk/zod.js";

const BASE = process.env.PC_CITY_URL || "http://localhost:3000";

async function api(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

const server = new McpServer({
  name: "pc-city",
  version: "1.0.0",
  capabilities: { tools: {} },
});

// ─── TOOLS ─────────────────────────────────────────────────────────────

server.tool("get_patients", "List all patients in the city, their conditions, medications, allergies, and status", {}, async () => {
  const data = await api("/api/patients");
  return { content: [{ type: "text", text: JSON.stringify(data.patients, null, 2) }] };
});

server.tool("get_patient", "Get detailed info for a specific patient", { patientId: z.string().describe("Patient ID (e.g. p1)") }, async ({ patientId }) => {
  const data = await api(`/api/patients?id=${patientId}`);
  return { content: [{ type: "text", text: JSON.stringify(data.patient, null, 2) }] };
});

server.tool("get_messages", "Get all messages in the system. Filter by patient or building.", {
  patientId: z.string().optional().describe("Filter by patient ID"),
  buildingId: z.string().optional().describe("Filter by building (doctor, pharmacy, hospital, lab, insurance, patient)"),
}, async ({ patientId, buildingId }) => {
  let path = "/api/messages";
  const params = [];
  if (patientId) params.push(`patientId=${patientId}`);
  if (buildingId) params.push(`buildingId=${buildingId}`);
  if (params.length) path += "?" + params.join("&");
  const data = await api(path);
  return { content: [{ type: "text", text: JSON.stringify(data.messages, null, 2) }] };
});

server.tool("send_message", "Send a message between buildings/roles in the city", {
  from: z.string().describe("Sender name"),
  to: z.string().describe("Recipient name"),
  fromRole: z.string().describe("Sender role"),
  toRole: z.string().describe("Recipient role"),
  body: z.string().describe("Message body"),
  priority: z.enum(["normal", "priority", "urgent"]).default("normal"),
  buildingId: z.string().optional().describe("Source building ID"),
  patientId: z.string().optional().describe("Related patient ID"),
}, async (msg) => {
  const data = await apiPost("/api/messages", msg);
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("get_journeys", "Get all patient journeys — the complete path from intake to resolution. Shows every step, who was involved, what happened.", {
  patientId: z.string().optional().describe("Filter by patient ID"),
}, async ({ patientId }) => {
  let path = "/api/journeys";
  if (patientId) path += `?patientId=${patientId}`;
  const data = await api(path);
  return { content: [{ type: "text", text: JSON.stringify(data.journeys, null, 2) }] };
});

server.tool("get_roles", "Get all hospital roles and who is on duty", {}, async () => {
  const data = await api("/api/roles");
  return { content: [{ type: "text", text: JSON.stringify(data.roles, null, 2) }] };
});

server.tool("get_logs", "Get system logs. The overseer view — see everything happening across the city.", {
  level: z.enum(["info", "warn", "error", "critical"]).optional().describe("Filter by log level"),
  source: z.string().optional().describe("Filter by source (doctor, pharmacy, hospital, lab, insurance, system)"),
  limit: z.number().optional().default(50).describe("Max entries to return"),
}, async ({ level, source, limit }) => {
  const params = [];
  if (level) params.push(`level=${level}`);
  if (source) params.push(`source=${source}`);
  if (limit) params.push(`limit=${limit}`);
  const path = "/api/logs" + (params.length ? "?" + params.join("&") : "");
  const data = await api(path);
  return { content: [{ type: "text", text: JSON.stringify(data.logs, null, 2) }] };
});

server.tool("add_log", "Add a log entry to the system", {
  level: z.enum(["info", "warn", "error", "critical"]),
  source: z.string().describe("Source building or system"),
  message: z.string().describe("Log message"),
  metadata: z.record(z.unknown()).optional(),
}, async (entry) => {
  const data = await apiPost("/api/logs", entry);
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool("city_overview", "Get a complete overview of the city — all patients, active journeys, critical logs, on-duty staff. The bird's eye view.", {}, async () => {
  const [pData, jData, lData, rData, mData] = await Promise.all([
    api("/api/patients"),
    api("/api/journeys"),
    api("/api/logs?level=critical"),
    api("/api/roles"),
    api("/api/messages"),
  ]);

  const onDuty = rData.roles.filter((r) => r.onDuty);
  const activeJourneys = jData.journeys.filter((j) => j.status === "active");
  const blockedSteps = activeJourneys.flatMap((j) =>
    j.steps.filter((s) => s.status === "blocked" || s.status === "pending")
  );

  const overview = {
    timestamp: new Date().toISOString(),
    patients: {
      total: pData.patients.length,
      emergency: pData.patients.filter((p) => p.status === "emergency").length,
      admitted: pData.patients.filter((p) => p.status === "admitted").length,
      list: pData.patients.map((p) => ({ id: p.id, name: p.name, status: p.status, conditions: p.conditions })),
    },
    activeJourneys: activeJourneys.map((j) => ({
      id: j.id,
      patient: j.patientName,
      reason: j.reason,
      totalSteps: j.steps.length,
      completedSteps: j.steps.filter((s) => s.status === "completed").length,
      currentStep: j.steps.find((s) => s.status === "in_progress"),
      blockedSteps: j.steps.filter((s) => s.status === "blocked"),
    })),
    criticalLogs: lData.logs,
    onDutyStaff: onDuty,
    totalMessages: mData.messages.length,
    urgentMessages: mData.messages.filter((m) => m.priority === "urgent").length,
  };

  return { content: [{ type: "text", text: JSON.stringify(overview, null, 2) }] };
});

// ─── START ─────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
