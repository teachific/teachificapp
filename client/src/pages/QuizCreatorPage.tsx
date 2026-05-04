import { useState, useEffect } from "react";
import { EditorToolbar } from "@/quiz-creator/components/EditorToolbar";
import { QuestionList } from "@/quiz-creator/components/QuestionList";
import { QuestionEditor } from "@/quiz-creator/components/QuestionEditor";
import { QuizSettings } from "@/quiz-creator/components/QuizSettings";
import { LicenseManager } from "@/quiz-creator/components/LicenseManager";
import { QuizPreview } from "@/quiz-creator/components/QuizPreview";
import { CloudQuizBrowser } from "@/quiz-creator/components/CloudQuizBrowser";
import { ShareDialog } from "@/quiz-creator/components/ShareDialog";
import { useQuizStore } from "@/quiz-creator/store/quizStore";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

export default function QuizCreatorPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [showLicense, setShowLicense] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCloudBrowser, setShowCloudBrowser] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const { quiz } = useQuizStore();
  const { user } = useAuth();

  // Get the cloud ID from the quiz meta (set when saving to cloud)
  const cloudId = (quiz.meta as any).cloudId as number | undefined;

  // Query publish status if we have a cloud ID
  const { data: publishStatus } = trpc.quizMaker.getPublishStatus.useQuery(
    { quizId: cloudId! },
    { enabled: !!cloudId && !!user }
  );

  const isPublished = publishStatus?.isPublished ?? false;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <EditorToolbar
        onPreview={() => setShowPreview(true)}
        onSettings={() => setShowSettings(true)}
        onLicense={() => setShowLicense(true)}
        onCloudOpen={() => setShowCloudBrowser(true)}
        onPublish={() => setShowShareDialog(true)}
        isPublished={isPublished}
      />

      <div className="flex flex-1 overflow-hidden">
        <QuestionList />
        <QuestionEditor />
      </div>

      {showSettings && <QuizSettings onClose={() => setShowSettings(false)} />}
      {showLicense && <LicenseManager onClose={() => setShowLicense(false)} />}
      {showPreview && <QuizPreview onClose={() => setShowPreview(false)} />}
      {showCloudBrowser && <CloudQuizBrowser onClose={() => setShowCloudBrowser(false)} />}
      {showShareDialog && (
        <ShareDialog
          open={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          quizId={cloudId ?? null}
        />
      )}
    </div>
  );
}
