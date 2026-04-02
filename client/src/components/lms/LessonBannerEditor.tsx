import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUp,
  ArrowDown,
  PanelLeft,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Sparkles,
  Play,
  Trash2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BANNER_SOUNDS } from "@/lib/bannerSounds";

// ─── Message suggestions ──────────────────────────────────────────────────────

const START_SUGGESTIONS = [
  "Welcome! Let's dive in 🚀",
  "Ready to learn something new? Let's go!",
  "Take your time — there's no rush. You've got this!",
  "Focus mode: ON. Let's make this lesson count!",
  "Great to see you back! This lesson will take about {duration} minutes.",
  "Before you start: grab a pen and paper — this one's worth taking notes!",
  "This lesson is a key building block. Pay close attention!",
  "Quick tip: watch at 1.25× speed if you're short on time.",
];

const COMPLETE_SUGGESTIONS = [
  "Excellent work! You've completed this lesson 🎉",
  "Lesson complete! Keep that momentum going!",
  "You're making great progress — keep it up! 💪",
  "Well done! Every lesson brings you closer to your goal.",
  "Fantastic! You've unlocked the next lesson.",
  "Congratulations on finishing this lesson! You're on a roll!",
  "Amazing effort! Take a short break if you need one, then continue.",
  "You crushed it! {progress}% of the course complete.",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BannerConfig {
  enabled: boolean;
  position: "top" | "bottom" | "left" | "right";
  message: string;
  imageUrl: string;
  sound: string;
  durationMs: number;
}

interface LessonBannerEditorProps {
  lessonId: number;
  orgId: number;
  startBanner: BannerConfig;
  completeBanner: BannerConfig;
  onSave: (start: BannerConfig, complete: BannerConfig) => void;
}

// ─── Single Banner Panel ──────────────────────────────────────────────────────

function BannerPanel({
  label,
  config,
  suggestions,
  orgId,
  onChange,
}: {
  label: string;
  config: BannerConfig;
  suggestions: string[];
  orgId: number;
  onChange: (c: BannerConfig) => void;
}) {
  const set = (k: keyof BannerConfig, v: any) => onChange({ ...config, [k]: v });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playPreview = (soundId: string) => {
    const sound = BANNER_SOUNDS.find((s) => s.id === soundId);
    if (!sound || !("url" in sound)) return;
    if (audioRef.current) audioRef.current.pause();
    audioRef.current = new Audio(sound.url);
    audioRef.current.volume = 0.5;
    audioRef.current.play().catch(() => {});
  };

  const uploadMutation = trpc.lms.media.getUploadUrl.useMutation();

  const handleImageUpload = async (file: File) => {
    try {
      const { uploadUrl, fileUrl } = await uploadMutation.mutateAsync({
        orgId,
        fileName: `banner-images/${file.name}`,
        contentType: file.type,
      });
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      set("imageUrl", fileUrl);
      toast.success("Image uploaded");
    } catch {
      toast.error("Image upload failed");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label} banner</p>
          <p className="text-xs text-muted-foreground">Show a message banner when this lesson {label === "Start" ? "begins" : "is completed"}</p>
        </div>
        <Switch checked={config.enabled} onCheckedChange={(v) => set("enabled", v)} />
      </div>

      {config.enabled && (
        <>
          {/* Position */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Position</Label>
            <div className="flex gap-2 mt-2">
              {[
                { id: "top", icon: ArrowUp, label: "Top bar" },
                { id: "bottom", icon: ArrowDown, label: "Bottom bar" },
                { id: "left", icon: PanelLeft, label: "Left popover" },
                { id: "right", icon: PanelLeft, label: "Right popover", iconClass: "rotate-180" },
              ].map(({ id, icon: Icon, label: lbl, iconClass }) => (
                <button
                  key={id}
                  onClick={() => set("position", id)}
                  className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg border text-xs transition-all ${
                    config.position === id
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${iconClass || ""}`} />
                  {lbl}
                </button>
              ))}
            </div>
            {(config.position === "left" || config.position === "right") && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {config.position === "left" ? "Left" : "Right"} popover slides in from the {config.position} side — supports an image for visual impact.
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message</Label>
            <Textarea
              value={config.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Enter your encouraging message..."
              rows={3}
              className="mt-2 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tokens: <code className="bg-muted px-1 rounded">{"{student_name}"}</code>{" "}
              <code className="bg-muted px-1 rounded">{"{course_name}"}</code>{" "}
              <code className="bg-muted px-1 rounded">{"{progress}"}</code>{" "}
              <code className="bg-muted px-1 rounded">{"{duration}"}</code>
            </p>
            {/* Suggestions */}
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Message suggestions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => set("message", s)}
                    className="text-xs px-2 py-1 rounded-full border border-border hover:border-primary/60 hover:bg-primary/5 transition-colors text-left"
                  >
                    {s.length > 50 ? s.slice(0, 50) + "…" : s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sound */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sound</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {BANNER_SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => set("sound", sound.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                    config.sound === sound.id
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <span className="text-lg">{sound.emoji}</span>
                  <span className="truncate w-full text-center">{sound.label}</span>
                </button>
              ))}
            </div>
            {config.sound && config.sound !== "none" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 gap-1.5"
                onClick={() => playPreview(config.sound)}
              >
                <Play className="h-3 w-3" /> Preview sound
              </Button>
            )}
          </div>

          {/* Image (for left/right popover) */}
          {(config.position === "left" || config.position === "right") && (
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Popover Image <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              {config.imageUrl ? (
                <div className="mt-2 relative group w-fit">
                  <img
                    src={config.imageUrl}
                    alt="Banner"
                    className="h-28 w-auto rounded-lg border border-border object-cover"
                  />
                  <button
                    onClick={() => set("imageUrl", "")}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Click to upload image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </label>
              )}
              <p className="text-xs text-muted-foreground mt-1">Recommended: 400×300px, PNG or JPG</p>
            </div>
          )}

          {/* Duration */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Display duration: {config.durationMs / 1000}s
            </Label>
            <input
              type="range"
              min={1000}
              max={30000}
              step={500}
              value={config.durationMs}
              onChange={(e) => set("durationMs", parseInt(e.target.value))}
              className="w-full mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
              <span>1s</span>
              <span>30s</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export default function LessonBannerEditor({
  lessonId: _lessonId,
  orgId,
  startBanner,
  completeBanner,
  onSave,
}: LessonBannerEditorProps) {
  const [start, setStart] = useState<BannerConfig>(startBanner);
  const [complete, setComplete] = useState<BannerConfig>(completeBanner);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold mb-1">Lesson Banners</h3>
        <p className="text-xs text-muted-foreground">
          Show motivational banners to learners when they start or complete this lesson. Choose position, message, sound, and optional image.
        </p>
      </div>

      <Tabs defaultValue="start">
        <TabsList className="w-full">
          <TabsTrigger value="start" className="flex-1">
            On Lesson Start
            {start.enabled && <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">ON</Badge>}
          </TabsTrigger>
          <TabsTrigger value="complete" className="flex-1">
            On Lesson Complete
            {complete.enabled && <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">ON</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="start" className="mt-4">
          <BannerPanel
            label="Start"
            config={start}
            suggestions={START_SUGGESTIONS}
            orgId={orgId}
            onChange={setStart}
          />
        </TabsContent>

        <TabsContent value="complete" className="mt-4">
          <BannerPanel
            label="Complete"
            config={complete}
            suggestions={COMPLETE_SUGGESTIONS}
            orgId={orgId}
            onChange={setComplete}
          />
        </TabsContent>
      </Tabs>

      <Button onClick={() => onSave(start, complete)} className="self-start">
        Save Banner Settings
      </Button>
    </div>
  );
}
