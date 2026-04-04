import { useState } from "react";
import { EditorToolbar } from "@/quiz-creator/components/EditorToolbar";
import { QuestionList } from "@/quiz-creator/components/QuestionList";
import { QuestionEditor } from "@/quiz-creator/components/QuestionEditor";
import { QuizSettings } from "@/quiz-creator/components/QuizSettings";
import { LicenseManager } from "@/quiz-creator/components/LicenseManager";
import { QuizPreview } from "@/quiz-creator/components/QuizPreview";

export default function QuizCreatorPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [showLicense, setShowLicense] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <EditorToolbar
        onPreview={() => setShowPreview(true)}
        onSettings={() => setShowSettings(true)}
        onLicense={() => setShowLicense(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <QuestionList />
        <QuestionEditor />
      </div>

      {showSettings && <QuizSettings onClose={() => setShowSettings(false)} />}
      {showLicense && <LicenseManager onClose={() => setShowLicense(false)} />}
      {showPreview && <QuizPreview onClose={() => setShowPreview(false)} />}
    </div>
  );
}
