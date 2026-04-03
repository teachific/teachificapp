import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronLeft,
  Settings,
  Eye,
  Share2,
  GitBranch,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Code2,
  AlignLeft,
  AlignJustify,
  ChevronDown,
  Circle,
  CheckSquare,
  AtSign,
  Hash,
  Calendar,
  Minus,
  MessageSquare,
  Loader2,
  Globe,
  Lock,
  X,
  Palette,
  Link2,
  User,
  Upload,
  BookOpen,
  FileText,
  LayoutTemplate,
  Eye as EyeIcon,
  EyeOff,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldType =
  | "short_answer"
  | "long_answer"
  | "dropdown"
  | "radio"
  | "checkbox"
  | "email"
  | "number"
  | "date"
  | "section_break"
  | "statement";

interface FieldOption {
  value: string;
  label: string;
}

interface FormField {
  id: number | string; // string = temp id for new fields
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  sortOrder: number;
  options: FieldOption[];
  minLength?: number;
  maxLength?: number;
  isBranchingSource: boolean;
  isHidden?: boolean;
  memberVarName?: string;
}

interface BranchingRule {
  id?: number;
  sourceFieldId: number | string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "is_empty" | "is_not_empty";
  value?: string;
  action: "show_field" | "hide_field" | "jump_to_field" | "submit_form";
  targetFieldId?: number | string;
  sortOrder: number;
}

// ── Field type metadata ───────────────────────────────────────────────────────

const FIELD_TYPES: Array<{ type: FieldType; label: string; icon: React.ReactNode; group: string }> = [
  { type: "short_answer", label: "Short Answer", icon: <AlignLeft className="h-4 w-4" />, group: "Text" },
  { type: "long_answer", label: "Long Answer", icon: <AlignJustify className="h-4 w-4" />, group: "Text" },
  { type: "email", label: "Email", icon: <AtSign className="h-4 w-4" />, group: "Text" },
  { type: "number", label: "Number", icon: <Hash className="h-4 w-4" />, group: "Text" },
  { type: "date", label: "Date", icon: <Calendar className="h-4 w-4" />, group: "Text" },
  { type: "dropdown", label: "Dropdown", icon: <ChevronDown className="h-4 w-4" />, group: "Choice" },
  { type: "radio", label: "Multiple Choice", icon: <Circle className="h-4 w-4" />, group: "Choice" },
  { type: "checkbox", label: "Checkboxes", icon: <CheckSquare className="h-4 w-4" />, group: "Choice" },
  { type: "section_break", label: "Section Break", icon: <Minus className="h-4 w-4" />, group: "Layout" },
  { type: "statement", label: "Statement", icon: <MessageSquare className="h-4 w-4" />, group: "Layout" },
];

const CHOICE_TYPES: FieldType[] = ["dropdown", "radio", "checkbox"];
const BRANCHABLE_TYPES: FieldType[] = ["dropdown", "radio", "checkbox", "short_answer", "email"];

let tempIdCounter = -1;
function newTempId() {
  return `temp_${tempIdCounter--}`;
}

// ── Sortable Field Row ────────────────────────────────────────────────────────

function SortableFieldRow({
  field,
  isSelected,
  onSelect,
  onDelete,
}: {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(field.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const meta = FIELD_TYPES.find((t) => t.type === field.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="text-muted-foreground shrink-0">{meta?.icon}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {field.label || <span className="text-muted-foreground italic">Untitled {meta?.label}</span>}
        </p>
        <p className="text-xs text-muted-foreground">{meta?.label}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {field.required && (
          <span className="text-xs text-red-500 font-medium">*</span>
        )}
        {field.isBranchingSource && (
          <GitBranch className="h-3 w-3 text-purple-500" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Field Editor Panel ────────────────────────────────────────────────────────

function FieldEditor({
  field,
  onChange,
}: {
  field: FormField;
  onChange: (updated: Partial<FormField>) => void;
}) {
  const isChoice = CHOICE_TYPES.includes(field.type);
  const isBranchable = BRANCHABLE_TYPES.includes(field.type);

  const addOption = () => {
    const idx = field.options.length + 1;
    onChange({ options: [...field.options, { value: `option_${idx}`, label: `Option ${idx}` }] });
  };

  const updateOption = (i: number, label: string) => {
    const opts = [...field.options];
    opts[i] = { value: label.toLowerCase().replace(/\s+/g, "_"), label };
    onChange({ options: opts });
  };

  const removeOption = (i: number) => {
    onChange({ options: field.options.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Label *</Label>
        <Input
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Question or field label"
        />
      </div>

      {field.type !== "section_break" && field.type !== "statement" && (
        <div className="space-y-1.5">
          <Label>Placeholder</Label>
          <Input
            value={field.placeholder ?? ""}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            placeholder="Hint text shown inside the field"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Help Text</Label>
        <Input
          value={field.helpText ?? ""}
          onChange={(e) => onChange({ helpText: e.target.value })}
          placeholder="Additional guidance shown below the field"
        />
      </div>

      {isChoice && (
        <div className="space-y-2">
          <Label>Options</Label>
          {field.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={opt.label}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeOption(i)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addOption} className="w-full gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Option
          </Button>
        </div>
      )}

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <Label>Required</Label>
          <p className="text-xs text-muted-foreground">Respondents must answer this field</p>
        </div>
        <Switch
          checked={field.required}
          onCheckedChange={(v) => onChange({ required: v })}
        />
      </div>

      {isBranchable && (
        <div className="flex items-center justify-between">
          <div>
            <Label className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-purple-500" />
              Enable Branching
            </Label>
            <p className="text-xs text-muted-foreground">Use this field's answer to show/hide other fields</p>
          </div>
          <Switch
            checked={field.isBranchingSource}
            onCheckedChange={(v) => onChange({ isBranchingSource: v })}
          />
        </div>
      )}
    </div>
  );
}

// ── Branching Rules Editor ────────────────────────────────────────────────────

function BranchingRulesEditor({
  fields,
  rules,
  onChange,
}: {
  fields: FormField[];
  rules: BranchingRule[];
  onChange: (rules: BranchingRule[]) => void;
}) {
  const sourceFields = fields.filter((f) => f.isBranchingSource);

  const addRule = () => {
    if (sourceFields.length === 0) return;
    onChange([
      ...rules,
      {
        sourceFieldId: sourceFields[0].id,
        operator: "equals",
        value: "",
        action: "show_field",
        targetFieldId: undefined,
        sortOrder: rules.length,
      },
    ]);
  };

  const updateRule = (i: number, patch: Partial<BranchingRule>) => {
    const updated = [...rules];
    updated[i] = { ...updated[i], ...patch };
    onChange(updated);
  };

  const removeRule = (i: number) => {
    onChange(rules.filter((_, idx) => idx !== i));
  };

  const getFieldLabel = (id: number | string | undefined) => {
    if (!id) return "—";
    return fields.find((f) => String(f.id) === String(id))?.label || `Field #${id}`;
  };

  const getOptionsForField = (id: number | string | undefined) => {
    if (!id) return [];
    return fields.find((f) => String(f.id) === String(id))?.options ?? [];
  };

  if (sourceFields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <GitBranch className="h-6 w-6 text-purple-500" />
        </div>
        <div>
          <p className="font-medium text-sm">No branching sources yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Enable "Enable Branching" on a Dropdown, Multiple Choice, Checkbox, Short Answer, or Email field to create conditional logic rules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Conditional Logic Rules</p>
          <p className="text-xs text-muted-foreground">Rules are evaluated in order. First matching rule wins.</p>
        </div>
        <Button size="sm" onClick={addRule} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="border border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">
          No rules yet. Click "Add Rule" to create your first conditional logic rule.
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, i) => {
            const srcField = fields.find((f) => String(f.id) === String(rule.sourceFieldId));
            const srcOptions = getOptionsForField(rule.sourceFieldId);
            const needsValue = !["is_empty", "is_not_empty"].includes(rule.operator);
            const needsTarget = rule.action !== "submit_form";

            return (
              <Card key={i} className="border-purple-200 dark:border-purple-900/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                      Rule {i + 1}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRule(i)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* IF row */}
                  <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center">
                    <span className="text-xs font-semibold text-muted-foreground w-6">IF</span>
                    <Select
                      value={String(rule.sourceFieldId)}
                      onValueChange={(v) => updateRule(i, { sourceFieldId: v, value: "" })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceFields.map((f) => (
                          <SelectItem key={String(f.id)} value={String(f.id)}>
                            {f.label || `Field #${f.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={rule.operator}
                      onValueChange={(v) => updateRule(i, { operator: v as BranchingRule["operator"] })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">equals</SelectItem>
                        <SelectItem value="not_equals">does not equal</SelectItem>
                        <SelectItem value="contains">contains</SelectItem>
                        <SelectItem value="not_contains">does not contain</SelectItem>
                        <SelectItem value="is_empty">is empty</SelectItem>
                        <SelectItem value="is_not_empty">is not empty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value row */}
                  {needsValue && (
                    <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
                      <span className="text-xs font-semibold text-muted-foreground w-6" />
                      {srcOptions.length > 0 ? (
                        <Select
                          value={rule.value ?? ""}
                          onValueChange={(v) => updateRule(i, { value: v })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select value" />
                          </SelectTrigger>
                          <SelectContent>
                            {srcOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          className="h-8 text-xs"
                          placeholder="Value to match"
                          value={rule.value ?? ""}
                          onChange={(e) => updateRule(i, { value: e.target.value })}
                        />
                      )}
                    </div>
                  )}

                  {/* THEN row */}
                  <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center">
                    <span className="text-xs font-semibold text-muted-foreground w-6">THEN</span>
                    <Select
                      value={rule.action}
                      onValueChange={(v) => updateRule(i, { action: v as BranchingRule["action"] })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="show_field">Show field</SelectItem>
                        <SelectItem value="hide_field">Hide field</SelectItem>
                        <SelectItem value="jump_to_field">Jump to field</SelectItem>
                        <SelectItem value="submit_form">Submit form</SelectItem>
                      </SelectContent>
                    </Select>
                    {needsTarget && (
                      <Select
                        value={rule.targetFieldId ? String(rule.targetFieldId) : ""}
                        onValueChange={(v) => updateRule(i, { targetFieldId: v })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Target field" />
                        </SelectTrigger>
                        <SelectContent>
                          {fields
                            .filter((f) => String(f.id) !== String(rule.sourceFieldId))
                            .map((f) => (
                              <SelectItem key={String(f.id)} value={String(f.id)}>
                                {f.label || `Field #${f.id}`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Email Routing Panel ───────────────────────────────────────────────────────

function EmailRoutingPanel({
  form,
  fields,
  hasEmailAccess,
  onUpdate,
}: {
  form: any;
  fields: FormField[];
  hasEmailAccess: boolean;
  onUpdate: (patch: any) => void;
}) {
  const [emailInput, setEmailInput] = useState("");
  const notifyEmails: string[] = form.notifyEmails ? JSON.parse(form.notifyEmails) : [];
  const emailFields = fields.filter((f) => f.type === "email" || f.type === "short_answer");

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email || notifyEmails.includes(email)) return;
    onUpdate({ notifyEmails: [...notifyEmails, email] });
    setEmailInput("");
  };

  const removeEmail = (email: string) => {
    onUpdate({ notifyEmails: notifyEmails.filter((e) => e !== email) });
  };

  if (!hasEmailAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Mail className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <p className="font-medium text-sm">Email Routing — Pro Feature</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Automatically notify team members and send confirmation emails to respondents. Available on Pro and Enterprise plans.
          </p>
        </div>
        <Badge variant="outline" className="text-amber-600 border-amber-300">Upgrade to unlock</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification emails */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-semibold">Notify on Submission</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Send an email to these addresses whenever a new response is submitted.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="team@example.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEmail()}
            className="flex-1"
          />
          <Button variant="outline" onClick={addEmail} disabled={!emailInput.trim()}>
            Add
          </Button>
        </div>
        {notifyEmails.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {notifyEmails.map((email) => (
              <Badge key={email} variant="secondary" className="gap-1.5 pr-1.5">
                <Mail className="h-3 w-3" />
                {email}
                <button onClick={() => removeEmail(email)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Respondent confirmation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Confirmation Email to Respondent</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send a confirmation email to the person who submitted the form.
            </p>
          </div>
          <Switch
            checked={form.sendConfirmation ?? false}
            onCheckedChange={(v) => onUpdate({ sendConfirmation: v })}
          />
        </div>

        {form.sendConfirmation && (
          <div className="space-y-3 pl-0 border-l-2 border-primary/20 pl-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Email Field</Label>
              <Select
                value={form.confirmationEmailField ?? ""}
                onValueChange={(v) => onUpdate({ confirmationEmailField: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Which field contains the email?" />
                </SelectTrigger>
                <SelectContent>
                  {emailFields.map((f) => (
                    <SelectItem key={String(f.id)} value={String(f.id)}>
                      {f.label || `Field #${f.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Input
                className="text-xs"
                placeholder="Thanks for your submission!"
                value={form.confirmationSubject ?? ""}
                onChange={(e) => onUpdate({ confirmationSubject: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Body</Label>
              <Textarea
                className="text-xs min-h-[80px]"
                placeholder="We've received your response and will be in touch shortly."
                value={form.confirmationBody ?? ""}
                onChange={(e) => onUpdate({ confirmationBody: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Share Panel ───────────────────────────────────────────────────────────────

function SharePanel({ form }: { form: any }) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const formUrl = `${window.location.origin}/forms/${form.slug}`;
  const embedCode = `<iframe src="${formUrl}?embed=1" width="100%" height="600" frameborder="0" style="border:none;border-radius:8px"></iframe>`;

  const copyUrl = () => {
    navigator.clipboard.writeText(formUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="space-y-6">
      {form.status !== "published" && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Lock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            This form is currently <strong>{form.status}</strong>. Publish it to make the URL and embed code active.
          </p>
        </div>
      )}

      {/* Direct URL */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-sm font-semibold">
          <Globe className="h-4 w-4" />
          Direct URL
        </Label>
        <p className="text-xs text-muted-foreground">Share this link with respondents to open the form in a new page.</p>
        <div className="flex gap-2">
          <Input value={formUrl} readOnly className="flex-1 text-xs font-mono bg-muted" />
          <Button variant="outline" size="sm" onClick={copyUrl} className="gap-1.5 shrink-0">
            {copiedUrl ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedUrl ? "Copied!" : "Copy"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(formUrl, "_blank")}
            className="shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Embed code */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-sm font-semibold">
          <Code2 className="h-4 w-4" />
          Embed Code
        </Label>
        <p className="text-xs text-muted-foreground">Paste this HTML snippet into any webpage to embed the form inline.</p>
        <div className="relative">
          <Textarea
            value={embedCode}
            readOnly
            className="text-xs font-mono bg-muted min-h-[80px] pr-20 resize-none"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={copyEmbed}
            className="absolute top-2 right-2 gap-1.5 h-7 text-xs"
          >
            {copiedEmbed ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            {copiedEmbed ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Post-submit settings */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">After Submission</Label>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Success Message</Label>
          <Textarea
            className="text-xs min-h-[60px]"
            placeholder="Thank you for your response!"
            value={form.successMessage ?? ""}
            readOnly
          />
        </div>
      </div>
    </div>
  );
}

// ── Branding Panel ───────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Poppins", "Montserrat", "Nunito", "Raleway",
];

function BrandingPanel({
  formId,
  orgId,
  formSettings,
  onUpdate,
}: {
  formId: number;
  orgId: number;
  formSettings: any;
  onUpdate: (patch: any) => void;
}) {
  const { data: orgDefaults } = trpc.forms.branding.orgDefaults.useQuery(
    { orgId },
    { enabled: !!orgId }
  );
  const uploadMutation = trpc.forms.branding.uploadHeaderImage.useMutation({
    onSuccess: (data) => { onUpdate({ headerImageUrl: data.url }); toast.success("Header image uploaded"); },
    onError: (e) => toast.error(e.message),
  });

  const useOrgBranding = formSettings.useOrgBranding ?? true;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      uploadMutation.mutate({ formId, base64, mimeType: file.type, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <Palette className="h-4 w-4" /> Form Branding
        </Label>
        <p className="text-xs text-muted-foreground">Customize how this form looks. Defaults inherit from your org settings.</p>
      </div>

      {/* Use org branding toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Use Org Defaults</p>
          <p className="text-xs text-muted-foreground">Inherit colors and fonts from your org theme</p>
        </div>
        <Switch
          checked={useOrgBranding}
          onCheckedChange={(v) => onUpdate({ useOrgBranding: v })}
        />
      </div>

      {!useOrgBranding && (
        <>
          <Separator />
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colors</Label>
            <div className="grid grid-cols-2 gap-3">
              {([
                ["primaryColor", "Primary"],
                ["buttonColor", "Button"],
                ["buttonTextColor", "Button Text"],
                ["headerBgColor", "Header BG"],
                ["headerTextColor", "Header Text"],
              ] as [string, string][]).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formSettings[key] ?? (orgDefaults?.primaryColor ?? "#189aa1")}
                      onChange={(e) => onUpdate({ [key]: e.target.value })}
                      className="h-8 w-8 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={formSettings[key] ?? ""}
                      onChange={(e) => onUpdate({ [key]: e.target.value })}
                      placeholder={orgDefaults?.primaryColor ?? "#189aa1"}
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Font</Label>
            <Select
              value={formSettings.fontFamily ?? orgDefaults?.fontFamily ?? "Inter"}
              onValueChange={(v) => onUpdate({ fontFamily: v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Separator />
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <Upload className="h-4 w-4" /> Header Image
        </Label>
        <p className="text-xs text-muted-foreground">Shown as a full-width banner above the form title.</p>
        {formSettings.headerImageUrl && (
          <div className="relative">
            <img
              src={formSettings.headerImageUrl}
              alt="Header"
              className="w-full h-24 object-cover rounded border border-border"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => onUpdate({ headerImageUrl: null })}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            disabled={uploadMutation.isPending}
            asChild
          >
            <span>
              {uploadMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploadMutation.isPending ? "Uploading..." : "Upload Image"}
            </span>
          </Button>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
      </div>
    </div>
  );
}

// ── Member Variables Panel ────────────────────────────────────────────────────

const MEMBER_VARS = [
  { key: "name", label: "Full Name", description: "Respondent's full name" },
  { key: "email", label: "Email Address", description: "Respondent's email" },
  { key: "userId", label: "User ID", description: "Internal user identifier" },
  { key: "orgName", label: "Organization Name", description: "Org the member belongs to" },
  { key: "custom1", label: "Custom Variable 1", description: "Passed via URL param ?custom1=" },
  { key: "custom2", label: "Custom Variable 2", description: "Passed via URL param ?custom2=" },
];

function MemberVarsPanel({
  fields,
  onFieldChange,
}: {
  fields: FormField[];
  onFieldChange: (id: string | number, patch: Partial<FormField>) => void;
}) {
  const inputFields = fields.filter(
    (f) => !["section_break", "statement"].includes(f.type)
  );

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <User className="h-4 w-4" /> Member Variables
        </Label>
        <p className="text-xs text-muted-foreground">
          Map form fields to member data so they auto-populate when a logged-in user or URL params are present.
          Hidden fields are submitted silently without being shown to the respondent.
        </p>
      </div>

      {inputFields.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Add fields to the form first.</p>
      ) : (
        <div className="space-y-3">
          {inputFields.map((field) => (
            <div key={String(field.id)} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium truncate max-w-[160px]">{field.label || `(${field.type})`}</p>
                <button
                  type="button"
                  onClick={() => onFieldChange(field.id, { isHidden: !field.isHidden })}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={field.isHidden ? "Show field" : "Hide field"}
                >
                  {field.isHidden
                    ? <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                    : <EyeIcon className="h-3.5 w-3.5" />}
                </button>
              </div>
              <Select
                value={field.memberVarName ?? ""}
                onValueChange={(v) => onFieldChange(field.id, { memberVarName: v || undefined })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="No variable mapping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No mapping</SelectItem>
                  {MEMBER_VARS.map((v) => (
                    <SelectItem key={v.key} value={v.key} className="text-xs">
                      <span className="font-mono">{`{{${v.key}}}`}</span> — {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.memberVarName && (
                <p className="text-xs text-muted-foreground">
                  Auto-filled from <code className="bg-muted px-1 rounded">{`{{${field.memberVarName}}}`}</code>
                  {field.isHidden && <span className="text-amber-600 ml-1">(hidden)</span>}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Separator />
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">URL Parameter Reference</Label>
        <div className="bg-muted rounded p-2 space-y-1">
          {MEMBER_VARS.map((v) => (
            <div key={v.key} className="flex items-center gap-2 text-xs">
              <code className="text-teal-600 font-mono">{`?${v.key}=value`}</code>
              <span className="text-muted-foreground">→ {v.description}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Append these to your form URL to pre-populate fields from your LMS, CRM, or email platform.</p>
      </div>
    </div>
  );
}

// ── Integrations Panel ────────────────────────────────────────────────────────

function IntegrationsPanel({ formId, orgId }: { formId: number; orgId: number }) {
  const { data: integrations = [], refetch } = trpc.forms.integrations.list.useQuery(
    { formId },
    { enabled: !!formId }
  );
  const { data: courses = [] } = trpc.lms.courses.list.useQuery(
    { orgId },
    { enabled: !!orgId }
  );
  const upsertMutation = trpc.forms.integrations.upsert.useMutation({
    onSuccess: () => { refetch(); toast.success("Integrations saved"); },
    onError: (e) => toast.error(e.message),
  });

  const [localIntegrations, setLocalIntegrations] = useState<any[]>([]);
  useEffect(() => { setLocalIntegrations(integrations); }, [integrations]);

  const addIntegration = () => {
    setLocalIntegrations((prev) => [
      ...prev,
      { type: "course", action: "enroll", triggerOn: "on_submit", sortOrder: prev.length },
    ]);
  };

  const removeIntegration = (idx: number) => {
    setLocalIntegrations((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateIntegration = (idx: number, patch: any) => {
    setLocalIntegrations((prev) => prev.map((ig, i) => i === idx ? { ...ig, ...patch } : ig));
  };

  const save = () => {
    upsertMutation.mutate({ formId, integrations: localIntegrations });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <Link2 className="h-4 w-4" /> Integrations
        </Label>
        <p className="text-xs text-muted-foreground">
          Connect this form to courses, custom pages, or landing pages. Actions trigger automatically on submission.
        </p>
      </div>

      <div className="space-y-3">
        {localIntegrations.map((ig, idx) => (
          <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Integration {idx + 1}</p>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeIntegration(idx)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={ig.type} onValueChange={(v) => updateIntegration(idx, { type: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course"><BookOpen className="h-3.5 w-3.5 inline mr-1" />Course</SelectItem>
                    <SelectItem value="custom_page"><FileText className="h-3.5 w-3.5 inline mr-1" />Custom Page</SelectItem>
                    <SelectItem value="landing_page"><LayoutTemplate className="h-3.5 w-3.5 inline mr-1" />Landing Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Action</Label>
                <Select value={ig.action} onValueChange={(v) => updateIntegration(idx, { action: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enroll">Enroll</SelectItem>
                    <SelectItem value="redirect">Redirect</SelectItem>
                    <SelectItem value="tag">Tag Member</SelectItem>
                    <SelectItem value="embed">Embed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Trigger</Label>
              <Select value={ig.triggerOn} onValueChange={(v) => updateIntegration(idx, { triggerOn: v })}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_submit">On Submit</SelectItem>
                  <SelectItem value="on_completion">On Completion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {ig.type === "course" && (
              <div className="space-y-1">
                <Label className="text-xs">Course</Label>
                <Select
                  value={ig.targetId ? String(ig.targetId) : ""}
                  onValueChange={(v) => updateIntegration(idx, { targetId: parseInt(v) })}
                >
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {(courses as any[]).map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(ig.type === "custom_page" || ig.type === "landing_page") && (
              <div className="space-y-1">
                <Label className="text-xs">Target URL</Label>
                <Input
                  value={ig.targetUrl ?? ""}
                  onChange={(e) => updateIntegration(idx, { targetUrl: e.target.value })}
                  placeholder="https://..."
                  className="h-7 text-xs"
                />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Label (optional)</Label>
              <Input
                value={ig.label ?? ""}
                onChange={(e) => updateIntegration(idx, { label: e.target.value })}
                placeholder="e.g. Enroll in Intro Course"
                className="h-7 text-xs"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1" onClick={addIntegration}>
          <Plus className="h-3.5 w-3.5" /> Add Integration
        </Button>
        <Button size="sm" className="gap-1.5 text-xs" onClick={save} disabled={upsertMutation.isPending}>
          {upsertMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Save
        </Button>
      </div>
    </div>
  );
}

// ── Main FormBuilderPage ──────────────────────────────────────────────────────

export default function FormBuilderPage() {
  const params = useParams<{ id: string }>();
  const formId = parseInt(params.id ?? "0");
  const [, setLocation] = useLocation();
  const [fields, setFields] = useState<FormField[]>([]);
  const [rules, setRules] = useState<BranchingRule[]>([]);
  const [formSettings, setFormSettings] = useState<any>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | number | null>(null);
  const [activeTab, setActiveTab] = useState("build");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: formData, isLoading, refetch } = trpc.forms.get.useQuery(
    { id: formId },
    { enabled: !!formId }
  );

  const { data: orgCtx } = trpc.orgs.myContext.useQuery();
  const orgId = orgCtx?.org?.id;

  const { data: emailAccess } = trpc.forms.emailAccessCheck.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const updateMutation = trpc.forms.update.useMutation();
  const upsertFieldsMutation = trpc.forms.fields.upsert.useMutation();
  const upsertRulesMutation = trpc.forms.rules.upsert.useMutation();

  // Populate local state from server data
  useEffect(() => {
    if (!formData) return;
    setFormSettings({
      title: formData.title,
      description: formData.description,
      status: formData.status,
      notifyEmails: formData.notifyEmails,
      sendConfirmation: formData.sendConfirmation,
      confirmationEmailField: formData.confirmationEmailField,
      confirmationSubject: formData.confirmationSubject,
      confirmationBody: formData.confirmationBody,
      successMessage: formData.successMessage,
      redirectUrl: formData.redirectUrl,
      requireLogin: formData.requireLogin,
      allowMultipleSubmissions: formData.allowMultipleSubmissions,
      primaryColor: formData.primaryColor,
    });
    setFields(
      (formData.fields ?? []).map((f: any) => ({
        ...f,
        options: f.options ?? [],
      }))
    );
    setRules((formData.rules ?? []).map((r: any) => ({
      ...r,
      operator: r.operator as BranchingRule["operator"],
      action: r.action as BranchingRule["action"],
    })));
    setIsDirty(false);
  }, [formData]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const handleFieldChange = (id: string | number, patch: Partial<FormField>) => {
    setFields((prev) => prev.map((f) => (String(f.id) === String(id) ? { ...f, ...patch } : f)));
    markDirty();
  };

  const handleAddField = (type: FieldType) => {
    const newField: FormField = {
      id: newTempId(),
      type,
      label: "",
      required: false,
      sortOrder: fields.length,
      options: CHOICE_TYPES.includes(type)
        ? [
            { value: "option_1", label: "Option 1" },
            { value: "option_2", label: "Option 2" },
          ]
        : [],
      isBranchingSource: false,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
    markDirty();
  };

  const handleDeleteField = (id: string | number) => {
    setFields((prev) => prev.filter((f) => String(f.id) !== String(id)));
    setRules((prev) =>
      prev.filter(
        (r) => String(r.sourceFieldId) !== String(id) && String(r.targetFieldId) !== String(id)
      )
    );
    if (String(selectedFieldId) === String(id)) setSelectedFieldId(null);
    markDirty();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields((prev) => {
      const oldIndex = prev.findIndex((f) => String(f.id) === String(active.id));
      const newIndex = prev.findIndex((f) => String(f.id) === String(over.id));
      return arrayMove(prev, oldIndex, newIndex).map((f, i) => ({ ...f, sortOrder: i }));
    });
    markDirty();
  };

  const handleSave = async () => {
    if (!formId) return;
    setIsSaving(true);
    try {
      // Save form settings
      const { notifyEmails, ...rest } = formSettings;
      const emails = notifyEmails ? JSON.parse(notifyEmails) : [];
      await updateMutation.mutateAsync({ id: formId, ...rest, notifyEmails: emails });

      // Save fields
      const fieldPayload = fields.map((f, i) => ({
        id: typeof f.id === "number" && f.id > 0 ? f.id : undefined,
        type: f.type,
        label: f.label || "Untitled",
        placeholder: f.placeholder,
        helpText: f.helpText,
        required: f.required,
        sortOrder: i,
        options: f.options,
        minLength: f.minLength,
        maxLength: f.maxLength,
        isBranchingSource: f.isBranchingSource,
      }));
      await upsertFieldsMutation.mutateAsync({ formId, fields: fieldPayload });

      // Refetch to get real IDs for new fields, then save rules
      const refreshed = await refetch();
      const savedFields = refreshed.data?.fields ?? [];
      const fieldIdMap: Record<string, number> = {};
      savedFields.forEach((sf: any, i: number) => {
        const orig = fields[i];
        if (orig) fieldIdMap[String(orig.id)] = sf.id;
      });

      const rulePayload = rules.map((r, i) => ({
        id: typeof r.id === "number" ? r.id : undefined,
        sourceFieldId: fieldIdMap[String(r.sourceFieldId)] ?? (typeof r.sourceFieldId === "number" ? r.sourceFieldId : 0),
        operator: r.operator,
        value: r.value,
        action: r.action,
        targetFieldId: r.targetFieldId
          ? (fieldIdMap[String(r.targetFieldId)] ?? (typeof r.targetFieldId === "number" ? r.targetFieldId : undefined))
          : undefined,
        sortOrder: i,
      })).filter((r) => r.sourceFieldId > 0);

      await upsertRulesMutation.mutateAsync({ formId, rules: rulePayload });

      setIsDirty(false);
      toast.success("Form saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedField = fields.find((f) => String(f.id) === String(selectedFieldId));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Form not found.</p>
        <Button onClick={() => setLocation("/lms/forms")}>Back to Forms</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-background/95 backdrop-blur z-30 px-4 h-14 flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/lms/forms")}
          className="gap-1.5 text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Forms
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex-1 min-w-0">
          <Input
            value={formSettings?.title ?? ""}
            onChange={(e) => {
              setFormSettings((s: any) => ({ ...s, title: e.target.value }));
              markDirty();
            }}
            className="h-8 border-0 bg-transparent text-sm font-semibold px-0 focus-visible:ring-0 focus-visible:ring-offset-0 max-w-xs"
            placeholder="Form title"
          />
        </div>

        {/* Status badge */}
        {formSettings && (
          <Select
            value={formSettings.status}
            onValueChange={(v) => { setFormSettings((s: any) => ({ ...s, status: v })); markDirty(); }}
          >
            <SelectTrigger className="h-7 text-xs w-28 border-0 bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`/forms/${formData.slug}`, "_blank")}
          className="gap-1.5"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </Button>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="gap-1.5"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {isSaving ? "Saving..." : isDirty ? "Save" : "Saved"}
        </Button>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Field Palette */}
        <aside className="w-52 border-r border-border bg-muted/20 overflow-y-auto shrink-0 p-3 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Add Field</p>
          {["Text", "Choice", "Layout"].map((group) => (
            <div key={group} className="space-y-1">
              <p className="text-xs text-muted-foreground px-1">{group}</p>
              {FIELD_TYPES.filter((t) => t.group === group).map((ft) => (
                <button
                  key={ft.type}
                  onClick={() => handleAddField(ft.type)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-primary/10 hover:text-primary transition-colors text-left"
                >
                  <span className="text-muted-foreground">{ft.icon}</span>
                  {ft.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Center: Form Canvas */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto space-y-2">
            {/* Form header preview */}
            <div className="mb-6 p-4 rounded-xl border border-border bg-card">
              <h2 className="text-lg font-bold">{formSettings?.title || "Untitled Form"}</h2>
              {formSettings?.description && (
                <p className="text-sm text-muted-foreground mt-1">{formSettings.description}</p>
              )}
            </div>

            {fields.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Click a field type in the left panel to add your first question.
                </p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((f) => String(f.id))} strategy={verticalListSortingStrategy}>
                  {fields.map((field) => (
                    <SortableFieldRow
                      key={String(field.id)}
                      field={field}
                      isSelected={String(selectedFieldId) === String(field.id)}
                      onSelect={() => setSelectedFieldId(field.id)}
                      onDelete={() => handleDeleteField(field.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </main>

        {/* Right: Tabs panel */}
        <aside className="w-80 border-l border-border bg-background overflow-y-auto shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent h-10 shrink-0">
              <TabsTrigger value="build" className="flex-1 text-xs gap-1 rounded-none">
                <Settings className="h-3.5 w-3.5" />
                Field
              </TabsTrigger>
              <TabsTrigger value="logic" className="flex-1 text-xs gap-1 rounded-none">
                <GitBranch className="h-3.5 w-3.5" />
                Logic
              </TabsTrigger>
              <TabsTrigger value="email" className="flex-1 text-xs gap-1 rounded-none">
                <Mail className="h-3.5 w-3.5" />
                Email
              </TabsTrigger>
              <TabsTrigger value="share" className="flex-1 text-xs gap-1 rounded-none">
                <Share2 className="h-3.5 w-3.5" />
                Share
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex-1 text-xs gap-1 rounded-none">
                <Palette className="h-3.5 w-3.5" />
                Brand
              </TabsTrigger>
              <TabsTrigger value="members" className="flex-1 text-xs gap-1 rounded-none">
                <User className="h-3.5 w-3.5" />
                Vars
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex-1 text-xs gap-1 rounded-none">
                <Link2 className="h-3.5 w-3.5" />
                Links
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4">
              <TabsContent value="build" className="mt-0">
                {selectedField ? (
                  <FieldEditor
                    field={selectedField}
                    onChange={(patch) => handleFieldChange(selectedField.id, patch)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                    <Settings className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      Select a field in the canvas to edit its properties.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="logic" className="mt-0">
                <BranchingRulesEditor
                  fields={fields}
                  rules={rules}
                  onChange={(r) => { setRules(r); markDirty(); }}
                />
              </TabsContent>

              <TabsContent value="email" className="mt-0">
                {formSettings && (
                  <EmailRoutingPanel
                    form={formSettings}
                    fields={fields}
                    hasEmailAccess={emailAccess?.hasAccess ?? false}
                    onUpdate={(patch) => {
                      setFormSettings((s: any) => {
                        const updated = { ...s };
                        if ("notifyEmails" in patch && Array.isArray(patch.notifyEmails)) {
                          updated.notifyEmails = JSON.stringify(patch.notifyEmails);
                        } else {
                          Object.assign(updated, patch);
                        }
                        return updated;
                      });
                      markDirty();
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="share" className="mt-0">
                {formSettings && <SharePanel form={{ ...formData, ...formSettings }} />}
              </TabsContent>

              <TabsContent value="branding" className="mt-0">
                {formSettings && (
                  <BrandingPanel
                    formId={formId}
                    orgId={orgId!}
                    formSettings={formSettings}
                    onUpdate={(patch) => { setFormSettings((s: any) => ({ ...s, ...patch })); markDirty(); }}
                  />
                )}
              </TabsContent>

              <TabsContent value="members" className="mt-0">
                <MemberVarsPanel
                  fields={fields}
                  onFieldChange={(id, patch) => { handleFieldChange(id, patch); }}
                />
              </TabsContent>

              <TabsContent value="integrations" className="mt-0">
                <IntegrationsPanel formId={formId} orgId={orgId!} />
              </TabsContent>
            </div>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}
