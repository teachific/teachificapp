import { useQuizStore } from "../store/quizStore";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function QuizSettings({ onClose }: Props) {
  const { quiz, updateMeta } = useQuizStore();
  const m = quiz.meta;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Quiz Settings</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Title & description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Quiz Title</label>
            <input
              type="text"
              value={m.title}
              onChange={(e) => updateMeta({ title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
            <textarea
              value={m.description}
              onChange={(e) => updateMeta({ description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50 resize-none"
            />
          </div>

          {/* Author */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Author Name</label>
              <input
                type="text"
                value={m.author}
                onChange={(e) => updateMeta({ author: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Author Email</label>
              <input
                type="email"
                value={m.authorEmail}
                onChange={(e) => updateMeta({ authorEmail: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={m.tags.join(", ")}
              onChange={(e) => updateMeta({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
              placeholder="anatomy, cardiology, beginner"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50"
            />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            {/* Scoring */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Passing Score (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={m.passingScore}
                  onChange={(e) => updateMeta({ passingScore: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Time Limit (minutes)</label>
                <input
                  type="number"
                  min={0}
                  value={m.timeLimit ?? ""}
                  onChange={(e) => updateMeta({ timeLimit: e.target.value ? Number(e.target.value) : null })}
                  placeholder="No limit"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                />
              </div>
            </div>

            {/* Retry */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Max Attempts</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={m.maxAttempts}
                  onChange={(e) => updateMeta({ maxAttempts: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Show Feedback</label>
                <select
                  value={m.showFeedback}
                  onChange={(e) => updateMeta({ showFeedback: e.target.value as "immediate" | "deferred" | "never" })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                >
                  <option value="immediate">Immediately</option>
                  <option value="deferred">After submission</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              {[
                { key: "shuffleQuestions", label: "Shuffle question order" },
                { key: "shuffleAnswers", label: "Shuffle answer choices" },
                { key: "allowRetry", label: "Allow retry" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={m[key as keyof typeof m] as boolean}
                    onChange={(e) => updateMeta({ [key]: e.target.checked })}
                    className="accent-teal-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #24abbc, #0d8a9a)" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
