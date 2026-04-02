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
  memberActivityEvents,
  digitalProducts,
  digitalProductPrices,
  digitalOrders,
  digitalDownloadLogs,
  webinars,
  webinarRegistrations,
  webinarSessions,
  webinarFunnelSteps,
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

export async function getPublishedPageBySlug(slug: string) {
  const rows = await db
    .select()
    .from(pageBuilderPages)
    .where(
      and(
        eq(pageBuilderPages.slug, slug),
        eq(pageBuilderPages.isPublished, true)
      )
    );
  return rows[0] ?? null;
}

export async function duplicatePage(id: number) {
  const original = await getPageById(id);
  if (!original) return null;
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = original;
  const newTitle = `${original.title ?? "Untitled"} (Copy)`;
  const newSlug = `${original.slug ?? "page"}-copy-${Date.now()}`;
  const result = await db.insert(pageBuilderPages).values({
    ...rest,
    title: newTitle,
    slug: newSlug,
    isPublished: false,
  });
  const newId = (result as any)[0]?.insertId ?? (result as any).insertId;
  return getPageById(Number(newId));
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

// ─── Member Activity Events ───────────────────────────────────────────────────

export async function insertActivityEvents(events: typeof memberActivityEvents.$inferInsert[]) {
  if (!events.length) return;
  await db.insert(memberActivityEvents).values(events as any);
}

export async function getActivityEventsByOrg(
  orgId: number,
  opts: {
    userId?: number;
    courseId?: number;
    eventType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  } = {}
) {
  const conditions = [eq(memberActivityEvents.orgId, orgId)];
  if (opts.userId) conditions.push(eq(memberActivityEvents.userId, opts.userId));
  if (opts.courseId) conditions.push(eq(memberActivityEvents.courseId, opts.courseId));
  if (opts.eventType) conditions.push(eq(memberActivityEvents.eventType, opts.eventType as any));
  if (opts.dateFrom) conditions.push(gte(memberActivityEvents.createdAt, opts.dateFrom));
  if (opts.dateTo) conditions.push(sql`${memberActivityEvents.createdAt} <= ${opts.dateTo}`);

  return db
    .select()
    .from(memberActivityEvents)
    .where(and(...conditions))
    .orderBy(desc(memberActivityEvents.createdAt))
    .limit(opts.limit ?? 200)
    .offset(opts.offset ?? 0);
}

export async function getActivitySummaryByUser(orgId: number, userId: number) {
  // Total session time (sum of session_heartbeat durationMs + page_exit durationMs)
  const [timeRow] = await db
    .select({ totalMs: sql<number>`COALESCE(SUM(${memberActivityEvents.durationMs}), 0)` })
    .from(memberActivityEvents)
    .where(
      and(
        eq(memberActivityEvents.orgId, orgId),
        eq(memberActivityEvents.userId, userId),
        sql`${memberActivityEvents.eventType} IN ('session_heartbeat', 'page_exit')`
      )
    );
  const [pageViewRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(memberActivityEvents)
    .where(
      and(
        eq(memberActivityEvents.orgId, orgId),
        eq(memberActivityEvents.userId, userId),
        eq(memberActivityEvents.eventType, "page_view")
      )
    );
  const [videoRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(memberActivityEvents)
    .where(
      and(
        eq(memberActivityEvents.orgId, orgId),
        eq(memberActivityEvents.userId, userId),
        eq(memberActivityEvents.eventType, "video_complete")
      )
    );
  const [lessonRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(memberActivityEvents)
    .where(
      and(
        eq(memberActivityEvents.orgId, orgId),
        eq(memberActivityEvents.userId, userId),
        eq(memberActivityEvents.eventType, "lesson_complete")
      )
    );
  return {
    totalTimeMs: Number(timeRow?.totalMs ?? 0),
    pageViews: Number(pageViewRow?.count ?? 0),
    videosCompleted: Number(videoRow?.count ?? 0),
    lessonsCompleted: Number(lessonRow?.count ?? 0),
  };
}

export async function getActivityMemberList(orgId: number) {
  // Get distinct users who have activity in this org
  const rows = await db
    .selectDistinct({ userId: memberActivityEvents.userId })
    .from(memberActivityEvents)
    .where(and(eq(memberActivityEvents.orgId, orgId), sql`${memberActivityEvents.userId} IS NOT NULL`));
  return rows.map((r) => r.userId).filter(Boolean) as number[];
}

// ─── Notification Settings ────────────────────────────────────────────────────

export type NotificationSettings = {
  enrollment: boolean;
  completion: boolean;
  quizResult: boolean;
  reminder: boolean;
  announcement: boolean;
  weeklyDigest: boolean;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enrollment: true,
  completion: true,
  quizResult: true,
  reminder: false,
  announcement: true,
  weeklyDigest: false,
};

export async function getOrgNotificationSettings(orgId: number): Promise<NotificationSettings> {
  const theme = await getOrgTheme(orgId);
  if (!theme?.notificationSettings) return { ...DEFAULT_NOTIFICATION_SETTINGS };
  try {
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(theme.notificationSettings) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export async function updateOrgNotificationSettings(orgId: number, settings: Partial<NotificationSettings>) {
  const current = await getOrgNotificationSettings(orgId);
  const merged = { ...current, ...settings };
  await upsertOrgTheme(orgId, { notificationSettings: JSON.stringify(merged) });
  return merged;
}

export async function getCourseNotificationOverrides(courseId: number) {
  const course = await getCourseById(courseId);
  if (!course?.notificationOverrides) return null;
  try { return JSON.parse(course.notificationOverrides); }
  catch { return null; }
}

export async function updateCourseNotificationOverrides(courseId: number, overrides: Partial<NotificationSettings> | null) {
  await updateCourse(courseId, {
    notificationOverrides: overrides ? JSON.stringify(overrides) : null,
  });
}

// ─── Email Branding ───────────────────────────────────────────────────────────

export type EmailBranding = {
  logoUrl?: string;
  primaryColor?: string;
  footerText?: string;
  senderName?: string;
};

export async function getOrgEmailBranding(orgId: number): Promise<EmailBranding> {
  const theme = await getOrgTheme(orgId);
  if (!theme?.emailBranding) return {};
  try { return JSON.parse(theme.emailBranding); }
  catch { return {}; }
}

export async function updateOrgEmailBranding(orgId: number, branding: EmailBranding) {
  await upsertOrgTheme(orgId, { emailBranding: JSON.stringify(branding) });
  return branding;
}

// ─── Digital Downloads ────────────────────────────────────────────────────────
import { randomBytes } from "crypto";

export async function listDigitalProducts(orgId: number) {
  return db.select().from(digitalProducts).where(eq(digitalProducts.orgId, orgId)).orderBy(desc(digitalProducts.createdAt));
}

export async function getDigitalProduct(id: number) {
  const rows = await db.select().from(digitalProducts).where(eq(digitalProducts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getDigitalProductBySlug(slug: string) {
  const rows = await db.select().from(digitalProducts).where(eq(digitalProducts.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function createDigitalProduct(data: {
  orgId: number; title: string; slug: string; description?: string;
  fileUrl: string; fileKey: string; fileType?: string; fileSize?: number;
  thumbnailUrl?: string; defaultAccessDays?: number; defaultMaxDownloads?: number;
}) {
  const result = await db.insert(digitalProducts).values(data as any);
  return { id: (result as any)[0].insertId as number };
}

export async function updateDigitalProduct(id: number, data: Partial<{
  title: string; slug: string; description: string; fileUrl: string; fileKey: string;
  fileType: string; fileSize: number; thumbnailUrl: string; salesPageBlocksJson: any;
  isPublished: boolean; defaultAccessDays: number | null; defaultMaxDownloads: number | null;
}>) {
  await db.update(digitalProducts).set(data as any).where(eq(digitalProducts.id, id));
}

export async function deleteDigitalProduct(id: number) {
  await db.delete(digitalDownloadLogs).where(eq(digitalDownloadLogs.productId, id));
  await db.delete(digitalOrders).where(eq(digitalOrders.productId, id));
  await db.delete(digitalProductPrices).where(eq(digitalProductPrices.productId, id));
  await db.delete(digitalProducts).where(eq(digitalProducts.id, id));
}

export async function listProductPrices(productId: number) {
  return db.select().from(digitalProductPrices).where(eq(digitalProductPrices.productId, productId)).orderBy(asc(digitalProductPrices.createdAt));
}

export async function upsertProductPrice(data: {
  id?: number; productId: number; label: string; type: string; amount: string; currency?: string;
  installments?: number | null; installmentAmount?: string | null; intervalDays?: number | null; isActive?: boolean;
}) {
  if (data.id) {
    await db.update(digitalProductPrices).set(data as any).where(eq(digitalProductPrices.id, data.id));
    return data.id;
  }
  const result = await db.insert(digitalProductPrices).values(data as any);
  return (result as any)[0].insertId as number;
}

export async function deleteProductPrice(id: number) {
  await db.delete(digitalProductPrices).where(eq(digitalProductPrices.id, id));
}

export async function createDigitalOrder(data: {
  productId: number; priceId: number; orgId: number; buyerEmail: string; buyerName?: string;
  amount: string; currency?: string; paymentRef?: string;
  accessExpiresAt?: Date | null; maxDownloads?: number | null;
}) {
  const token = randomBytes(32).toString("hex");
  const result = await db.insert(digitalOrders).values({ ...data, downloadToken: token, status: "pending" } as any);
  return { id: (result as any)[0].insertId as number, downloadToken: token };
}

export async function markOrderPaid(id: number, paymentRef?: string) {
  await db.update(digitalOrders).set({ status: "paid", paidAt: new Date(), ...(paymentRef ? { paymentRef } : {}) } as any).where(eq(digitalOrders.id, id));
}

export async function getOrderByToken(token: string) {
  const rows = await db.select().from(digitalOrders).where(eq(digitalOrders.downloadToken, token)).limit(1);
  return rows[0] ?? null;
}

export async function getOrderById(id: number) {
  const rows = await db.select().from(digitalOrders).where(eq(digitalOrders.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listOrdersForProduct(productId: number) {
  return db.select().from(digitalOrders).where(eq(digitalOrders.productId, productId)).orderBy(desc(digitalOrders.createdAt));
}

export async function listOrdersForOrg(orgId: number) {
  return db.select().from(digitalOrders).where(eq(digitalOrders.orgId, orgId)).orderBy(desc(digitalOrders.createdAt));
}

export async function incrementDownloadCount(orderId: number) {
  await db.update(digitalOrders).set({ downloadCount: sql`${digitalOrders.downloadCount} + 1` } as any).where(eq(digitalOrders.id, orderId));
}

export async function logDownload(data: { orderId: number; productId: number; ipAddress?: string; userAgent?: string }) {
  await db.insert(digitalDownloadLogs).values(data as any);
}

export async function listDownloadLogs(productId: number) {
  return db.select().from(digitalDownloadLogs).where(eq(digitalDownloadLogs.productId, productId)).orderBy(desc(digitalDownloadLogs.downloadedAt));
}

export async function listDownloadLogsForOrder(orderId: number) {
  return db.select().from(digitalDownloadLogs).where(eq(digitalDownloadLogs.orderId, orderId)).orderBy(desc(digitalDownloadLogs.downloadedAt));
}

export async function updateOrderStatus(id: number, status: string, notes?: string) {
  await db.update(digitalOrders).set({ status, ...(notes !== undefined ? { notes } : {}) } as any).where(eq(digitalOrders.id, id));
}

// ─── Webinars ────────────────────────────────────────────────────────────────

export async function getWebinarsByOrg(orgId: number) {
  return db
    .select()
    .from(webinars)
    .where(eq(webinars.orgId, orgId))
    .orderBy(desc(webinars.createdAt));
}

export async function getWebinarById(id: number) {
  const rows = await db.select().from(webinars).where(eq(webinars.id, id));
  return rows[0] ?? null;
}

export async function getWebinarBySlug(orgId: number, slug: string) {
  const rows = await db
    .select()
    .from(webinars)
    .where(and(eq(webinars.orgId, orgId), eq(webinars.slug, slug)));
  return rows[0] ?? null;
}

export async function getPublishedWebinarBySlug(slug: string) {
  const rows = await db
    .select()
    .from(webinars)
    .where(and(eq(webinars.slug, slug), eq(webinars.isPublished, true)));
  return rows[0] ?? null;
}

export async function createWebinar(data: typeof webinars.$inferInsert) {
  const result = await db.insert(webinars).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  return getWebinarById(Number(id));
}

export async function updateWebinar(id: number, data: Partial<typeof webinars.$inferInsert>) {
  await db.update(webinars).set(data).where(eq(webinars.id, id));
  return getWebinarById(id);
}

export async function deleteWebinar(id: number) {
  await db.delete(webinarSessions).where(eq(webinarSessions.webinarId, id));
  await db.delete(webinarRegistrations).where(eq(webinarRegistrations.webinarId, id));
  await db.delete(webinarFunnelSteps).where(eq(webinarFunnelSteps.webinarId, id));
  await db.delete(webinars).where(eq(webinars.id, id));
}

// ─── Webinar Registrations ───────────────────────────────────────────────────

export async function getWebinarRegistrations(webinarId: number) {
  return db
    .select()
    .from(webinarRegistrations)
    .where(eq(webinarRegistrations.webinarId, webinarId))
    .orderBy(desc(webinarRegistrations.registeredAt));
}

export async function getWebinarRegistrationByEmail(webinarId: number, email: string) {
  const rows = await db
    .select()
    .from(webinarRegistrations)
    .where(and(eq(webinarRegistrations.webinarId, webinarId), eq(webinarRegistrations.email, email)));
  return rows[0] ?? null;
}

export async function createWebinarRegistration(data: typeof webinarRegistrations.$inferInsert) {
  const result = await db.insert(webinarRegistrations).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  const rows = await db.select().from(webinarRegistrations).where(eq(webinarRegistrations.id, Number(id)));
  return rows[0];
}

export async function updateWebinarRegistration(id: number, data: Partial<typeof webinarRegistrations.$inferInsert>) {
  await db.update(webinarRegistrations).set(data).where(eq(webinarRegistrations.id, id));
}

// ─── Webinar Sessions ────────────────────────────────────────────────────────

export async function createWebinarSession(data: typeof webinarSessions.$inferInsert) {
  const result = await db.insert(webinarSessions).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  const rows = await db.select().from(webinarSessions).where(eq(webinarSessions.id, Number(id)));
  return rows[0];
}

export async function getWebinarSessionByToken(token: string) {
  const rows = await db.select().from(webinarSessions).where(eq(webinarSessions.sessionToken, token));
  return rows[0] ?? null;
}

export async function updateWebinarSession(id: number, data: Partial<typeof webinarSessions.$inferInsert>) {
  await db.update(webinarSessions).set(data).where(eq(webinarSessions.id, id));
}

export async function getWebinarSessions(webinarId: number) {
  return db
    .select()
    .from(webinarSessions)
    .where(eq(webinarSessions.webinarId, webinarId))
    .orderBy(desc(webinarSessions.startedAt));
}

// ─── Webinar Funnel Steps ────────────────────────────────────────────────────

export async function getWebinarFunnelSteps(webinarId: number) {
  return db
    .select()
    .from(webinarFunnelSteps)
    .where(eq(webinarFunnelSteps.webinarId, webinarId))
    .orderBy(asc(webinarFunnelSteps.stepOrder));
}

export async function upsertWebinarFunnelSteps(webinarId: number, steps: typeof webinarFunnelSteps.$inferInsert[]) {
  await db.delete(webinarFunnelSteps).where(eq(webinarFunnelSteps.webinarId, webinarId));
  if (steps.length > 0) {
    await db.insert(webinarFunnelSteps).values(steps.map((s, i) => ({ ...s, webinarId, stepOrder: i })));
  }
}

// ─── Webinar Analytics ───────────────────────────────────────────────────────

export async function getWebinarStats(webinarId: number) {
  const registrations = await getWebinarRegistrations(webinarId);
  const sessions = await getWebinarSessions(webinarId);
  const attended = registrations.filter((r) => r.attended).length;
  const converted = registrations.filter((r) => r.convertedAt).length;
  const totalWatchSeconds = sessions.reduce((sum, s) => sum + (s.watchedSeconds ?? 0), 0);
  return {
    totalRegistrations: registrations.length,
    attended,
    converted,
    conversionRate: registrations.length > 0 ? Math.round((converted / registrations.length) * 100) : 0,
    avgWatchMinutes: sessions.length > 0 ? Math.round(totalWatchSeconds / sessions.length / 60) : 0,
  };
}
