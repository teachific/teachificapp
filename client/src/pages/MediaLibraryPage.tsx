import { useState } from "react";
import { Upload, FileArchive, BookOpen, Layers, Video } from "lucide-react";
import UploadPage from "./UploadPage";
import FilesPage from "./FilesPage";
import QuizzesPage from "./QuizzesPage";
import FlashcardsPage from "./FlashcardsPage";
import RecordEditPage from "./RecordEditPage";

type TabId = "files" | "upload" | "quizzes" | "flashcards" | "record-edit";

function getDefaultTab(): TabId {
  const hash = window.location.hash.replace("#", "") as TabId;
  return (["files", "upload", "quizzes", "flashcards", "record-edit"] as TabId[]).includes(hash) ? hash : "files";
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "files", label: "My Files", icon: FileArchive },
  { id: "upload", label: "Upload Content", icon: Upload },
  { id: "record-edit", label: "Record / Edit", icon: Video },
  { id: "quizzes", label: "Quizzes", icon: BookOpen },
  { id: "flashcards", label: "Flashcards", icon: Layers },
];

export default function MediaLibraryPage() {
  const [activeTab, setActiveTab] = useState<TabId>(getDefaultTab);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab bar */}
      <div className="flex items-center gap-0 px-6 border-b border-border bg-background shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === "files" && <FilesPage />}
        {activeTab === "upload" && <UploadPage />}
        {activeTab === "record-edit" && <RecordEditPage />}
        {activeTab === "quizzes" && <QuizzesPage />}
        {activeTab === "flashcards" && <FlashcardsPage />}
      </div>
    </div>
  );
}
