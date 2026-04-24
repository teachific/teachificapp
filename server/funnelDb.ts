import { eq, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { funnels, funnelSteps } from "../drizzle/schema";
import type { InsertFunnel, InsertFunnelStep } from "../drizzle/schema";
import { nanoid } from "nanoid";

let _db: ReturnType<typeof drizzle> | null = null;
function getDb() {
  if (!_db) _db = drizzle(process.env.DATABASE_URL as string);
  return _db;
}
const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_t, prop) {
    return (getDb() as any)[prop];
  },
});

// ─── Funnel CRUD ──────────────────────────────────────────────────────────────

export async function getFunnelsByOrg(orgId: number) {
  return db
    .select()
    .from(funnels)
    .where(eq(funnels.orgId, orgId))
    .orderBy(asc(funnels.createdAt));
}

export async function getFunnelById(id: number) {
  const rows = await db.select().from(funnels).where(eq(funnels.id, id));
  return rows[0] ?? null;
}

export async function createFunnel(data: {
  orgId: number;
  name: string;
  description?: string;
  courseId?: number;
}) {
  const slug =
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    nanoid(4);
  const [result] = await db.insert(funnels).values({
    orgId: data.orgId,
    name: data.name,
    description: data.description,
    slug,
    courseId: data.courseId,
  });
  const id = (result as any).insertId as number;
  return getFunnelById(id);
}

export async function updateFunnel(id: number, data: Partial<InsertFunnel>) {
  await db.update(funnels).set(data).where(eq(funnels.id, id));
  return getFunnelById(id);
}

export async function deleteFunnel(id: number) {
  // Delete all steps first
  await db.delete(funnelSteps).where(eq(funnelSteps.funnelId, id));
  await db.delete(funnels).where(eq(funnels.id, id));
}

// ─── Funnel Steps CRUD ────────────────────────────────────────────────────────

export async function getStepsByFunnel(funnelId: number) {
  return db
    .select()
    .from(funnelSteps)
    .where(eq(funnelSteps.funnelId, funnelId))
    .orderBy(asc(funnelSteps.sortOrder));
}

export async function getFunnelStepById(id: number) {
  const rows = await db.select().from(funnelSteps).where(eq(funnelSteps.id, id));
  return rows[0] ?? null;
}

export async function createFunnelStep(data: {
  funnelId: number;
  name: string;
  stepType?: InsertFunnelStep["stepType"];
  sortOrder?: number;
}) {
  const slug =
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    nanoid(4);
  const [result] = await db.insert(funnelSteps).values({
    funnelId: data.funnelId,
    name: data.name,
    stepType: data.stepType ?? "landing",
    sortOrder: data.sortOrder ?? 0,
    slug,
  });
  const id = (result as any).insertId as number;
  return getFunnelStepById(id);
}

export async function updateFunnelStep(id: number, data: Partial<InsertFunnelStep>) {
  await db.update(funnelSteps).set(data).where(eq(funnelSteps.id, id));
  return getFunnelStepById(id);
}

export async function deleteFunnelStep(id: number) {
  await db.delete(funnelSteps).where(eq(funnelSteps.id, id));
}

export async function reorderFunnelSteps(stepIds: number[]) {
  await Promise.all(
    stepIds.map((id, idx) =>
      db.update(funnelSteps).set({ sortOrder: idx }).where(eq(funnelSteps.id, id))
    )
  );
}

/** Returns a funnel with its steps (ordered) */
export async function getFunnelWithSteps(id: number) {
  const funnel = await getFunnelById(id);
  if (!funnel) return null;
  const steps = await getStepsByFunnel(id);
  return { ...funnel, steps };
}
