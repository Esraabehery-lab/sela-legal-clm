// In-memory data store for the CLM Phase-1 demo.
//
// Persisted on `globalThis` so it survives Next.js dev hot-reloads. This is a
// stand-in for the eventual Prisma/Postgres layer (mirrors the @sela/db
// pattern used by the finance + customer portals); the store API below is the
// seam where real persistence would slot in without changing callers.

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

function init(): Db {
  const requests = seedRequests();
  return { requests, sequence: requests.length };
}

const db: Db = globalThis.__selaClmDb ?? (globalThis.__selaClmDb = init());

export function listRequests(): DFRequest[] {
  return [...db.requests].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getRequest(id: string): DFRequest | undefined {
  return db.requests.find((r) => r.id === id || r.reference === id);
}

export function addRequest(req: DFRequest): void {
  db.requests.push(req);
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
}

/** All audit entries across requests (US-018), newest first. */
export function listAudit(): Array<AuditEntry & { reference: string; requestId: string }> {
  return db.requests
    .flatMap((r) =>
      r.audit.map((a) => ({ ...a, reference: r.reference, requestId: r.id })),
    )
    .sort((a, b) => b.at.localeCompare(a.at));
}
