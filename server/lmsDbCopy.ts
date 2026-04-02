// ─── Copy / Duplicate ────────────────────────────────────────────────────────
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { courses, courseSections, courseLessons } from "../drizzle/schema";
import {
  getCourseById,
  getSectionsByCourse,
  getLessonsBySection,
  getLessonById,
} from "./lmsDb";

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

export async function copyCourse(courseId: number, newTitle: string, newSlug: string) {
  const original = await getCourseById(courseId);
  if (!original) throw new Error("Course not found");
  const { id, createdAt, updatedAt, totalEnrollments, totalCompletions, totalRevenue, ...rest } = original;
  const result = await db.insert(courses).values({
    ...rest,
    title: newTitle,
    slug: newSlug,
    status: "draft" as const,
    copiedFromId: courseId,
    totalEnrollments: 0,
    totalCompletions: 0,
    totalRevenue: 0,
  });
  const newId = (result as any)[0]?.insertId ?? (result as any).insertId;
  const sections = await getSectionsByCourse(courseId);
  for (const section of sections) {
    const { id: sId, createdAt: sC, updatedAt: sU, ...sRest } = section;
    const sResult = await db.insert(courseSections).values({ ...sRest, courseId: Number(newId) });
    const newSectionId = (sResult as any)[0]?.insertId ?? (sResult as any).insertId;
    const lessons = await getLessonsBySection(sId);
    for (const lesson of lessons) {
      const { id: lId, createdAt: lC, updatedAt: lU, ...lRest } = lesson;
      await db.insert(courseLessons).values({ ...lRest, courseId: Number(newId), sectionId: Number(newSectionId) });
    }
  }
  const rows = await db.select().from(courses).where(eq(courses.id, Number(newId)));
  return rows[0];
}

export async function copyLessonToSection(lessonId: number, targetCourseId: number, targetSectionId: number) {
  const lesson = await getLessonById(lessonId);
  if (!lesson) throw new Error("Lesson not found");
  const { id, createdAt, updatedAt, ...rest } = lesson;
  const lessons = await getLessonsBySection(targetSectionId);
  const result = await db.insert(courseLessons).values({
    ...rest,
    courseId: targetCourseId,
    sectionId: targetSectionId,
    sortOrder: lessons.length,
  });
  const newId = (result as any)[0]?.insertId ?? (result as any).insertId;
  const rows = await db.select().from(courseLessons).where(eq(courseLessons.id, Number(newId)));
  return rows[0];
}

export async function copySectionToCourse(sectionId: number, targetCourseId: number) {
  const sectionRows = await db.select().from(courseSections).where(eq(courseSections.id, sectionId));
  if (!sectionRows[0]) throw new Error("Section not found");
  const { id, createdAt, updatedAt, ...rest } = sectionRows[0];
  const existingSections = await getSectionsByCourse(targetCourseId);
  const sResult = await db.insert(courseSections).values({
    ...rest,
    courseId: targetCourseId,
    sortOrder: existingSections.length,
  });
  const newSectionId = (sResult as any)[0]?.insertId ?? (sResult as any).insertId;
  const lessons = await getLessonsBySection(sectionId);
  for (const lesson of lessons) {
    const { id: lId, createdAt: lC, updatedAt: lU, ...lRest } = lesson;
    await db.insert(courseLessons).values({ ...lRest, courseId: targetCourseId, sectionId: Number(newSectionId) });
  }
  const rows = await db.select().from(courseSections).where(eq(courseSections.id, Number(newSectionId)));
  return rows[0];
}
