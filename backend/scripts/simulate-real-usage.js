/**
 * Simulates realistic API usage against a running server.
 *
 * Run from repo root: node backend/scripts/simulate-real-usage.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const API_BASE = (process.env.API_BASE || "http://localhost:5000/api").replace(
  /\/$/,
  ""
);

function section(title) {
  console.log("\n" + "=".repeat(60));
  console.log(title);
  console.log("=".repeat(60));
}

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

async function main() {
  section("STEP 0 — Health");
  const ping = await fetch(API_BASE.replace(/\/api$/, "") + "/");
  console.log(`GET / → ${ping.status} ${ping.ok ? "OK" : "FAIL"}`);
  if (!ping.ok) {
    process.exit(1);
  }

  const username = `sim_${Date.now()}`;
  const password = "SimPass123456!";
  const normalIp = "10.10.10.1";

  section("STEP 1 — Register");
  let res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  let body = await json(res);
  if (!res.ok) {
    console.error("Register:", res.status, body);
    process.exit(1);
  }
  const { token, user } = body;
  console.log(`POST /auth/register → ${res.status}`, user);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  section("STEP 2 — Create 5 normal logs (user-scoped)");
  for (let i = 1; i <= 5; i++) {
    res = await fetch(`${API_BASE}/log`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        message: `Action #${i}`,
        ip: normalIp,
      }),
    });
    body = await json(res);
    if (!res.ok) {
      console.error(`Log ${i}:`, res.status, body);
      process.exit(1);
    }
    console.log(`  [${i}] POST /log → ${res.status}`);
  }

  section("STEP 3 — 6 failed LOGIN attempts (same IP) → DB + threat");
  for (let i = 1; i <= 6; i++) {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password: `wrong-password-${i}`,
      }),
    });
    body = await json(res);
    if (res.status !== 401) {
      console.error(`Expected 401 on bad login, got ${res.status}`, body);
      process.exit(1);
    }
    console.log(`  [${i}] POST /auth/login (bad) → ${res.status}`);
  }

  section("STEP 4 — Login again (success) for JWT");
  res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  body = await json(res);
  if (!res.ok) {
    console.error("Login failed after wrong attempts:", body);
    process.exit(1);
  }
  const token2 = body.token;
  console.log("POST /auth/login (ok) →", res.status);

  section("STEP 5 — GET /logs (this user only)");
  res = await fetch(`${API_BASE}/logs`, {
    headers: { Authorization: `Bearer ${token2}` },
  });
  body = await json(res);
  if (!res.ok) {
    console.error(body);
    process.exit(1);
  }
  const { logs, threatAlerts, systemStatus } = body;
  console.log(`GET /logs → ${res.status}`);
  console.log(`  logs count (expect >= 11 including login events): ${logs?.length ?? 0}`);
  console.log(`  systemStatus: ${systemStatus}`);
  console.log(`  threatAlerts:`, JSON.stringify(threatAlerts, null, 2));

  const actionLogs = (logs || []).filter((l) => l.eventType === "action");
  const loginLogs = (logs || []).filter((l) => l.eventType === "login");
  if (actionLogs.length !== 5) {
    console.error("FAIL: expected exactly 5 action logs for this user");
    process.exit(1);
  }
  if (loginLogs.length < 7) {
    console.error("FAIL: expected >= 7 login logs (6 failed + 1 success)");
    process.exit(1);
  }

  const hit = (threatAlerts || [])[0];
  if (systemStatus !== "warning" || !hit || hit.attempts < 6) {
    console.error("FAIL: expected user-scoped brute-force alert with attempts >= 6");
    process.exit(1);
  }
  console.log("PASS: threats from LoginAttempt DB for this user.");

  section("STEP 6 — Admin API (skip if not admin)");
  const adminTry = await fetch(`${API_BASE}/admin/users`, {
    headers: { Authorization: `Bearer ${token2}` },
  });
  console.log(`GET /admin/users → ${adminTry.status} ${adminTry.ok ? "(admin OK)" : "(not admin — set BOOTSTRAP_ADMIN_USERNAME)"}`);

  section("DONE");
  console.log("Simulation passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
