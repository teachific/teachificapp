import { useState, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUp,
  ArrowDown,
  PanelLeft,
  Volume2,
  Image as ImageIcon,
  Sparkles,
  Play,
  Trash2,
  PartyPopper,
  Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BANNER_SOUNDS } from "@/lib/bannerSounds";
import { Separator } from "@/components/ui/separator";

const START_SUGGESTIONS = [
  "Welcome! Let's dive in \u{1F680}",
  "Ready to learn something new? Let's go!",
  "Take your time \u2014 there's no rush. You've got this!",
  "Focus mode: ON. Let's make this lesson count!",
  "Great to see you back! This lesson will take about {duration} minutes.",
  "Before you start: grab a pen and paper \u2014 this one's worth taking notes!",
  "This lesson is a key building block. Pay close attention!",
  "Quick tip: watch at 1.25\u00d7 speed if you're short on time.",
];
const COMPLETE_SUGGESTIONS = [
  "Excellent work! You've completed this lesson \u{1F389}",
  "Lesson complete! Keep that momentum going!",
  "You're making great progress \u2014 keep it up! \u{1F4AA}",
  "Well done! Every lesson brings you closer to your goal.",
  "Fantastic! You've unlocked the next lesson.",
  "Congratulations on finishing this lesson! You're on a roll!",
  "Amazing effort! Take a short break if you need one, then continue.",
  "You crushed it! {progress}% of the course complete.",
];

export const CONFETTI_STYLES = [
  { id: "burst",     label: "Burst",     emoji: "\u{1F4A5}", description: "Single burst from center" },
  { id: "cannon",    label: "Cannon",    emoji: "\u{1F38A}", description: "Two cannons from sides" },
  { id: "rain",      label: "Rain",      emoji: "\u{1F327}\uFE0F", description: "Gentle rain from top" },
  { id: "fireworks", label: "Fireworks", emoji: "\u{1F386}", description: "Timed firework bursts" },
] as const;

export type ConfettiStyle = typeof CONFETTI_STYLES[number]["id"];

export function fireConfetti(style: ConfettiStyle) {
  switch (style) {
    case "burst":
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#ff0089","#a864fd","#29cdff","#78ff44","#ff718d","#fdff6a"] });
      break;
    case "cannon": {
      const count = 80;
      const defaults = { origin: { y: 0.7 } };
      const fire = (ratio: number, opts: confetti.Options) => confetti({ ...defaults, ...opts, particleCount: Math.floor(count * ratio) });
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2,  { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1,  { spread: 120, startVelocity: 45 });
      break;
    }
    case "rain": {
      let skew = 1;
      const animEnd = Date.now() + 3000;
      const iv = setInterval(() => {
        const left = animEnd - Date.now();
        if (left <= 0) { clearInterval(iv); return; }
        skew = Math.max(0.8, skew - 0.001);
        confetti({ particleCount: 1, startVelocity: 0, ticks: Math.max(200, 500 * (left / 3000)), origin: { x: Math.random(), y: Math.random() * skew - 0.2 }, colors: ["#ff0089","#a864fd","#29cdff","#78ff44","#ff718d","#fdff6a"], shapes: ["circle"], gravity: 0.5, scalar: 2, drift: 0 });
      }, 16);
      break;
    }
    case "fireworks": {
      const animEnd = Date.now() + 3000;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
      const iv = setInterval(() => {
        const left = animEnd - Date.now();
        if (left <= 0) { clearInterval(iv); return; }
        const pc = 50 * (left / 3000);
        confetti({ ...defaults, particleCount: pc, origin: { x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.4 } });
        confetti({ ...defaults, particleCount: pc, origin: { x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.4 } });
      }, 250);
      break;
    }
  }
}

export interface BannerConfig {
  enabled: boolean;
  position: "top" | "bottom" | "left" | "right";
  message: string;
  imageUrl: string;
  sound: string;
  customSoundUrl: string;
  confetti: boolean;
  confettiStyle: ConfettiStyle;
  durationMs: number;
}

interface LessonBannerEditorProps {
  lessonId: number;
  orgId: number;
  startBanner: BannerConfig;
  completeBanner: BannerConfig;
  onSave: (start: BannerConfig, complete: BannerConfig) => void;
}

function BannerPanel({ label, config, suggestions, orgId, onChange }: {
  label: string; config: BannerConfig; suggestions: string[]; orgId: number; onChange: (c: BannerConfig) => void;
}) {
  const set = <K extends keyof BannerConfig>(k: K, v: BannerConfig[K]) => onChange({ ...config, [k]: v });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreviewSound = useCallback(() => {
    const url = config.sound === "custom" ? config.customSoundUrl : (BANNER_SOUNDS.find((s) => s.id === config.sound)?.url ?? "");
    if (!url) { toast.error("No sound URL to preview"); return; }
    if (audioRef.current) audioRef.current.pause();
    audioRef.current = new Audio(url);
    audioRef.current.volume = 0.6;
    audioRef.current.play().catch(() => toast.error("Could not play audio \u2014 check the URL"));
  }, [config.sound, config.customSoundUrl]);

  const handlePreviewEffect = useCallback(() => {
    const hasSound = config.sound && config.sound !== "none";
    if (hasSound) handlePreviewSound();
    if (config.confetti) fireConfetti(config.confettiStyle);
    if (!hasSound && !config.confetti) toast("No effects configured \u2014 enable sound or confetti first");
  }, [config.sound, config.confetti, config.confettiStyle, handlePreviewSound]);

  const uploadMutation = trpc.lms.media.getUploadUrl.useMutation();
  const handleImageUpload = async (file: File) => {
    try {
      const { uploadUrl, fileUrl } = await uploadMutation.mutateAsync({ orgId, fileName: `banner-images/${file.name}`, contentType: file.type });
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      set("imageUrl", fileUrl);
      toast.success("Image uploaded");
    } catch { toast.error("Image upload failed"); }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label} banner</p>
          <p className="text-xs text-muted-foreground">Show a message banner when this lesson {label === "Start" ? "begins" : "is completed"}</p>
        </div>
        <Switch checked={config.enabled} onCheckedChange={(v) => set("enabled", v)} />
      </div>
      {config.enabled && (<>
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Position</Label>
          <div className="flex gap-2 mt-2">
            {([
              { id: "top" as const, icon: ArrowUp, label: "Top bar" },
              { id: "bottom" as const, icon: ArrowDown, label: "Bottom bar" },
              { id: "left" as const, icon: PanelLeft, label: "Left popover" },
              { id: "right" as const, icon: PanelLeft, label: "Right popover", iconClass: "rotate-180" },
            ]).map(({ id, icon: Icon, label: lbl, iconClass }: any) => (
              <button key={id} onClick={() => set("position", id)}
                className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg border text-xs transition-all ${config.position === id ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50 text-muted-foreground"}`}>
                <Icon className={`h-4 w-4 ${iconClass || ""}`} />{lbl}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message</Label>
          <Textarea value={config.message} onChange={(e) => set("message", e.target.value)} placeholder="Enter your encouraging message..." rows={3} className="mt-2 resize-none" />
          <p className="text-xs text-muted-foreground mt-1">
            Tokens: <code className="bg-muted px-1 rounded">{"{student_name}"}</code> <code className="bg-muted px-1 rounded">{"{course_name}"}</code> <code className="bg-muted px-1 rounded">{"{progress}"}</code> <code className="bg-muted px-1 rounded">{"{duration}"}</code>
          </p>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Message suggestions</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button key={s} onClick={() => set("message", s)} className="text-xs px-2 py-1 rounded-full border border-border hover:border-primary/60 hover:bg-primary/5 transition-colors text-left">
                  {s.length > 50 ? s.slice(0, 50) + "\u2026" : s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Separator />
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5" /> Sound Effect
          </Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {BANNER_SOUNDS.map((sound) => (
              <button key={sound.id} onClick={() => set("sound", sound.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${config.sound === sound.id ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50 text-muted-foreground"}`}>
                <span className="text-lg">{sound.emoji}</span>
                <span className="truncate w-full text-center">{sound.label}</span>
              </button>
            ))}
          </div>
          {config.sound === "custom" && (
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground">Custom MP3 URL</Label>
              <Input value={config.customSoundUrl} onChange={(e) => set("customSoundUrl", e.target.value)} placeholder="https://example.com/sound.mp3" className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">
                Free sounds at <a href="https://www.101soundboards.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">101soundboards.com</a> or <a href="https://pixabay.com/sound-effects/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Pixabay</a>.
              </p>
            </div>
          )}
          {config.sound && config.sound !== "none" && (
            <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={handlePreviewSound}>
              <Play className="h-3 w-3" /> Preview sound
            </Button>
          )}
        </div>
        <Separator />
        <div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <PartyPopper className="h-3.5 w-3.5" /> Confetti Cannon
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">Fire a confetti animation when this banner appears</p>
            </div>
            <Switch checked={config.confetti} onCheckedChange={(v) => set("confetti", v)} />
          </div>
          {config.confetti && (
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground mb-2 block">Confetti Style</Label>
              <div className="grid grid-cols-2 gap-2">
                {CONFETTI_STYLES.map((style) => (
                  <button key={style.id} onClick={() => set("confettiStyle", style.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs transition-all text-left ${config.confettiStyle === style.id ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50 text-muted-foreground"}`}>
                    <span className="text-xl shrink-0">{style.emoji}</span>
                    <div><p className="font-medium">{style.label}</p><p className="text-[10px] text-muted-foreground">{style.description}</p></div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <Separator />
        <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Preview Effect</p>
          </div>
          <p className="text-xs text-muted-foreground">Test how the sound and confetti will look and sound to your students when this banner fires.</p>
          <Button variant="default" size="sm" className="self-start gap-2" onClick={handlePreviewEffect}
            disabled={(!config.sound || config.sound === "none") && !config.confetti}>
            <Play className="h-3.5 w-3.5" /> Show Effect
          </Button>
        </div>
        {(config.position === "left" || config.position === "right") && (
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Popover Image <span className="font-normal">(optional)</span>
            </Label>
            {config.imageUrl ? (
              <div className="mt-2 relative group w-fit">
                <img src={config.imageUrl} alt="Banner" className="h-28 w-auto rounded-lg border border-border object-cover" />
                <button onClick={() => set("imageUrl", "")} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Click to upload image</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
              </label>
            )}
            <p className="text-xs text-muted-foreground mt-1">Recommended: 400x300px, PNG or JPG</p>
          </div>
        )}
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Display duration: {config.durationMs / 1000}s
          </Label>
          <input type="range" min={1000} max={30000} step={500} value={config.durationMs}
            onChange={(e) => set("durationMs", parseInt(e.target.value))} className="w-full mt-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-0.5"><span>1s</span><span>30s</span></div>
        </div>
      </>)}
    </div>
  );
}

export default function LessonBannerEditor({ lessonId: _lessonId, orgId, startBanner, completeBanner, onSave }: LessonBannerEditorProps) {
  const [start, setStart] = useState<BannerConfig>(startBanner);
  const [complete, setComplete] = useState<BannerConfig>(completeBanner);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold mb-1">Lesson Banners</h3>
        <p className="text-xs text-muted-foreground">Show motivational banners to learners when they start or complete this lesson. Choose position, message, sound effect, and optional confetti cannon.</p>
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
          <BannerPanel label="Start" config={start} suggestions={START_SUGGESTIONS} orgId={orgId} onChange={setStart} />
        </TabsContent>
        <TabsContent value="complete" className="mt-4">
          <BannerPanel label="Complete" config={complete} suggestions={COMPLETE_SUGGESTIONS} orgId={orgId} onChange={setComplete} />
        </TabsContent>
      </Tabs>
      <Button onClick={() => onSave(start, complete)} className="self-start">Save Banner Settings</Button>
    </div>
  );
}
