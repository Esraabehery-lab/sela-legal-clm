// In-memory data store for the CLM Phase-1 demo, backed by a JSON file on disk
// so created requests and their lifecycle changes survive dev-server restarts.
//
// Persisted on `globalThis` so it survives Next.js hot-reloads, and mirrored to
// `.data/clm-db.json` so it survives full restarts. This is a stand-in for the
// eventual Prisma/Postgres layer; the store API below is the seam where real
// persistence would slot in without changing callers.

import fs from "node:fs";
import path from "node:path";
import type { DFRequest, AuditEntry } from "./types";
import { seedRequests } from "./seed";

interface Db {
  requests: DFRequest[];
  sequence: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __selaClmDb: Db | undefined;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "clm-db.json");

/** Load the db from disk, or seed a fresh one and write it out. */
function init(): Db {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Db;
    if (parsed && Array.isArray(parsed.requests)) return parsed;
  } catch {
    // No file yet (or unreadable) — fall through to seed.
  }
  const requests = seedRequests();
  const db: Db = { requests, sequence: requests.length };
  save(db);
  return db;
}

/** Mirror the current db to disk (best-effort; demo persistence). */
function save(database: Db): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(database), "utf8");
  } catch (err) {
    // Read-only filesystem (e.g. serverless) — keep working in-memory only.
    console.warn("[store] could not persist db to disk:", err);
  }
}

const db: Db = globalThis.__selaClmDb ?? (globalThis.__selaClmDb = init());

/** Persist the live db. Called after every mutation. */
export function persist(): void {
  save(db);
}

export function listRequests(): DFRequest[] {
  return [...db.requests].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getRequest(id: string): DFRequest | undefined {
  return db.requests.find((r) => r.id === id || r.reference === id);
}

/** Look up a request by its third-party share token (external review page). */
export function getRequestByToken(token: string): DFRequest | undefined {
  return db.requests.find((r) => r.thirdParty?.token === token);
}

export function addRequest(req: DFRequest): void {
  db.requests.push(req);
  persist();
}

export function nextReference(): string {
  db.sequence += 1;
  const n = String(db.sequence).padStart(4, "0");
  return `DF-${new Date().getFullYear()}-${n}`;
}

export function audit(
  req: DFRequest,
  actor: string,
  action: string,
  detail: string,
): void {
  const entry: AuditEntry = {
    id: `au_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    actor,
    action,
    detail,
  };
  req.audit.unshift(entry);
  req.updatedAt = entry.at;
  // Every mutating action ends with an audit() call, so this is our save seam.
  persist();
}

/** All audit entries across requests (US-018), newest first. */
export function listAudit(): Array<AuditEntry & { reference: string; requestId: string }> {
  return db.requests
    .flatMap((r) =>
      r.audit.map((a) => ({ ...a, reference: r.reference, requestId: r.id })),
    )
    .sort((a, b) => b.at.localeCompare(a.at));
}
