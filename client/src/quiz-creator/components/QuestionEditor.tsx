import { useQuizStore } from "../store/quizStore";
import { McqEditor } from "./editors/McqEditor";
import { TfEditor, FillBlankEditor, ShortAnswerEditor, ImageChoiceEditor } from "./editors/SimpleEditors";
import { HotspotEditor } from "./editors/HotspotEditor";
import { MatchingEditor } from "./editors/MatchingEditor";
import type { QuizQuestion, QuestionData } from "../types/quiz";
import { Upload, Trash2 } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple Choice",
  tf: "True / False",
  matching: "Matching",
  hotspot: "Hotspot",
  fill_blank: "Fill in the Blank",
  short_answer: "Short Answer",
  image_choice: "Image Choice",
};

export function QuestionEditor() {
  const { quiz, activeQuestionId, updateQuestion, deleteQuestion } = useQuizStore();
  const question = quiz.questions.find((q) => q.id === activeQuestionId);

  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-sm">Select a question from the list, or add a new one</p>
        </div>
      </div>
    );
  }

  const update = (updates: Partial<QuizQuestion>) => updateQuestion(question.id, updates);
  const updateData = (data: QuestionData) => update({ data });

  const uploadStemImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => update({ image: { url: reader.result as string, alt: file.name } });
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Question header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: "#15a4b7" }}>
              Q{question.order}
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {TYPE_LABELS[question.type]}
            </span>
          </div>
          <textarea
            value={question.stem}
            onChange={(e) => update({ stem: e.target.value })}
            placeholder="Enter your question here..."
            rows={3}
            className="w-full px-4 py-3 text-base font-medium border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 resize-none"
          />
        </div>
        <button
          onClick={() => deleteQuestion(question.id)}
          className="p-2 text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-8"
          title="Delete question"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Stem image */}
      {question.image ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img src={question.image.url} alt={question.image.alt} className="w-full max-h-48 object-cover" />
          <button
            onClick={() => update({ image: null })}
            className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-600 hover:text-red-500 rounded-full p-1.5 shadow transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={uploadStemImage}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-teal-600 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Add image to question
        </button>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Type-specific editor */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Answer</p>
        {question.type === "mcq" && (
          <McqEditor data={question.data as any} onChange={updateData} />
        )}
        {question.type === "tf" && (
          <TfEditor data={question.data as any} onChange={updateData} />
        )}
        {question.type === "matching" && (
          <MatchingEditor data={question.data as any} onChange={updateData} />
        )}
        {question.type === "hotspot" && (
          <HotspotEditor data={question.data as any} onChange={updateData} />
        )}
        {question.type === "fill_blank" && (
          <FillBlankEditor data={question.data as any} onChange={updateData} />
        )}
        {question.type === "short_answer" && (
          <ShortAnswerEditor data={question.data as any} onChange={updateData} />
        )}
        {question.type === "image_choice" && (
          <ImageChoiceEditor data={question.data as any} onChange={updateData} />
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Question settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Points</label>
          <input
            type="number"
            min={0}
            max={100}
            value={question.points}
            onChange={(e) => update({ points: Number(e.target.value) })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50"
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => update({ required: e.target.checked })}
              className="accent-teal-500"
            />
            Required
          </label>
        </div>
      </div>

      {/* Explanation / Feedback */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Explanation / Feedback (shown after answer)
        </label>
        <textarea
          value={question.explanation}
          onChange={(e) => update({ explanation: e.target.value })}
          rows={2}
          placeholder="Optional: explain why the answer is correct..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/50 resize-none"
        />
      </div>
    </div>
  );
}
