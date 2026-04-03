import { useState, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FieldOption {
  value: string;
  label: string;
}

interface FormField {
  id: number;
  type: string;
  label: string;
  placeholder?: string | null;
  helpText?: string | null;
  required: boolean;
  sortOrder: number;
  options: FieldOption[];
  isBranchingSource: boolean;
}

interface BranchingRule {
  id: number;
  sourceFieldId: number;
  operator: string;
  value?: string | null;
  action: string;
  targetFieldId?: number | null;
}

interface PublicForm {
  id: number;
  title: string;
  description?: string | null;
  slug: string;
  requireLogin: boolean;
  allowMultipleSubmissions: boolean;
  successMessage?: string | null;
  redirectUrl?: string | null;
  primaryColor?: string | null;
  fields: FormField[];
  rules: BranchingRule[];
}

// ── Branching engine ──────────────────────────────────────────────────────────

function evaluateRule(
  rule: BranchingRule,
  answers: Record<number, any>
): boolean {
  const answer = answers[rule.sourceFieldId];
  const val = Array.isArray(answer) ? answer : [String(answer ?? "")];
  const ruleVal = rule.value ?? "";

  switch (rule.operator) {
    case "equals":
      return val.some((v) => v === ruleVal);
    case "not_equals":
      return val.every((v) => v !== ruleVal);
    case "contains":
      return val.some((v) => v.toLowerCase().includes(ruleVal.toLowerCase()));
    case "not_contains":
      return val.every((v) => !v.toLowerCase().includes(ruleVal.toLowerCase()));
    case "is_empty":
      return !answer || (Array.isArray(answer) ? answer.length === 0 : String(answer).trim() === "");
    case "is_not_empty":
      return !!answer && (Array.isArray(answer) ? answer.length > 0 : String(answer).trim() !== "");
    default:
      return false;
  }
}

function computeVisibleFields(
  fields: FormField[],
  rules: BranchingRule[],
  answers: Record<number, any>
): Set<number> {
  // Start with all fields visible
  const visible = new Set(fields.map((f) => f.id));

  for (const rule of rules) {
    if (!evaluateRule(rule, answers)) continue;
    if (rule.action === "show_field" && rule.targetFieldId) {
      visible.add(rule.targetFieldId);
    } else if (rule.action === "hide_field" && rule.targetFieldId) {
      visible.delete(rule.targetFieldId);
    }
  }

  return visible;
}

function shouldAutoSubmit(
  rules: BranchingRule[],
  answers: Record<number, any>
): boolean {
  return rules.some((r) => r.action === "submit_form" && evaluateRule(r, answers));
}

// ── Field Renderer ────────────────────────────────────────────────────────────

function FieldRenderer({
  field,
  value,
  onChange,
  primaryColor,
  error,
}: {
  field: FormField;
  value: any;
  onChange: (v: any) => void;
  primaryColor: string;
  error?: string;
}) {
  if (field.type === "section_break") {
    return (
      <div className="py-4">
        <div className="border-t border-border" />
        {field.label && (
          <h3 className="mt-4 text-base font-semibold">{field.label}</h3>
        )}
        {field.helpText && (
          <p className="text-sm text-muted-foreground mt-1">{field.helpText}</p>
        )}
      </div>
    );
  }

  if (field.type === "statement") {
    return (
      <div className="py-2">
        <p className="text-sm leading-relaxed">{field.label}</p>
        {field.helpText && (
          <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}

      {/* Short answer / email / number / date */}
      {["short_answer", "email", "number", "date"].includes(field.type) && (
        <Input
          type={field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          placeholder={field.placeholder ?? ""}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={error ? "border-red-400" : ""}
        />
      )}

      {/* Long answer */}
      {field.type === "long_answer" && (
        <Textarea
          placeholder={field.placeholder ?? ""}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={`min-h-[100px] ${error ? "border-red-400" : ""}`}
        />
      )}

      {/* Dropdown */}
      {field.type === "dropdown" && (
        <Select value={value ?? ""} onValueChange={onChange}>
          <SelectTrigger className={error ? "border-red-400" : ""}>
            <SelectValue placeholder={field.placeholder ?? "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Radio (multiple choice) */}
      {field.type === "radio" && (
        <div className="space-y-2">
          {field.options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/40 transition-colors"
              style={value === opt.value ? { borderColor: primaryColor, backgroundColor: primaryColor + "10" } : {}}
            >
              <div
                className="h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: value === opt.value ? primaryColor : "#d1d5db" }}
              >
                {value === opt.value && (
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                )}
              </div>
              <input
                type="radio"
                className="sr-only"
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* Checkbox */}
      {field.type === "checkbox" && (
        <div className="space-y-2">
          {field.options.map((opt) => {
            const checked = Array.isArray(value) ? value.includes(opt.value) : false;
            return (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/40 transition-colors"
                style={checked ? { borderColor: primaryColor, backgroundColor: primaryColor + "10" } : {}}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) => {
                    const current = Array.isArray(value) ? value : [];
                    onChange(c ? [...current, opt.value] : current.filter((v: string) => v !== opt.value));
                  }}
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Main FormPlayerPage ───────────────────────────────────────────────────────

export default function FormPlayerPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const isEmbed = new URLSearchParams(window.location.search).get("embed") === "1";

  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const { data: form, isLoading, error } = trpc.forms.publicGet.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const submitMutation = trpc.forms.publicSubmit.useMutation({
    onSuccess: (res) => {
      setSuccessMsg(res.message ?? "Thank you for your response!");
      setSubmitted(true);
      if (form?.redirectUrl) {
        setTimeout(() => { window.location.href = form.redirectUrl!; }, 2000);
      }
    },
    onError: (e) => {
      setErrors({ 0: e.message });
    },
  });

  const primaryColor = form?.primaryColor || "#189aa1";

  // Compute visible fields based on current answers and branching rules
  const visibleFieldIds = useMemo(() => {
    if (!form) return new Set<number>();
    return computeVisibleFields(form.fields, form.rules, answers);
  }, [form, answers]);

  const visibleFields = useMemo(
    () => (form?.fields ?? []).filter((f) => visibleFieldIds.has(f.id)),
    [form, visibleFieldIds]
  );

  // Auto-submit if a rule triggers it
  useEffect(() => {
    if (!form || submitted) return;
    if (shouldAutoSubmit(form.rules, answers)) {
      handleSubmit();
    }
  }, [answers]);

  const handleAnswerChange = (fieldId: number, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => { const e = { ...prev }; delete e[fieldId]; return e; });
  };

  const validate = (): boolean => {
    const newErrors: Record<number, string> = {};
    for (const field of visibleFields) {
      if (!field.required) continue;
      if (["section_break", "statement"].includes(field.type)) continue;
      const val = answers[field.id];
      if (!val || (Array.isArray(val) && val.length === 0) || String(val).trim() === "") {
        newErrors[field.id] = "This field is required.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!form || !validate()) return;

    // Find respondent email from email fields
    const emailField = form.fields.find((f) => f.type === "email");
    const respondentEmail = emailField ? answers[emailField.id] : undefined;

    const stringAnswers: Record<string, any> = {};
    for (const [k, v] of Object.entries(answers)) {
      stringAnswers[k] = Array.isArray(v) ? v : String(v ?? "");
    }

    submitMutation.mutate({
      formId: form.id,
      answers: stringAnswers,
      respondentEmail,
    });
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={`${isEmbed ? "" : "min-h-screen bg-background"} flex items-center justify-center p-8`}>
        <div className="w-full max-w-xl space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!form || error) {
    return (
      <div className={`${isEmbed ? "" : "min-h-screen bg-background"} flex items-center justify-center p-8`}>
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">Form not found</h2>
          <p className="text-sm text-muted-foreground">
            This form may have been closed or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={`${isEmbed ? "" : "min-h-screen bg-background"} flex items-center justify-center p-8`}>
        <div className="text-center space-y-4 max-w-sm">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: primaryColor + "20" }}
          >
            <CheckCircle2 className="h-8 w-8" style={{ color: primaryColor }} />
          </div>
          <h2 className="text-xl font-bold">Submitted!</h2>
          <p className="text-sm text-muted-foreground">{successMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${isEmbed ? "" : "min-h-screen bg-background"} py-10 px-4`}
      style={isEmbed ? {} : { background: `linear-gradient(135deg, ${primaryColor}08 0%, transparent 60%)` }}
    >
      <div className="max-w-xl mx-auto">
        {/* Form header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{form.title}</h1>
          {form.description && (
            <p className="text-sm text-muted-foreground mt-2">{form.description}</p>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-6">
          {visibleFields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={answers[field.id]}
              onChange={(v) => handleAnswerChange(field.id, v)}
              primaryColor={primaryColor}
              error={errors[field.id]}
            />
          ))}
        </div>

        {/* Global error */}
        {errors[0] && (
          <p className="mt-4 text-sm text-red-500 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            {errors[0]}
          </p>
        )}

        {/* Submit */}
        <div className="mt-8">
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="w-full h-11 text-base font-semibold"
            style={{ backgroundColor: primaryColor }}
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {submitMutation.isPending ? "Submitting..." : "Submit"}
          </Button>
        </div>

        {/* Powered by */}
        {!isEmbed && (
          <p className="text-center text-xs text-muted-foreground/50 mt-6">
            Powered by{" "}
            <span className="font-semibold">
              <span className="text-foreground/60">teach</span>
              <span style={{ color: primaryColor }}>ific</span>
              <span className="text-foreground/60">™</span>
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
