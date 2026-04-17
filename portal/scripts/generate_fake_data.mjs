import fs from "node:fs";
import path from "node:path";

const RECORD_COUNT = 220;

const REGIONS = ["North America", "EMEA", "APAC", "LATAM"];
const DEVICE_TYPES = ["Router", "Switch", "Firewall", "Access Point"];
const MODELS = ["NX-100", "NX-200", "NX-500", "XR-40", "XR-90", "CoreLink-8"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Open", "Closed", "In Progress"];
const CATEGORIES = ["Connectivity", "Security", "Performance", "Provisioning"];
const COMPANY_PREFIXES = [
  "Apex", "Nimbus", "Vertex", "Atlas", "Sierra", "Bluewave", "Summit", "Hyperion",
  "Quantum", "Aurora", "Meridian", "Pulse", "Granite", "Crown", "Cloudline", "Omni",
  "Horizon", "Ironwood", "Signal", "Fusion", "Arcadia", "Skylink", "Northstar", "Beacon",
];
const COMPANY_SUFFIXES = [
  "Technologies", "Networks", "Systems", "Telecom", "Infrastructure", "Communications",
  "Digital", "Labs", "Solutions", "Connectivity", "Devices", "DataWorks",
];

function createRng(seed = 42) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const rand = createRng(42);
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const randFloat = (min, max, digits = 2) => Number((min + rand() * (max - min)).toFixed(digits));
const pick = (arr) => arr[randInt(0, arr.length - 1)];

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
const iso = (d) => d.toISOString().slice(0, 10);

function weightedTier() {
  const v = rand();
  if (v < 0.35) return "Basic";
  if (v < 0.75) return "Growth";
  return "Enterprise";
}

function makeRecord(i) {
  const id = i + 1;
  const now = new Date();
  const tier = weightedTier();

  const contractStart = addDays(now, -randInt(200, 1200));
  const contractEnd = addDays(contractStart, randInt(365, 1095));

  const deviceCount = tier === "Basic" ? randInt(1, 3) : randInt(2, 6);
  const ticketRange = tier === "Basic" ? [1, 8] : tier === "Growth" ? [3, 12] : [6, 22];
  const ticketCount = randInt(ticketRange[0], ticketRange[1]);

  return {
    customer: {
      id,
      company_name: `${pick(COMPANY_PREFIXES)} ${pick(COMPANY_SUFFIXES)} ${id}`,
      region: pick(REGIONS),
      plan_tier: tier,
      contract_start_date: iso(contractStart),
      contract_end_date: iso(contractEnd),
      nps_score: randInt(-30, 85),
      monthly_usage_gb: randFloat(120, 2500),
    },
    devices: Array.from({ length: deviceCount }, (_, idx) => ({
      id: id * 100 + idx + 1,
      customer_id: id,
      device_type: pick(DEVICE_TYPES),
      model: pick(MODELS),
      quantity: randInt(2, 40),
    })),
    tickets: Array.from({ length: ticketCount }, (_, idx) => ({
      id: id * 1000 + idx + 1,
      customer_id: id,
      opened_date: iso(addDays(now, -randInt(0, 270))),
      severity: pick(SEVERITIES),
      status: pick(STATUSES),
      category: pick(CATEGORIES),
      resolution_time_hours: randFloat(2, 120, 1),
    })),
    monthly_metrics: Array.from({ length: 12 }, (_, idx) => {
      const m = new Date(now.getFullYear(), now.getMonth() - idx, 1);
      const trendNoise = randFloat(-0.2, 0.25, 4);
      const usage = Math.max(40, randFloat(100, 2600, 2) * (1 + trendNoise));
      return {
        id: id * 100 + idx + 1,
        customer_id: id,
        month: iso(m),
        usage_gb: Number(usage.toFixed(2)),
        active_devices: randInt(8, 220),
        uptime_pct: randFloat(95.4, 99.99, 2),
      };
    }),
  };
}

const rows = Array.from({ length: RECORD_COUNT }, (_, i) => makeRecord(i));
const outDir = path.resolve("portal", "data");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "synthetic_customers_220.json"), JSON.stringify(rows, null, 2), "utf8");

console.log(`Generated ${rows.length} customers`);
