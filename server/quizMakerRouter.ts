import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { quizzes, quizQuestions, quizAnswerChoices } from "../drizzle/schema";
import { eq, and, asc, desc } from "drizzle-orm";

// ─── QuizMaker Web Editor Router ─────────────────────────────────────────────
// Full CRUD for standalone quizzes owned by a user (userId-based, not org-based)

export const quizMakerRouter = router({
  // ── Quiz CRUD ──────────────────────────────────────────────────────────────

  /** List all quizzes owned by the current user */
  listQuizzes: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const rows = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, ctx.user.id))
      .orderBy(desc(quizzes.updatedAt));
    return rows;
  }),

  /** Get a single quiz with all its questions and answer choices */
  getQuiz: protectedProcedure
    .input(z.object({ quizId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [quiz] = await db
        .select()
        .from(quizzes)
        .where(and(eq(quizzes.id, input.quizId), eq(quizzes.userId, ctx.user.id)));
      if (!quiz) throw new Error("Quiz not found");

      const questions = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, input.quizId))
        .orderBy(asc(quizQuestions.sortOrder));

      const questionIds = questions.map((q: any) => q.id);
      let choices: any[] = [];
      if (questionIds.length > 0) {
        const allChoices = await db.select().from(quizAnswerChoices);
        choices = allChoices.filter((c: any) => questionIds.includes(c.questionId));
      }

      const choicesByQuestion: Record<number, any[]> = {};
      for (const c of choices) {
        if (!choicesByQuestion[c.questionId]) choicesByQuestion[c.questionId] = [];
        choicesByQuestion[c.questionId].push(c);
      }

      return {
        ...quiz,
        questions: questions.map((q: any) => ({
          ...q,
          choices: (choicesByQuestion[q.id] || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder),
        })),
      };
    }),

  /** Create a new quiz */
  createQuiz: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(quizzes).values({
        title: input.title,
        description: input.description || null,
        orgId: 0,
        createdBy: ctx.user.id,
        userId: ctx.user.id,
        passingScore: 70,
        shuffleQuestions: false,
        shuffleAnswers: false,
        showFeedbackImmediately: true,
        showCorrectAnswers: true,
        isPublished: false,
      });
      return { id: result.insertId };
    }),

  /** Update quiz settings */
  updateQuiz: protectedProcedure
    .input(
      z.object({
        quizId: z.number(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().optional(),
        instructions: z.string().optional(),
        passingScore: z.number().min(0).max(100).optional(),
        timeLimit: z.number().nullable().optional(),
        maxAttempts: z.number().nullable().optional(),
        shuffleQuestions: z.boolean().optional(),
        shuffleAnswers: z.boolean().optional(),
        showFeedbackImmediately: z.boolean().optional(),
        showCorrectAnswers: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const { quizId, ...data } = input;
      const [quiz] = await db
        .select()
        .from(quizzes)
        .where(and(eq(quizzes.id, quizId), eq(quizzes.userId, ctx.user.id)));
      if (!quiz) throw new Error("Quiz not found");

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.instructions !== undefined) updateData.instructions = data.instructions;
      if (data.passingScore !== undefined) updateData.passingScore = data.passingScore;
      if (data.timeLimit !== undefined) updateData.timeLimit = data.timeLimit;
      if (data.maxAttempts !== undefined) updateData.maxAttempts = data.maxAttempts;
      if (data.shuffleQuestions !== undefined) updateData.shuffleQuestions = data.shuffleQuestions;
      if (data.shuffleAnswers !== undefined) updateData.shuffleAnswers = data.shuffleAnswers;
      if (data.showFeedbackImmediately !== undefined) updateData.showFeedbackImmediately = data.showFeedbackImmediately;
      if (data.showCorrectAnswers !== undefined) updateData.showCorrectAnswers = data.showCorrectAnswers;

      if (Object.keys(updateData).length > 0) {
        await db.update(quizzes).set(updateData).where(eq(quizzes.id, quizId));
      }
      return { success: true };
    }),

  /** Delete a quiz and all its questions/choices */
  deleteQuiz: protectedProcedure
    .input(z.object({ quizId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [quiz] = await db
        .select()
        .from(quizzes)
        .where(and(eq(quizzes.id, input.quizId), eq(quizzes.userId, ctx.user.id)));
      if (!quiz) throw new Error("Quiz not found");

      const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, input.quizId));
      for (const q of questions) {
        await db.delete(quizAnswerChoices).where(eq(quizAnswerChoices.questionId, q.id));
      }
      await db.delete(quizQuestions).where(eq(quizQuestions.quizId, input.quizId));
      await db.delete(quizzes).where(eq(quizzes.id, input.quizId));
      return { success: true };
    }),

  // ── Question CRUD ──────────────────────────────────────────────────────────

  /** Add a question to a quiz */
  addQuestion: protectedProcedure
    .input(
      z.object({
        quizId: z.number(),
        questionType: z.enum([
          "multiple_choice", "true_false", "short_answer", "long_answer",
          "matching", "multiple_select", "hotspot", "ordering",
          "fill_blank", "numeric", "rating_scale",
        ]),
        questionText: z.string().default("New Question"),
        points: z.number().default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [quiz] = await db
        .select()
        .from(quizzes)
        .where(and(eq(quizzes.id, input.quizId), eq(quizzes.userId, ctx.user.id)));
      if (!quiz) throw new Error("Quiz not found");

      const existing = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, input.quizId));
      const nextOrder = existing.length;

      const [result] = await db.insert(quizQuestions).values({
        quizId: input.quizId,
        sortOrder: nextOrder,
        questionType: input.questionType,
        questionText: input.questionText,
        points: input.points,
      });

      const qId = result.insertId;
      if (input.questionType === "multiple_choice") {
        await db.insert(quizAnswerChoices).values([
          { questionId: qId, sortOrder: 0, choiceText: "Option A", isCorrect: true },
          { questionId: qId, sortOrder: 1, choiceText: "Option B", isCorrect: false },
          { questionId: qId, sortOrder: 2, choiceText: "Option C", isCorrect: false },
          { questionId: qId, sortOrder: 3, choiceText: "Option D", isCorrect: false },
        ]);
      } else if (input.questionType === "true_false") {
        await db.insert(quizAnswerChoices).values([
          { questionId: qId, sortOrder: 0, choiceText: "True", isCorrect: true },
          { questionId: qId, sortOrder: 1, choiceText: "False", isCorrect: false },
        ]);
      } else if (input.questionType === "multiple_select") {
        await db.insert(quizAnswerChoices).values([
          { questionId: qId, sortOrder: 0, choiceText: "Option A", isCorrect: true },
          { questionId: qId, sortOrder: 1, choiceText: "Option B", isCorrect: true },
          { questionId: qId, sortOrder: 2, choiceText: "Option C", isCorrect: false },
          { questionId: qId, sortOrder: 3, choiceText: "Option D", isCorrect: false },
        ]);
      }

      return { id: qId };
    }),

  /** Update a question */
  updateQuestion: protectedProcedure
    .input(
      z.object({
        questionId: z.number(),
        questionText: z.string().optional(),
        questionType: z.enum([
          "multiple_choice", "true_false", "short_answer", "long_answer",
          "matching", "multiple_select", "hotspot", "ordering",
          "fill_blank", "numeric", "rating_scale",
        ]).optional(),
        points: z.number().optional(),
        explanation: z.string().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
        orderingItemsJson: z.string().nullable().optional(),
        fillBlankAnswersJson: z.string().nullable().optional(),
        numericAnswer: z.number().nullable().optional(),
        numericTolerance: z.number().nullable().optional(),
        ratingMin: z.number().optional(),
        ratingMax: z.number().optional(),
        ratingLabelsJson: z.string().nullable().optional(),
        branchOnCorrect: z.number().nullable().optional(),
        branchOnIncorrect: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const { questionId, ...data } = input;
      const updateData: any = {};
      for (const [key, val] of Object.entries(data)) {
        if (val !== undefined) updateData[key] = val;
      }
      if (Object.keys(updateData).length > 0) {
        await db.update(quizQuestions).set(updateData).where(eq(quizQuestions.id, questionId));
      }
      return { success: true };
    }),

  /** Delete a question and its choices */
  deleteQuestion: protectedProcedure
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.delete(quizAnswerChoices).where(eq(quizAnswerChoices.questionId, input.questionId));
      await db.delete(quizQuestions).where(eq(quizQuestions.id, input.questionId));
      return { success: true };
    }),

  /** Reorder questions */
  reorderQuestions: protectedProcedure
    .input(
      z.object({
        quizId: z.number(),
        questionIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      for (let i = 0; i < input.questionIds.length; i++) {
        await db
          .update(quizQuestions)
          .set({ sortOrder: i })
          .where(eq(quizQuestions.id, input.questionIds[i]));
      }
      return { success: true };
    }),

  // ── Answer Choice CRUD ─────────────────────────────────────────────────────

  /** Add a choice to a question */
  addChoice: protectedProcedure
    .input(
      z.object({
        questionId: z.number(),
        choiceText: z.string().default("New Option"),
        isCorrect: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const existing = await db
        .select()
        .from(quizAnswerChoices)
        .where(eq(quizAnswerChoices.questionId, input.questionId));
      const nextOrder = existing.length;
      const [result] = await db.insert(quizAnswerChoices).values({
        questionId: input.questionId,
        sortOrder: nextOrder,
        choiceText: input.choiceText,
        isCorrect: input.isCorrect,
      });
      return { id: result.insertId };
    }),

  /** Update a choice */
  updateChoice: protectedProcedure
    .input(
      z.object({
        choiceId: z.number(),
        choiceText: z.string().optional(),
        isCorrect: z.boolean().optional(),
        matchTarget: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const { choiceId, ...data } = input;
      const updateData: any = {};
      for (const [key, val] of Object.entries(data)) {
        if (val !== undefined) updateData[key] = val;
      }
      if (Object.keys(updateData).length > 0) {
        await db.update(quizAnswerChoices).set(updateData).where(eq(quizAnswerChoices.id, choiceId));
      }
      return { success: true };
    }),

  /** Delete a choice */
  deleteChoice: protectedProcedure
    .input(z.object({ choiceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.delete(quizAnswerChoices).where(eq(quizAnswerChoices.id, input.choiceId));
      return { success: true };
    }),

  // ── Bulk Save (for web editor local-to-cloud sync) ─────────────────────────

  /** Save entire quiz from local editor to cloud (create or update) */
  saveQuiz: protectedProcedure
    .input(
      z.object({
        quizId: z.number().optional(), // if provided, update existing
        title: z.string().min(1).max(500),
        description: z.string().optional(),
        questionsJson: z.string(), // JSON string of the full questions array
        settingsJson: z.string().optional(), // JSON string of quiz meta/settings
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;

      if (input.quizId) {
        // Update existing
        const [existing] = await db
          .select()
          .from(quizzes)
          .where(and(eq(quizzes.id, input.quizId), eq(quizzes.userId, ctx.user.id)));
        if (!existing) throw new Error("Quiz not found");

        await db.update(quizzes).set({
          title: input.title,
          description: input.description || null,
        }).where(eq(quizzes.id, input.quizId));

        // Store questions JSON in instructions field as a workaround
        // (full question sync would require parsing and updating each question row)
        await db.update(quizzes).set({
          instructions: input.questionsJson,
        }).where(eq(quizzes.id, input.quizId));

        return { id: input.quizId };
      } else {
        // Create new
        const [result] = await db.insert(quizzes).values({
          title: input.title,
          description: input.description || null,
          instructions: input.questionsJson,
          orgId: 0,
          createdBy: ctx.user.id,
          userId: ctx.user.id,
          passingScore: 70,
          shuffleQuestions: false,
          shuffleAnswers: false,
          showFeedbackImmediately: true,
          showCorrectAnswers: true,
          isPublished: false,
        });
        return { id: result.insertId };
      }
    }),

  // ── Publish / Export ───────────────────────────────────────────────────────

  /** Publish a quiz (mark as published) */
  publishQuiz: protectedProcedure
    .input(z.object({ quizId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [quiz] = await db
        .select()
        .from(quizzes)
        .where(and(eq(quizzes.id, input.quizId), eq(quizzes.userId, ctx.user.id)));
      if (!quiz) throw new Error("Quiz not found");
      await db.update(quizzes).set({ isPublished: true }).where(eq(quizzes.id, input.quizId));
      return { success: true };
    }),

  /** Duplicate a quiz */
  duplicateQuiz: protectedProcedure
    .input(z.object({ quizId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [quiz] = await db
        .select()
        .from(quizzes)
        .where(and(eq(quizzes.id, input.quizId), eq(quizzes.userId, ctx.user.id)));
      if (!quiz) throw new Error("Quiz not found");

      const [newQuiz] = await db.insert(quizzes).values({
        title: `${quiz.title} (Copy)`,
        description: quiz.description,
        instructions: quiz.instructions,
        orgId: 0,
        createdBy: ctx.user.id,
        userId: ctx.user.id,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
        maxAttempts: quiz.maxAttempts,
        shuffleQuestions: quiz.shuffleQuestions,
        shuffleAnswers: quiz.shuffleAnswers,
        showFeedbackImmediately: quiz.showFeedbackImmediately,
        showCorrectAnswers: quiz.showCorrectAnswers,
        isPublished: false,
      });
      const newQuizId = newQuiz.insertId;

      const questions = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, input.quizId))
        .orderBy(asc(quizQuestions.sortOrder));

      for (const q of questions) {
        const [newQ] = await db.insert(quizQuestions).values({
          quizId: newQuizId,
          sortOrder: q.sortOrder,
          questionType: q.questionType,
          questionText: q.questionText,
          questionHtml: q.questionHtml,
          imageUrl: q.imageUrl,
          points: q.points,
          explanation: q.explanation,
          orderingItemsJson: q.orderingItemsJson,
          fillBlankAnswersJson: q.fillBlankAnswersJson,
          numericAnswer: q.numericAnswer,
          numericTolerance: q.numericTolerance,
          ratingMin: q.ratingMin,
          ratingMax: q.ratingMax,
          ratingLabelsJson: q.ratingLabelsJson,
        });
        const newQId = newQ.insertId;

        const choices = await db
          .select()
          .from(quizAnswerChoices)
          .where(eq(quizAnswerChoices.questionId, q.id));
        if (choices.length > 0) {
          await db.insert(quizAnswerChoices).values(
            choices.map((c: any) => ({
              questionId: newQId,
              sortOrder: c.sortOrder,
              choiceText: c.choiceText,
              isCorrect: c.isCorrect,
              matchTarget: c.matchTarget,
            }))
          );
        }
      }

      return { id: newQuizId };
    }),
});
