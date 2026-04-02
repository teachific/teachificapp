import { and, desc, asc, eq, sql, gt, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  courses,
  courseSections,
  courseLessons,
  courseEnrollments,
  lessonProgress,
  orgThemes,
  orgSubscriptions,
  pageBuilderPages,
  coursePricing,
  instructors,
  certificates,
  coupons,
  courseReviews,
  users,
} from "../drizzle/schema";

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


// ─── Courses ────────────────────────────────────────────────────────────────

export async function getCoursesByOrg(orgId: number) {
  return db
    .select()
    .from(courses)
    .where(eq(courses.orgId, orgId))
    .orderBy(desc(courses.createdAt));
}

export async function getCourseById(id: number) {
  const rows = await db.select().from(courses).where(eq(courses.id, id));
  return rows[0] ?? null;
}

export async function getCourseBySlug(orgId: number, slug: string) {
  const rows = await db
    .select()
    .from(courses)
    .where(and(eq(courses.orgId, orgId), eq(courses.slug, slug)));
  return rows[0] ?? null;
}

export async function createCourse(data: typeof courses.$inferInsert) {
  const result = await db.insert(courses).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  return getCourseById(Number(id));
}

export async function updateCourse(id: number, data: Partial<typeof courses.$inferInsert>) {
  await db.update(courses).set(data).where(eq(courses.id, id));
  return getCourseById(id);
}

export async function deleteCourse(id: number) {
  await db.delete(courses).where(eq(courses.id, id));
}

// ─── Sections ───────────────────────────────────────────────────────────────

export async function getSectionsByCourse(courseId: number) {
  return db
    .select()
    .from(courseSections)
    .where(eq(courseSections.courseId, courseId))
    .orderBy(asc(courseSections.sortOrder));
}

export async function createSection(data: typeof courseSections.$inferInsert) {
  const result = await db.insert(courseSections).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  const rows = await db.select().from(courseSections).where(eq(courseSections.id, Number(id)));
  return rows[0];
}

export async function updateSection(id: number, data: Partial<typeof courseSections.$inferInsert>) {
  await db.update(courseSections).set(data).where(eq(courseSections.id, id));
  const rows = await db.select().from(courseSections).where(eq(courseSections.id, id));
  return rows[0];
}

export async function deleteSection(id: number) {
  await db.delete(courseLessons).where(eq(courseLessons.sectionId, id));
  await db.delete(courseSections).where(eq(courseSections.id, id));
}

export async function reorderSections(sectionIds: number[]) {
  for (let i = 0; i < sectionIds.length; i++) {
    await db
      .update(courseSections)
      .set({ sortOrder: i })
      .where(eq(courseSections.id, sectionIds[i]));
  }
}

// ─── Lessons ────────────────────────────────────────────────────────────────

export async function getLessonsBySection(sectionId: number) {
  return db
    .select()
    .from(courseLessons)
    .where(eq(courseLessons.sectionId, sectionId))
    .orderBy(asc(courseLessons.sortOrder));
}

export async function getLessonsByCourse(courseId: number) {
  return db
    .select()
    .from(courseLessons)
    .where(eq(courseLessons.courseId, courseId))
    .orderBy(asc(courseLessons.sortOrder));
}

export async function getLessonById(id: number) {
  const rows = await db.select().from(courseLessons).where(eq(courseLessons.id, id));
  return rows[0] ?? null;
}

export async function createLesson(data: typeof courseLessons.$inferInsert) {
  const result = await db.insert(courseLessons).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  return getLessonById(Number(id));
}

export async function updateLesson(id: number, data: Partial<typeof courseLessons.$inferInsert>) {
  await db.update(courseLessons).set(data).where(eq(courseLessons.id, id));
  return getLessonById(id);
}

export async function deleteLesson(id: number) {
  await db.delete(lessonProgress).where(eq(lessonProgress.lessonId, id));
  await db.delete(courseLessons).where(eq(courseLessons.id, id));
}

export async function reorderLessons(lessonIds: number[]) {
  for (let i = 0; i < lessonIds.length; i++) {
    await db
      .update(courseLessons)
      .set({ sortOrder: i })
      .where(eq(courseLessons.id, lessonIds[i]));
  }
}

// ─── Curriculum (full tree) ──────────────────────────────────────────────────

export async function getFullCurriculum(courseId: number) {
  const sections = await getSectionsByCourse(courseId);
  const lessons = await getLessonsByCourse(courseId);
  return sections.map((s: typeof courseSections.$inferSelect) => ({
    ...s,
    lessons: lessons.filter((l: typeof courseLessons.$inferSelect) => l.sectionId === s.id),
  }));
}

// ─── Pricing ────────────────────────────────────────────────────────────────

export async function getPricingByCourse(courseId: number) {
  return db
    .select()
    .from(coursePricing)
    .where(eq(coursePricing.courseId, courseId))
    .orderBy(asc(coursePricing.sortOrder));
}

export async function createPricing(data: typeof coursePricing.$inferInsert) {
  const result = await db.insert(coursePricing).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  const rows = await db.select().from(coursePricing).where(eq(coursePricing.id, Number(id)));
  return rows[0];
}

export async function updatePricing(id: number, data: Partial<typeof coursePricing.$inferInsert>) {
  await db.update(coursePricing).set(data).where(eq(coursePricing.id, id));
  const rows = await db.select().from(coursePricing).where(eq(coursePricing.id, id));
  return rows[0];
}

export async function deletePricing(id: number) {
  await db.delete(coursePricing).where(eq(coursePricing.id, id));
}

// ─── Enrollments ────────────────────────────────────────────────────────────

export async function getEnrollmentsByUser(userId: number) {
  return db
    .select()
    .from(courseEnrollments)
    .where(and(eq(courseEnrollments.userId, userId), eq(courseEnrollments.isActive, true)))
    .orderBy(desc(courseEnrollments.enrolledAt));
}

export async function getEnrollmentsByCourse(courseId: number) {
  return db
    .select()
    .from(courseEnrollments)
    .where(eq(courseEnrollments.courseId, courseId))
    .orderBy(desc(courseEnrollments.enrolledAt));
}

export async function getEnrollment(courseId: number, userId: number) {
  const rows = await db
    .select()
    .from(courseEnrollments)
    .where(
      and(
        eq(courseEnrollments.courseId, courseId),
        eq(courseEnrollments.userId, userId),
        eq(courseEnrollments.isActive, true)
      )
    );
  return rows[0] ?? null;
}

export async function createEnrollment(data: typeof courseEnrollments.$inferInsert) {
  const result = await db.insert(courseEnrollments).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  const rows = await db
    .select()
    .from(courseEnrollments)
    .where(eq(courseEnrollments.id, Number(id)));
  return rows[0];
}

export async function updateEnrollmentProgress(
  enrollmentId: number,
  progressPct: number,
  lastLessonId?: number
) {
  await db
    .update(courseEnrollments)
    .set({
      progressPct,
      lastLessonId: lastLessonId ?? undefined,
      lastAccessedAt: new Date(),
      completedAt: progressPct >= 100 ? new Date() : undefined,
    })
    .where(eq(courseEnrollments.id, enrollmentId));
}

// ─── Lesson Progress ─────────────────────────────────────────────────────────

export async function getLessonProgress(enrollmentId: number, lessonId: number) {
  const rows = await db
    .select()
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.enrollmentId, enrollmentId),
        eq(lessonProgress.lessonId, lessonId)
      )
    );
  return rows[0] ?? null;
}

export async function getAllLessonProgress(enrollmentId: number) {
  return db
    .select()
    .from(lessonProgress)
    .where(eq(lessonProgress.enrollmentId, enrollmentId));
}

export async function upsertLessonProgress(data: typeof lessonProgress.$inferInsert) {
  const existing = await getLessonProgress(data.enrollmentId!, data.lessonId!);
  if (existing) {
    await db
      .update(lessonProgress)
      .set(data)
      .where(eq(lessonProgress.id, existing.id));
    const rows = await db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.id, existing.id));
    return rows[0];
  } else {
    const result = await db.insert(lessonProgress).values(data);
    const id = (result as any)[0]?.insertId ?? (result as any).insertId;
    const rows = await db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.id, Number(id)));
    return rows[0];
  }
}

// ─── Org Themes ──────────────────────────────────────────────────────────────

export async function getOrgTheme(orgId: number) {
  const rows = await db.select().from(orgThemes).where(eq(orgThemes.orgId, orgId));
  return rows[0] ?? null;
}

export async function upsertOrgTheme(orgId: number, data: Partial<typeof orgThemes.$inferInsert>) {
  const existing = await getOrgTheme(orgId);
  if (existing) {
    await db.update(orgThemes).set(data).where(eq(orgThemes.orgId, orgId));
  } else {
    await db.insert(orgThemes).values({ orgId, ...data } as any);
  }
  return getOrgTheme(orgId);
}

// ─── Org Subscriptions ───────────────────────────────────────────────────────

export async function getOrgSubscription(orgId: number) {
  const rows = await db
    .select()
    .from(orgSubscriptions)
    .where(eq(orgSubscriptions.orgId, orgId));
  return rows[0] ?? null;
}

export async function upsertOrgSubscription(
  orgId: number,
  data: Partial<typeof orgSubscriptions.$inferInsert>
) {
  const existing = await getOrgSubscription(orgId);
  if (existing) {
    await db.update(orgSubscriptions).set(data).where(eq(orgSubscriptions.orgId, orgId));
  } else {
    await db.insert(orgSubscriptions).values({ orgId, ...data } as any);
  }
  return getOrgSubscription(orgId);
}

// ─── Page Builder ────────────────────────────────────────────────────────────

export async function getPagesByOrg(orgId: number) {
  return db
    .select()
    .from(pageBuilderPages)
    .where(eq(pageBuilderPages.orgId, orgId))
    .orderBy(desc(pageBuilderPages.createdAt));
}

export async function getPageById(id: number) {
  const rows = await db.select().from(pageBuilderPages).where(eq(pageBuilderPages.id, id));
  return rows[0] ?? null;
}

export async function getPageByCourse(courseId: number) {
  const rows = await db
    .select()
    .from(pageBuilderPages)
    .where(
      and(
        eq(pageBuilderPages.courseId, courseId),
        eq(pageBuilderPages.pageType, "course_sales")
      )
    );
  return rows[0] ?? null;
}

export async function createPage(data: typeof pageBuilderPages.$inferInsert) {
  const result = await db.insert(pageBuilderPages).values({
    ...data,
    blocksJson: data.blocksJson ?? "[]",
  });
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  return getPageById(Number(id));
}

export async function updatePage(id: number, data: Partial<typeof pageBuilderPages.$inferInsert>) {
  await db.update(pageBuilderPages).set(data).where(eq(pageBuilderPages.id, id));
  return getPageById(id);
}

export async function deletePage(id: number) {
  await db.delete(pageBuilderPages).where(eq(pageBuilderPages.id, id));
}

// ─── Instructors ─────────────────────────────────────────────────────────────

export async function getInstructorsByOrg(orgId: number) {
  return db
    .select()
    .from(instructors)
    .where(and(eq(instructors.orgId, orgId), eq(instructors.isActive, true)));
}

export async function getInstructorByUserId(userId: number, orgId: number) {
  const rows = await db
    .select()
    .from(instructors)
    .where(and(eq(instructors.userId, userId), eq(instructors.orgId, orgId)));
  return rows[0] ?? null;
}

export async function upsertInstructor(data: typeof instructors.$inferInsert) {
  const existing = await getInstructorByUserId(data.userId!, data.orgId!);
  if (existing) {
    await db.update(instructors).set(data).where(eq(instructors.id, existing.id));
    const rows = await db.select().from(instructors).where(eq(instructors.id, existing.id));
    return rows[0];
  } else {
    const result = await db.insert(instructors).values(data);
    const id = (result as any)[0]?.insertId ?? (result as any).insertId;
    const rows = await db.select().from(instructors).where(eq(instructors.id, Number(id)));
    return rows[0];
  }
}

// ─── Coupons ─────────────────────────────────────────────────────────────────

export async function getCouponsByOrg(orgId: number) {
  return db
    .select()
    .from(coupons)
    .where(and(eq(coupons.orgId, orgId), eq(coupons.isActive, true)));
}

export async function getCouponByCode(orgId: number, code: string) {
  const rows = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.orgId, orgId), eq(coupons.code, code), eq(coupons.isActive, true)));
  return rows[0] ?? null;
}

export async function createCoupon(data: typeof coupons.$inferInsert) {
  const result = await db.insert(coupons).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  const rows = await db.select().from(coupons).where(eq(coupons.id, Number(id)));
  return rows[0];
}

export async function updateCoupon(id: number, data: Partial<typeof coupons.$inferInsert>) {
  await db.update(coupons).set(data).where(eq(coupons.id, id));
  const rows = await db.select().from(coupons).where(eq(coupons.id, id));
  return rows[0];
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function getReviewsByCourse(courseId: number) {
  return db
    .select()
    .from(courseReviews)
    .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.isPublished, true)))
    .orderBy(desc(courseReviews.createdAt));
}

export async function createReview(data: typeof courseReviews.$inferInsert) {
  const result = await db.insert(courseReviews).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  const rows = await db.select().from(courseReviews).where(eq(courseReviews.id, Number(id)));
  return rows[0];
}

// ─── Certificates ────────────────────────────────────────────────────────────

export async function getCertificatesByUser(userId: number) {
  return db
    .select()
    .from(certificates)
    .where(eq(certificates.userId, userId))
    .orderBy(desc(certificates.issuedAt));
}

export async function getCertificateByEnrollment(enrollmentId: number) {
  const rows = await db
    .select()
    .from(certificates)
    .where(eq(certificates.enrollmentId, enrollmentId));
  return rows[0] ?? null;
}

export async function createCertificate(data: typeof certificates.$inferInsert) {
  const result = await db.insert(certificates).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  const rows = await db.select().from(certificates).where(eq(certificates.id, Number(id)));
  return rows[0];
}

// ─── Dashboard Analytics ─────────────────────────────────────────────────────

export async function getDashboardMetrics(orgId: number, days: number = 30) {
  const db = await getDb();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [revenueRow] = await db
    .select({ total: sql<number>`COALESCE(SUM(${courseEnrollments.amountPaid}), 0)` })
    .from(courseEnrollments)
    .where(and(eq(courseEnrollments.orgId, orgId), gte(courseEnrollments.enrolledAt, cutoff)));
  const revenue = Number(revenueRow?.total ?? 0);

  const [regRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(courseEnrollments)
    .where(and(eq(courseEnrollments.orgId, orgId), gte(courseEnrollments.enrolledAt, cutoff)));
  const registrations = Number(regRow?.count ?? 0);

  const [salesRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(courseEnrollments)
    .where(and(
      eq(courseEnrollments.orgId, orgId),
      gte(courseEnrollments.enrolledAt, cutoff),
      gt(courseEnrollments.amountPaid, 0)
    ));
  const sales = Number(salesRow?.count ?? 0);

  const [membersRow] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${courseEnrollments.userId})` })
    .from(courseEnrollments)
    .where(and(eq(courseEnrollments.orgId, orgId), eq(courseEnrollments.isActive, true)));
  const activeMembers = Number(membersRow?.count ?? 0);

  return { revenue, registrations, sales, activeMembers };
}

export async function getRevenueChartData(
  orgId: number,
  days: number = 30,
  groupBy: 'day' | 'week' | 'month' = 'day'
) {
  const db = await getDb();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const fmt = groupBy === 'day' ? '%Y-%m-%d' : groupBy === 'week' ? '%Y-%u' : '%Y-%m';
  return db
    .select({
      date: sql<string>`DATE_FORMAT(${courseEnrollments.enrolledAt}, ${fmt})`,
      revenue: sql<number>`COALESCE(SUM(${courseEnrollments.amountPaid}), 0)`,
      enrollments: sql<number>`COUNT(*)`,
    })
    .from(courseEnrollments)
    .where(and(eq(courseEnrollments.orgId, orgId), gte(courseEnrollments.enrolledAt, cutoff)))
    .groupBy(sql`DATE_FORMAT(${courseEnrollments.enrolledAt}, ${fmt})`)
    .orderBy(sql`DATE_FORMAT(${courseEnrollments.enrolledAt}, ${fmt})`);
}

export async function getRecentActivity(orgId: number, limit: number = 20) {
  const db = await getDb();
  return db
    .select({
      id: courseEnrollments.id,
      type: sql<string>`'enrollment'`,
      userName: users.name,
      userEmail: users.email,
      courseName: courses.title,
      timestamp: courseEnrollments.enrolledAt,
      price: courseEnrollments.amountPaid,
    })
    .from(courseEnrollments)
    .innerJoin(users, eq(courseEnrollments.userId, users.id))
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .where(eq(courseEnrollments.orgId, orgId))
    .orderBy(desc(courseEnrollments.enrolledAt))
    .limit(limit);
}

export async function getRecentlyEditedCourses(orgId: number, limit: number = 6) {
  const db = await getDb();
  return db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      thumbnailUrl: courses.thumbnailUrl,
      status: courses.status,
      updatedAt: courses.updatedAt,
    })
    .from(courses)
    .where(eq(courses.orgId, orgId))
    .orderBy(desc(courses.updatedAt))
    .limit(limit);
}

export async function getEnrolledCoursesForUser(userId: number) {
  const db = await getDb();
  return db
    .select({
      enrollmentId: courseEnrollments.id,
      courseId: courses.id,
      title: courses.title,
      slug: courses.slug,
      thumbnailUrl: courses.thumbnailUrl,
      status: courses.status,
      progressPct: courseEnrollments.progressPct,
      completedAt: courseEnrollments.completedAt,
      lastAccessedAt: courseEnrollments.lastAccessedAt,
      lastLessonId: courseEnrollments.lastLessonId,
      enrolledAt: courseEnrollments.enrolledAt,
      orgId: courses.orgId,
    })
    .from(courseEnrollments)
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .where(and(eq(courseEnrollments.userId, userId), eq(courseEnrollments.isActive, true)))
    .orderBy(desc(courseEnrollments.lastAccessedAt));
}

// ─── LMS Analytics ───────────────────────────────────────────────────────────

export async function getLmsAnalyticsByOrg(orgId: number) {
  const [enrollmentCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(courseEnrollments)
    .where(eq(courseEnrollments.orgId, orgId));

  const [completionCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(courseEnrollments)
    .where(and(eq(courseEnrollments.orgId, orgId), sql`completedAt IS NOT NULL`));

  const [courseCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(courses)
    .where(eq(courses.orgId, orgId));

  return {
    totalEnrollments: Number(enrollmentCount?.count ?? 0),
    totalCompletions: Number(completionCount?.count ?? 0),
    totalCourses: Number(courseCount?.count ?? 0),
  };
}
