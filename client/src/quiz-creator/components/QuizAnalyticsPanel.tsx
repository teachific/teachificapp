import { trpc } from "@/lib/trpc";
import { BarChart3, Users, Clock, Award, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface QuizAnalyticsPanelProps {
  quizId: number | null;
}

export default function QuizAnalyticsPanel({ quizId }: QuizAnalyticsPanelProps) {
  const [showAttempts, setShowAttempts] = useState(false);

  const { data: analytics, isLoading: analyticsLoading } = trpc.quizMaker.getQuizAnalytics.useQuery(
    { quizId: quizId! },
    { enabled: !!quizId }
  );

  const { data: attemptsData, isLoading: attemptsLoading } = trpc.quizMaker.getAttempts.useQuery(
    { quizId: quizId!, limit: 20, offset: 0 },
    { enabled: !!quizId && showAttempts }
  );

  if (!quizId) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Save and publish your quiz to see analytics.</p>
      </div>
    );
  }

  if (analyticsLoading) {
    return (
      <div className="p-6 text-center">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!analytics || analytics.totalAttempts === 0) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="font-medium text-gray-600 mb-1">No attempts yet</p>
        <p>Publish your quiz and share the link to start collecting responses.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" /> Quiz Analytics
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-[11px] text-gray-500">Total Attempts</span>
          </div>
          <p className="text-lg font-bold text-gray-800">{analytics.totalAttempts}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-[11px] text-gray-500">Avg Score</span>
          </div>
          <p className="text-lg font-bold text-gray-800">{analytics.averageScore}%</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Award className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-[11px] text-gray-500">Pass Rate</span>
          </div>
          <p className="text-lg font-bold text-gray-800">{analytics.passRate}%</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-[11px] text-gray-500">Avg Time</span>
          </div>
          <p className="text-lg font-bold text-gray-800">
            {analytics.averageTime > 60
              ? `${Math.floor(analytics.averageTime / 60)}m ${analytics.averageTime % 60}s`
              : `${analytics.averageTime}s`}
          </p>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-600">Score Distribution</p>
        <div className="flex items-end gap-1 h-20">
          {analytics.scoreDistribution.map((bucket, i) => {
            const maxCount = Math.max(...analytics.scoreDistribution.map((b) => b.count), 1);
            const height = (bucket.count / maxCount) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${Math.max(height, 2)}%`,
                    backgroundColor: bucket.count > 0 ? "#24abbc" : "#e5e7eb",
                  }}
                  title={`${bucket.range}: ${bucket.count} attempts`}
                />
                <span className="text-[9px] text-gray-400">{i * 10}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-400 text-center">Score %</p>
      </div>

      {/* Recent Attempts */}
      <div className="border-t border-gray-100 pt-3">
        <button
          onClick={() => setShowAttempts(!showAttempts)}
          className="flex items-center justify-between w-full text-xs font-medium text-gray-600 hover:text-gray-800"
        >
          <span>Recent Attempts</span>
          {showAttempts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAttempts && (
          <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
            {attemptsLoading ? (
              <div className="text-center py-2">
                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : attemptsData?.attempts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">No attempts found</p>
            ) : (
              attemptsData?.attempts.map((attempt: any) => (
                <div key={attempt.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {attempt.takerName || attempt.takerEmail || "Anonymous"}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(attempt.startedAt).toLocaleDateString()} · {attempt.timeTakenSeconds ? `${Math.round(attempt.timeTakenSeconds / 60)}m` : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${attempt.isPassed ? "text-teal-600" : "text-red-500"}`}>
                      {Math.round(attempt.scorePct || 0)}%
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      attempt.isPassed ? "bg-teal-100 text-teal-700" : "bg-red-100 text-red-700"
                    }`}>
                      {attempt.isPassed ? "Pass" : "Fail"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
