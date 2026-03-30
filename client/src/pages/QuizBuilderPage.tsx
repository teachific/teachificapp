import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft, Download, GripVertical, Plus, Save, Trash2, Upload, CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

type QuestionType = "multiple_choice" | "true_false" | "multiple_select" | "short_answer" | "essay";
type Choice = { text: string; isCorrect: boolean; feedback?: string };
type Question = { id: string; type: QuestionType; text: string; points: number; choices: Choice[]; correctFeedback?: string; incorrectFeedback?: string };

const QT_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple Choice", true_false: "True/False",
  multiple_select: "Multiple Select", short_answer: "Short Answer", essay: "Essay",
};

function QuestionCard({ q, idx, onChange, onDelete }: { q: Question; idx: number; onChange: (q: Question) => void; onDelete: () => void }) {
  const addChoice = () => onChange({ ...q, choices: [...q.choices, { text: "", isCorrect: false }] });
  const updateChoice = (i: number, c: Choice) => onChange({ ...q, choices: q.choices.map((x, j) => j === i ? c : x) });
  const removeChoice = (i: number) => onChange({ ...q, choices: q.choices.filter((_, j) => j !== i) });
  const toggleCorrect = (i: number) => {
    if (q.type === "multiple_choice" || q.type === "true_false") {
      onChange({ ...q, choices: q.choices.map((c, j) => ({ ...c, isCorrect: j === i })) });
    } else {
      updateChoice(i, { ...q.choices[i], isCorrect: !q.choices[i].isCorrect });
    }
  };

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <GripVertical className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{idx + 1}</Badge>
              <select className="h-7 rounded border border-input bg-background px-2 text-xs"
                value={q.type} onChange={(e) => onChange({ ...q, type: e.target.value as QuestionType, choices: e.target.value === "true_false" ? [{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }] : q.choices })}>
                {Object.entries(QT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <Input type="number" value={q.points} onChange={(e) => onChange({ ...q, points: Number(e.target.value) })} className="h-7 w-16 text-xs" placeholder="pts" />
              <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
            <textarea className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              value={q.text} onChange={(e) => onChange({ ...q, text: e.target.value })} placeholder="Question text..." />
          </div>
        </div>
      </CardHeader>
      {(q.type === "multiple_choice" || q.type === "true_false" || q.type === "multiple_select") && (
        <CardContent className="pt-0 pl-10 space-y-2">
          {q.choices.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => toggleCorrect(i)} className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${c.isCorrect ? "border-emerald-500 bg-emerald-500" : "border-border"}`}>
                {c.isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
              </button>
              <Input value={c.text} onChange={(e) => updateChoice(i, { ...c, text: e.target.value })} className="h-8 text-sm flex-1" placeholder={`Answer ${i + 1}`} />
              {q.type !== "true_false" && (
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeChoice(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
              )}
            </div>
          ))}
          {q.type !== "true_false" && (
            <Button variant="ghost" size="sm" onClick={addChoice} className="gap-1.5 text-xs h-7"><Plus className="h-3 w-3" />Add Answer</Button>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div><Label className="text-xs">Correct Feedback</Label><Input value={q.correctFeedback ?? ""} onChange={(e) => onChange({ ...q, correctFeedback: e.target.value })} className="h-7 text-xs mt-1" placeholder="Great job!" /></div>
            <div><Label className="text-xs">Incorrect Feedback</Label><Input value={q.incorrectFeedback ?? ""} onChange={(e) => onChange({ ...q, incorrectFeedback: e.target.value })} className="h-7 text-xs mt-1" placeholder="Try again..." /></div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function QuizBuilderPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const isNew = !params.id || params.id === "new";
  const { data: myOrgs } = trpc.orgs.myOrgs.useQuery();
  const orgId = myOrgs?.[0]?.id ?? 0;

  const createQuiz = trpc.quizzes.create.useMutation();
  const upsertQuestions = trpc.quizzes.questions.upsert.useMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState("70");
  const [timeLimit, setTimeLimit] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  const addQuestion = (type: QuestionType = "multiple_choice") => {
    const q: Question = {
      id: Math.random().toString(36).slice(2),
      type,
      text: "",
      points: 1,
      choices: type === "true_false"
        ? [{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }]
        : [{ text: "", isCorrect: true }, { text: "", isCorrect: false }],
    };
    setQuestions([...questions, q]);
  };

  const handleImportExcel = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xls,.xlsx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/quiz/import/preview", { method: "POST", body: fd });
      const data = await res.json();
      if (data.questions) {
        const imported: Question[] = data.questions.map((q: any) => ({
          id: Math.random().toString(36).slice(2),
          type: q.type as QuestionType,
          text: q.text,
          points: q.points ?? 1,
          choices: (q.choices ?? []).map((c: any) => ({ text: c.text, isCorrect: c.isCorrect, feedback: c.feedback })),
          correctFeedback: q.correctFeedback,
          incorrectFeedback: q.incorrectFeedback,
        }));
        setQuestions([...questions, ...imported]);
        toast.success(`Imported ${imported.length} questions`);
      } else {
        toast.error("Import failed: " + (data.error ?? "Unknown error"));
      }
    };
    input.click();
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Please enter a quiz title"); return; }
    if (!orgId) { toast.error("No organization found"); return; }
    setSaving(true);
    try {
      const quizResult = await createQuiz.mutateAsync({
        orgId,
        title,
        description: description || undefined,
        passingScore: passingScore ? Number(passingScore) : undefined,
        timeLimit: timeLimit ? Number(timeLimit) : undefined,
        maxAttempts: maxAttempts ? Number(maxAttempts) : undefined,
      });
      const quizId2 = (quizResult as any).insertId ?? (quizResult as any).id;
      await upsertQuestions.mutateAsync({
        quizId: quizId2,
        questions: questions.map((q, i) => ({
          sortOrder: i,
          questionType: q.type as any,
          questionText: q.text,
          points: q.points,
          choices: q.choices.map((c, ci) => ({ sortOrder: ci, choiceText: c.text, isCorrect: c.isCorrect })),
        })),
      });
      toast.success("Quiz saved successfully!");
      setLocation(`/quizzes/${quizId2}`);
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/quizzes")}><ChevronLeft className="h-4 w-4" /></Button>
        <h1 className="text-xl font-bold flex-1">{isNew ? "Create Quiz" : "Edit Quiz"}</h1>
        <Button variant="outline" onClick={handleImportExcel} className="gap-2"><Upload className="h-4 w-4" />Import Excel</Button>
        <Button variant="outline" asChild className="gap-2"><a href="/api/quiz/template" download="QuizTemplate.xlsx"><Download className="h-4 w-4" />Template</a></Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save Quiz"}</Button>
      </div>

      <Tabs defaultValue="settings">
        <TabsList><TabsTrigger value="settings">Settings</TabsTrigger><TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger></TabsList>

        <TabsContent value="settings" className="mt-4">
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5"><Label>Quiz Title <span className="text-destructive">*</span></Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. OBGYN Board Review Quiz" /></div>
              <div className="space-y-1.5"><Label>Description</Label><textarea className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5"><Label>Passing Score (%)</Label><Input type="number" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} placeholder="70" /></div>
                <div className="space-y-1.5"><Label>Time Limit (min)</Label><Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="Unlimited" /></div>
                <div className="space-y-1.5"><Label>Max Attempts</Label><Input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} placeholder="Unlimited" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="mt-4 space-y-4">
          {questions.length === 0 ? (
            <Card className="shadow-sm border-border/60">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No questions yet. Add questions manually or import from Excel.</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {(["multiple_choice", "true_false", "multiple_select", "short_answer"] as QuestionType[]).map((t) => (
                    <Button key={t} variant="outline" size="sm" onClick={() => addQuestion(t)}><Plus className="h-3.5 w-3.5 mr-1" />{QT_LABELS[t]}</Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {questions.map((q, i) => (
                <QuestionCard key={q.id} q={q} idx={i}
                  onChange={(updated) => setQuestions(questions.map((x) => x.id === q.id ? updated : x))}
                  onDelete={() => setQuestions(questions.filter((x) => x.id !== q.id))} />
              ))}
            </>
          )}
          <div className="flex gap-2 flex-wrap">
            {(["multiple_choice", "true_false", "multiple_select", "short_answer", "essay"] as QuestionType[]).map((t) => (
              <Button key={t} variant="outline" size="sm" onClick={() => addQuestion(t)}><Plus className="h-3.5 w-3.5 mr-1" />{QT_LABELS[t]}</Button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
