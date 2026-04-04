import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Video, VideoOff, Mic, MicOff, Monitor, Circle, Square,
  Pause, Play, Download, Trash2, Settings, Camera,
  CheckCircle, Loader2, Clock, Library, FileText, Upload,
  Scissors, Subtitles, Save, Plus, X, Edit2, ChevronRight,
  Film, Wand2, ArrowLeft, Headphones, Volume2, Sparkles,
  Music, SlidersHorizontal,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useUploadQueue } from "@/contexts/UploadQueueContext";

// ─── Types ───────────────────────────────────────────────────────────────────

type RecordMode = "screen" | "camera" | "screen+camera";
type RecordState = "idle" | "countdown" | "recording" | "paused" | "stopped";
type StudioTab = "record" | "upload" | "edit" | "audio";

interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface ClipSelection {
  id: string;
  label: string;
  startSec: number;
  endSec: number;
  savedId?: number;
}

interface MediaItem {
  id: number;
  url: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  durationSeconds?: number | null;
  captionsUrl?: string | null;
  transcriptJson?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── VideoEditor Sub-component ───────────────────────────────────────────────

function VideoEditor({ item, orgId, onSaved }: { item: MediaItem; orgId: number; onSaved?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLTrackElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(item.durationSeconds ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [segments, setSegments] = useState<TranscriptSegment[]>(() => {
    if (item.transcriptJson) {
      try { return JSON.parse(item.transcriptJson); } catch { return []; }
    }
    return [];
  });
  const [captionsUrl, setCaptionsUrl] = useState(item.captionsUrl ?? null);
  const [clips, setClips] = useState<ClipSelection[]>([]);
  const [clipStart, setClipStart] = useState<number | null>(null);
  const [clipEnd, setClipEnd] = useState<number | null>(null);
  const [clipLabel, setClipLabel] = useState("Highlight");
  const [editingSegId, setEditingSegId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [generatingCaptions, setGeneratingCaptions] = useState(false);
  const [savingCaptions, setSavingCaptions] = useState(false);
  const [savingClip, setSavingClip] = useState(false);
  const [downloadingFull, setDownloadingFull] = useState(false);

  const generateCaptionsMutation = trpc.lms.media.generateCaptions.useMutation();
  const updateCaptionsMutation = trpc.lms.media.updateCaptions.useMutation();
  const saveClipMutation = trpc.lms.media.saveClip.useMutation();
  const listClipsQuery = trpc.lms.media.listClips.useQuery(
    { orgId, mediaItemId: item.id },
    { enabled: !!item.id }
  );
  const deleteClipMutation = trpc.lms.media.deleteClip.useMutation();

  // Load saved clips from DB
  useEffect(() => {
    if (listClipsQuery.data) {
      setClips(listClipsQuery.data.map((c: any) => ({
        id: `db-${c.id}`,
        label: c.label,
        startSec: c.startSec,
        endSec: c.endSec,
        savedId: c.id,
      })));
    }
  }, [listClipsQuery.data]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };
  const seekTo = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      setCurrentTime(sec);
    }
  };

  // Caption track reload when captionsUrl changes
  useEffect(() => {
    if (videoRef.current && captionsUrl) {
      // Force reload the track
      const video = videoRef.current;
      Array.from(video.textTracks).forEach((t) => {
        t.mode = showCaptions ? "showing" : "hidden";
      });
    }
  }, [captionsUrl, showCaptions]);

  // Generate captions via Whisper
  const handleGenerateCaptions = async () => {
    setGeneratingCaptions(true);
    try {
      const result = await generateCaptionsMutation.mutateAsync({
        orgId,
        mediaItemId: item.id,
        fileUrl: item.url,
      });
      setSegments(result.segments as TranscriptSegment[]);
      setCaptionsUrl(result.captionsUrl);
      toast.success("Captions generated successfully");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to generate captions");
    } finally {
      setGeneratingCaptions(false);
    }
  };

  // Save edited captions
  const handleSaveCaptions = async () => {
    if (segments.length === 0) { toast.error("No captions to save"); return; }
    setSavingCaptions(true);
    try {
      const result = await updateCaptionsMutation.mutateAsync({
        orgId,
        mediaItemId: item.id,
        segments,
      });
      setCaptionsUrl(result.captionsUrl);
      toast.success("Captions saved");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save captions");
    } finally {
      setSavingCaptions(false);
    }
  };

  // Edit a segment text
  const startEditSegment = (seg: TranscriptSegment) => {
    setEditingSegId(seg.id);
    setEditingText(seg.text);
  };
  const saveEditSegment = () => {
    if (editingSegId === null) return;
    setSegments((prev) => prev.map((s) => s.id === editingSegId ? { ...s, text: editingText } : s));
    setEditingSegId(null);
  };

  // Click on transcript segment to seek
  const handleSegmentClick = (seg: TranscriptSegment) => {
    seekTo(seg.start);
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Add a clip selection
  const handleAddClip = () => {
    const start = clipStart ?? 0;
    const end = clipEnd ?? duration;
    if (end <= start) { toast.error("End time must be after start time"); return; }
    const newClip: ClipSelection = {
      id: `local-${Date.now()}`,
      label: clipLabel || "Highlight",
      startSec: start,
      endSec: end,
    };
    setClips((prev) => [...prev, newClip]);
    setClipStart(null);
    setClipEnd(null);
    setClipLabel("Highlight");
  };

  // Save clip to DB
  const handleSaveClip = async (clip: ClipSelection) => {
    if (clip.savedId) { toast.info("Clip already saved"); return; }
    setSavingClip(true);
    try {
      const saved = await saveClipMutation.mutateAsync({
        orgId,
        mediaItemId: item.id,
        label: clip.label,
        startSec: clip.startSec,
        endSec: clip.endSec,
      });
      setClips((prev) => prev.map((c) => c.id === clip.id ? { ...c, savedId: (saved as any)?.id } : c));
      toast.success("Clip saved to Media Library");
      onSaved?.();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save clip");
    } finally {
      setSavingClip(false);
    }
  };

  // Delete a clip
  const handleDeleteClip = async (clip: ClipSelection) => {
    if (clip.savedId) {
      try {
        await deleteClipMutation.mutateAsync({ id: clip.savedId, orgId });
      } catch {}
    }
    setClips((prev) => prev.filter((c) => c.id !== clip.id));
  };

  // Download full video
  const handleDownloadFull = () => {
    setDownloadingFull(true);
    const a = document.createElement("a");
    a.href = item.url;
    a.download = item.filename;
    a.click();
    setTimeout(() => setDownloadingFull(false), 1000);
  };

  // Download VTT captions
  const handleDownloadCaptions = () => {
    if (!captionsUrl) { toast.error("No captions available"); return; }
    const a = document.createElement("a");
    a.href = captionsUrl;
    a.download = item.filename.replace(/\.[^.]+$/, "") + ".vtt";
    a.click();
  };

  // Set clip start/end to current time
  const setClipStartToCurrent = () => setClipStart(parseFloat(currentTime.toFixed(2)));
  const setClipEndToCurrent = () => setClipEnd(parseFloat(currentTime.toFixed(2)));

  const activeSegment = segments.find((s) => currentTime >= s.start && currentTime <= s.end);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Video player */}
      <div className="relative bg-black rounded-xl overflow-hidden aspect-video w-full">
        <video
          ref={videoRef}
          src={item.url}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          crossOrigin="anonymous"
        >
          {captionsUrl && (
            <track
              ref={trackRef}
              kind="subtitles"
              src={captionsUrl}
              srcLang="en"
              label="English"
              default={showCaptions}
            />
          )}
        </video>

        {/* Caption overlay badge */}
        {captionsUrl && (
          <button
            onClick={() => setShowCaptions((v) => !v)}
            className={cn(
              "absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
              showCaptions
                ? "bg-primary text-primary-foreground"
                : "bg-black/60 text-white/70 hover:bg-black/80"
            )}
          >
            <Subtitles className="h-3 w-3" />
            {showCaptions ? "CC On" : "CC Off"}
          </button>
        )}
      </div>

      {/* Playback controls */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handlePlayPause}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="w-full h-2 accent-primary cursor-pointer"
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Two-column layout: Transcript + Clips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transcript / Captions panel */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Transcript & Captions</span>
              {segments.length > 0 && (
                <Badge variant="secondary" className="text-xs">{segments.length} segments</Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {segments.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleSaveCaptions}
                  disabled={savingCaptions}
                >
                  {savingCaptions ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                  Save
                </Button>
              )}
              {captionsUrl && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleDownloadCaptions}>
                  <Download className="h-3 w-3 mr-1" /> VTT
                </Button>
              )}
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleGenerateCaptions}
                disabled={generatingCaptions}
              >
                {generatingCaptions
                  ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Generating...</>
                  : <><Wand2 className="h-3 w-3 mr-1" /> {segments.length > 0 ? "Regenerate" : "Generate Captions"}</>
                }
              </Button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {segments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                <Subtitles className="h-8 w-8 opacity-30" />
                <p className="text-sm">No transcript yet</p>
                <p className="text-xs text-center max-w-48">Click "Generate Captions" to auto-transcribe this video using AI</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {segments.map((seg) => (
                  <div
                    key={seg.id}
                    className={cn(
                      "flex items-start gap-2 px-4 py-2 group cursor-pointer transition-colors",
                      activeSegment?.id === seg.id ? "bg-primary/10" : "hover:bg-muted/40"
                    )}
                    onClick={() => editingSegId !== seg.id && handleSegmentClick(seg)}
                  >
                    <button
                      className="text-xs text-primary font-mono shrink-0 mt-0.5 hover:underline"
                      onClick={(e) => { e.stopPropagation(); seekTo(seg.start); }}
                    >
                      {formatTime(seg.start)}
                    </button>
                    {editingSegId === seg.id ? (
                      <div className="flex-1 flex items-start gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="text-xs min-h-[3rem] flex-1 resize-none"
                          autoFocus
                        />
                        <div className="flex flex-col gap-1">
                          <Button size="icon" className="h-6 w-6" onClick={saveEditSegment}>
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingSegId(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="flex-1 text-xs leading-relaxed">{seg.text}</p>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => { e.stopPropagation(); startEditSegment(seg); }}
                        >
                          <Edit2 className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clips panel */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Highlight Clips</span>
              {clips.length > 0 && (
                <Badge variant="secondary" className="text-xs">{clips.length} clips</Badge>
              )}
            </div>
          </div>

          {/* Clip creator */}
          <div className="p-4 border-b border-border bg-muted/10">
            <p className="text-xs text-muted-foreground mb-3">Mark start/end at current playhead position, then add a clip</p>
            <div className="flex items-center gap-2 mb-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs flex-1"
                onClick={setClipStartToCurrent}
              >
                <ChevronRight className="h-3 w-3 mr-1 rotate-180" />
                Start: {clipStart !== null ? formatTime(clipStart) : "—"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs flex-1"
                onClick={setClipEndToCurrent}
              >
                End: {clipEnd !== null ? formatTime(clipEnd) : "—"}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={clipLabel}
                onChange={(e) => setClipLabel(e.target.value)}
                placeholder="Clip label"
                className="h-7 text-xs flex-1"
              />
              <Button
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={handleAddClip}
                disabled={clipStart === null && clipEnd === null}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Clip
              </Button>
            </div>
          </div>

          {/* Clips list */}
          <div className="max-h-52 overflow-y-auto">
            {clips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <Film className="h-7 w-7 opacity-30" />
                <p className="text-sm">No clips yet</p>
                <p className="text-xs text-center max-w-44">Use the controls above to mark highlights from this video</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {clips.map((clip) => (
                  <div key={clip.id} className="flex items-center gap-2 px-4 py-2.5 group hover:bg-muted/30 transition-colors">
                    <button
                      className="flex-1 text-left"
                      onClick={() => seekTo(clip.startSec)}
                    >
                      <p className="text-xs font-medium">{clip.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatTime(clip.startSec)} → {formatTime(clip.endSec)}
                        <span className="ml-1.5 text-muted-foreground/60">({formatTime(clip.endSec - clip.startSec)})</span>
                      </p>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!clip.savedId && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-primary"
                          onClick={() => handleSaveClip(clip)}
                          disabled={savingClip}
                          title="Save clip to Media Library"
                        >
                          {savingClip ? <Loader2 className="h-3 w-3 animate-spin" /> : <Library className="h-3 w-3" />}
                        </Button>
                      )}
                      {clip.savedId && (
                        <CheckCircle className="h-4 w-4 text-teal-500" aria-label="Saved to Media Library" />
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleDeleteClip(clip)}
                        title="Delete clip"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Download actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <Button
          variant="outline"
          onClick={handleDownloadFull}
          disabled={downloadingFull}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Full Video
        </Button>
        {captionsUrl && (
          <Button variant="outline" onClick={handleDownloadCaptions} className="flex items-center gap-2">
            <Subtitles className="h-4 w-4" />
            Download Captions (.vtt)
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {formatFileSize(item.fileSize)} · {item.mimeType}
        </span>
      </div>
    </div>
  );
}

// ─── RecordTab Sub-component ─────────────────────────────────────────────────

function RecordTab({ orgId, onSaved }: { orgId: number; onSaved: (item: MediaItem) => void }) {
  const [mode, setMode] = useState<RecordMode>("screen+camera");
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [recordings, setRecordings] = useState<{ url: string; name: string; size: number; duration: number }[]>([]);
  const [cameraPos, setCameraPos] = useState({ x: 20, y: 20 });
  const [isDraggingCamera, setIsDraggingCamera] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [cameraSize, setCameraSize] = useState(160);
  const [showSettings, setShowSettings] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedItems, setSavedItems] = useState<Record<number, MediaItem>>({});

  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const saveMediaItem = trpc.lms.media.saveMediaItem.useMutation();

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      // Filter out devices with empty deviceId (returned before permission is granted)
      setAudioDevices(devices.filter((d) => d.kind === "audioinput" && d.deviceId !== ""));
      setVideoDevices(devices.filter((d) => d.kind === "videoinput" && d.deviceId !== ""));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== "screen" && cameraEnabled) {
      const constraints: MediaStreamConstraints = {
        video: selectedCamera ? { deviceId: selectedCamera } : true,
        audio: false,
      };
      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        cameraStreamRef.current = stream;
        if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream;
      }).catch(() => {
        toast.error("Could not access camera");
        setCameraEnabled(false);
      });
    }
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
    };
  }, [mode, cameraEnabled, selectedCamera]);

  const startRecording = useCallback(async () => {
    try {
      const streams: MediaStream[] = [];
      if (mode === "screen" || mode === "screen+camera") {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
        screenStreamRef.current = screenStream;
        streams.push(screenStream);
        if (screenVideoRef.current) screenVideoRef.current.srcObject = screenStream;
      }
      if (micEnabled) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: selectedMic ? { deviceId: selectedMic } : true,
            video: false,
          });
          streams.push(micStream);
        } catch {
          toast.warning("Could not access microphone — recording without audio");
        }
      }
      const combinedTracks: MediaStreamTrack[] = [];
      streams.forEach((s) => s.getTracks().forEach((t) => combinedTracks.push(t)));
      const combined = new MediaStream(combinedTracks);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus" : "video/webm";
      const recorder = new MediaRecorder(combined, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const name = `Recording-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-")}.webm`;
        setRecordings((prev) => [{ url, name, size: blob.size, duration: elapsed }, ...prev]);
        if (previewRef.current) previewRef.current.src = url;
        setRecordState("stopped");
        streams.forEach((s) => s.getTracks().forEach((t) => t.stop()));
      };
      if (screenStreamRef.current) {
        screenStreamRef.current.getVideoTracks()[0]?.addEventListener("ended", () => stopRecording());
      }
      recorder.start(1000);
      setRecordState("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (err: any) {
      if (err.name !== "NotAllowedError") toast.error("Could not start recording: " + err.message);
      setRecordState("idle");
    }
  }, [mode, micEnabled, selectedMic, elapsed]);

  const startCountdown = useCallback(async () => {
    setRecordState("countdown");
    setCountdown(3);
    let c = 3;
    const interval = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) { clearInterval(interval); startRecording(); }
    }, 1000);
  }, [startRecording]);

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordState("paused");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };
  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordState("recording");
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
  };
  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
  }, []);

  const handleCameraMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingCamera(true);
    setDragOffset({ x: e.clientX - cameraPos.x, y: e.clientY - cameraPos.y });
  };
  useEffect(() => {
    if (!isDraggingCamera) return;
    const onMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setCameraPos({
        x: Math.max(0, Math.min(rect.width - cameraSize, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(rect.height - cameraSize, e.clientY - dragOffset.y)),
      });
    };
    const onUp = () => setIsDraggingCamera(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [isDraggingCamera, dragOffset, cameraSize]);

  const handleSaveToLibrary = async (rec: typeof recordings[0], idx: number) => {
    setSavingIdx(idx);
    try {
      const blob = await fetch(rec.url).then((r) => r.blob());
      const ext = rec.name.split(".").pop() ?? "webm";
      const contentType = blob.type || `video/${ext}`;

      // Upload via server-side proxy
      const formData = new FormData();
      formData.append("file", blob, rec.name);
      formData.append("orgId", String(orgId));
      formData.append("folder", "lms-media");
      const uploadRes = await fetch("/api/media-upload", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error ?? "Upload failed");
      }
      const uploadData = await uploadRes.json();

      const saved = await saveMediaItem.mutateAsync({
        orgId,
        fileName: rec.name,
        mimeType: contentType,
        fileSize: blob.size,
        fileKey: uploadData.key,
        url: uploadData.url,
        durationSeconds: rec.duration,
        tags: ["recording"],
        source: "direct",
      });
      const item: MediaItem = {
        id: (saved as any).id,
        url: uploadData.url,
        filename: rec.name,
        mimeType: contentType,
        fileSize: blob.size,
        durationSeconds: rec.duration,
      };
      setSavedItems((prev) => ({ ...prev, [idx]: item }));
      toast.success("Saved to Media Library");
      onSaved(item);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save recording");
    } finally {
      setSavingIdx(null);
    }
  };

  const isRecording = recordState === "recording" || recordState === "paused";

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main recording area */}
      <div className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto">
        {/* Mode selector */}
        {!isRecording && recordState !== "countdown" && (
          <div className="flex items-center gap-3 flex-wrap">
            {(["screen+camera", "screen", "camera"] as RecordMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                  mode === m ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground"
                )}
              >
                {m === "screen+camera" && <><Monitor className="h-4 w-4" /><Camera className="h-4 w-4" /> Screen + Camera</>}
                {m === "screen" && <><Monitor className="h-4 w-4" /> Screen Only</>}
                {m === "camera" && <><Camera className="h-4 w-4" /> Camera Only</>}
              </button>
            ))}
          </div>
        )}

        {/* Preview area */}
        <div ref={containerRef} className="relative bg-black rounded-2xl overflow-hidden aspect-video w-full max-w-4xl mx-auto">
          {(mode === "screen" || mode === "screen+camera") && (
            <video ref={screenVideoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
          )}
          {mode === "camera" && (
            <video ref={cameraVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          )}
          {mode === "screen+camera" && cameraEnabled && (
            <div
              className="absolute rounded-full overflow-hidden border-2 border-white shadow-lg cursor-move select-none"
              style={{ left: cameraPos.x, top: cameraPos.y, width: cameraSize, height: cameraSize }}
              onMouseDown={handleCameraMouseDown}
            >
              <video ref={cameraVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            </div>
          )}
          {recordState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
              <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                <Video className="h-8 w-8 text-white/60" />
              </div>
              <p className="text-white/60 text-sm">Click Start Recording to begin</p>
            </div>
          )}
          {recordState === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="text-8xl font-bold text-white animate-pulse">{countdown}</div>
            </div>
          )}
          {isRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5">
              <div className={cn("h-2.5 w-2.5 rounded-full bg-red-500", recordState === "recording" && "animate-pulse")} />
              <span className="text-white text-sm font-mono">{formatTime(elapsed)}</span>
              {recordState === "paused" && <Badge variant="outline" className="text-yellow-400 border-yellow-400 text-[10px]">PAUSED</Badge>}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button variant="outline" size="icon" className={cn("h-11 w-11 rounded-full", !micEnabled && "border-destructive text-destructive")}
            onClick={() => setMicEnabled((v) => !v)} disabled={isRecording} title={micEnabled ? "Mute microphone" : "Unmute microphone"}>
            {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          {mode !== "screen" && (
            <Button variant="outline" size="icon" className={cn("h-11 w-11 rounded-full", !cameraEnabled && "border-destructive text-destructive")}
              onClick={() => setCameraEnabled((v) => !v)} disabled={isRecording}>
              {cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          )}
          {recordState === "idle" && (
            <Button size="lg" className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30" onClick={startCountdown}>
              <Circle className="h-6 w-6 fill-current" />
            </Button>
          )}
          {recordState === "countdown" && (
            <Button size="lg" variant="outline" className="h-14 w-14 rounded-full" onClick={() => setRecordState("idle")}>
              <Square className="h-5 w-5" />
            </Button>
          )}
          {recordState === "recording" && (
            <>
              <Button size="lg" variant="outline" className="h-14 w-14 rounded-full" onClick={pauseRecording}>
                <Pause className="h-5 w-5" />
              </Button>
              <Button size="lg" className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white" onClick={stopRecording}>
                <Square className="h-5 w-5 fill-current" />
              </Button>
            </>
          )}
          {recordState === "paused" && (
            <>
              <Button size="lg" className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white" onClick={resumeRecording}>
                <Play className="h-5 w-5 fill-current" />
              </Button>
              <Button size="lg" className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white" onClick={stopRecording}>
                <Square className="h-5 w-5 fill-current" />
              </Button>
            </>
          )}
          {recordState === "stopped" && (
            <Button size="lg" className="h-14 px-6 rounded-full bg-primary text-primary-foreground"
              onClick={() => { setRecordState("idle"); setElapsed(0); if (screenVideoRef.current) screenVideoRef.current.srcObject = null; }}>
              <Circle className="h-5 w-5 fill-current mr-2" /> Record Again
            </Button>
          )}
        </div>

        {mode === "screen+camera" && !isRecording && (
          <div className="flex items-center gap-3 max-w-xs mx-auto w-full">
            <Camera className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider value={[cameraSize]} onValueChange={([v]) => setCameraSize(v)} min={80} max={280} step={20} className="flex-1" />
            <span className="text-xs text-muted-foreground w-12 text-right">{cameraSize}px</span>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="w-80 border-l border-border flex flex-col overflow-hidden">
        {showSettings && (
          <div className="p-4 border-b border-border flex flex-col gap-3">
            <h3 className="font-semibold text-sm">Settings</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Microphone</label>
              <Select value={selectedMic || "__default__"} onValueChange={(v) => setSelectedMic(v === "__default__" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Default microphone" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">Default microphone</SelectItem>
                  {audioDevices.map((d) => <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0, 8)}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Camera</label>
              <Select value={selectedCamera || "__default__"} onValueChange={(v) => setSelectedCamera(v === "__default__" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Default camera" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">Default camera</SelectItem>
                  {videoDevices.map((d) => <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 8)}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">Recordings ({recordings.length})</h3>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowSettings((s) => !s)}>
            <Settings className="h-3.5 w-3.5 mr-1" /> Settings
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {recordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
              <Video className="h-8 w-8 opacity-30" />
              <p>No recordings yet</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recordings.map((rec, idx) => (
                <div key={idx} className="p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rec.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatTime(rec.duration)}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatFileSize(rec.size)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { const a = document.createElement("a"); a.href = rec.url; a.download = rec.name; a.click(); }} title="Download">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className={cn("h-7 w-7", savedItems[idx] ? "text-teal-500" : "")}
                        onClick={() => handleSaveToLibrary(rec, idx)}
                        disabled={savingIdx === idx || !!savedItems[idx]}
                        title={savedItems[idx] ? "Saved to Library" : "Save to Media Library"}
                      >
                        {savingIdx === idx ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Library className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                  {idx === 0 && recordState === "stopped" && (
                    <video ref={previewRef} controls className="mt-2 w-full rounded-lg aspect-video bg-black" />
                  )}
                  {savedItems[idx] && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-teal-600">
                      <CheckCircle className="h-3 w-3" />
                      Saved — click Edit tab to add captions &amp; clips
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── UploadTab Sub-component ─────────────────────────────────────────────────
function UploadTab({ orgId, onSaved }: { orgId: number; onSaved: (item: MediaItem) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedItems, setUploadedItems] = useState<MediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveMediaItem = trpc.lms.media.saveMediaItem.useMutation();
  const { enqueue } = useUploadQueue();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const maxSize = 3 * 1024 * 1024 * 1024; // 3 GB
    let queued = 0;
    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`"${file.name}" is too large — maximum 3 GB`);
        return;
      }
      enqueue({
        file,
        orgId,
        folder: "lms-media",
        onComplete: async (result) => {
          if (!result) return;
          try {
            const saved = await saveMediaItem.mutateAsync({
              orgId,
              fileName: result.fileName,
              mimeType: result.fileType || file.type || "video/mp4",
              fileSize: result.fileSize,
              fileKey: result.key,
              url: result.url,
              source: "direct",
              tags: ["upload"],
            });
            const item: MediaItem = {
              id: (saved as any).id,
              url: result.url,
              filename: result.fileName,
              mimeType: result.fileType || file.type || "video/mp4",
              fileSize: result.fileSize,
            };
            setUploadedItems((prev) => [item, ...prev]);
            toast.success(`"${result.fileName}" uploaded to Media Library`);
            onSaved(item);
          } catch (err: any) {
            toast.error(`Failed to save "${result.fileName}": ${err?.message ?? "Unknown error"}`);
          }
        },
        onError: (message) => {
          toast.error(`Upload failed: ${message}`);
        },
      });
      queued++;
    });
    if (queued > 0) {
      toast.info(
        queued === 1
          ? `"${Array.from(files).find(f => f.size <= 3 * 1024 * 1024 * 1024)?.name}" added to upload queue`
          : `${queued} files added to upload queue`
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
      <div>
        <h2 className="text-lg font-semibold">Upload Video</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload one or more videos — they will be processed in the background so you can keep working
        </p>
      </div>
      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Upload className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Drop videos here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">
            MP4, MOV, WebM, AVI, MKV, MP3, WAV · Max 3 GB · Multiple files supported
          </p>
        </div>
      </div>
      {/* Completed items this session */}
      {uploadedItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Uploaded this session</h3>
          {uploadedItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Film className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.filename}</p>
                <p className="text-xs text-muted-foreground">{item.mimeType}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <CheckCircle className="h-4 w-4 text-teal-500" />
                <span className="text-xs text-teal-600">Saved</span>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Switch to the <strong>Edit</strong> tab to add captions and create highlight clips
          </p>
        </div>
      )}
    </div>
  );
}

// ─── EditTab Sub-component ───────────────────────────────────────────────────

function EditTab({ orgId, initialItem }: { orgId: number; initialItem?: MediaItem }) {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(initialItem ?? null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const listMediaQuery = trpc.forms.media.list.useQuery(
    { orgId, pageSize: 200 },
    { enabled: !!orgId }
  );

  useEffect(() => {
    if (listMediaQuery.data) {
      const allItems = listMediaQuery.data.items ?? [];
      const videoItems = allItems.filter(
        (item) => item.mimeType?.startsWith("video/") || item.mimeType?.startsWith("audio/")
      );
      setMediaItems(videoItems as MediaItem[]);
    }
  }, [listMediaQuery.data]);

  useEffect(() => {
    if (initialItem) setSelectedItem(initialItem);
  }, [initialItem]);

  if (selectedItem) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
          <Button variant="ghost" size="sm" className="h-7 gap-1.5" onClick={() => setSelectedItem(null)}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to library
          </Button>
          <div className="h-4 w-px bg-border" />
          <p className="text-sm font-medium truncate">{selectedItem.filename}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <VideoEditor item={selectedItem} orgId={orgId} onSaved={() => listMediaQuery.refetch()} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Edit Video</h2>
        <p className="text-sm text-muted-foreground mt-1">Select a video from your Media Library to add captions, edit the transcript, and create highlight clips</p>
      </div>

      {listMediaQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : mediaItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Film className="h-12 w-12 opacity-20" />
          <p className="text-sm font-medium">No videos in your Media Library</p>
          <p className="text-xs text-center max-w-64">Record a new video or upload one using the Record or Upload tabs, then come back here to edit it</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mediaItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left group"
            >
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 relative overflow-hidden">
                {item.mimeType?.startsWith("video/") ? (
                  <video src={item.url} className="w-full h-full object-cover" muted />
                ) : (
                  <Mic className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.filename}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{formatFileSize(item.fileSize)}</span>
                  {(item as any).captionsUrl && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">CC</Badge>
                  )}
                  {(item as any).transcriptJson && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Transcript</Badge>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AudioTab Sub-component ─────────────────────────────────────────────────

const VOICE_OPTIONS = [
  { value: "alloy", label: "Alloy", description: "Neutral, balanced" },
  { value: "echo", label: "Echo", description: "Warm, resonant" },
  { value: "fable", label: "Fable", description: "Expressive, narrative" },
  { value: "onyx", label: "Onyx", description: "Deep, authoritative" },
  { value: "nova", label: "Nova", description: "Bright, energetic" },
  { value: "shimmer", label: "Shimmer", description: "Clear, professional" },
] as const;

type AudioSubTab = "record" | "upload" | "tts";

function AudioTab({ orgId, onSaved }: { orgId: number; onSaved?: (item: MediaItem) => void }) {
  const [subTab, setSubTab] = useState<AudioSubTab>("record");

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div className="flex items-center gap-0 px-6 border-b border-border bg-muted/20 shrink-0">
        {(["record", "upload", "tts"] as AudioSubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors",
              subTab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "record" && <><Mic className="h-3 w-3" /> Record Audio</>}
            {t === "upload" && <><Upload className="h-3 w-3" /> Upload Audio</>}
            {t === "tts" && <><Sparkles className="h-3 w-3" /> Text-to-Speech</>}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {subTab === "record" && <RecordAudioSubTab orgId={orgId} onSaved={onSaved} />}
        {subTab === "upload" && <UploadAudioSubTab orgId={orgId} onSaved={onSaved} />}
        {subTab === "tts" && <TTSSubTab orgId={orgId} onSaved={onSaved} />}
      </div>
    </div>
  );
}

// ── Record Audio ─────────────────────────────────────────────────────────────

function RecordAudioSubTab({ orgId, onSaved }: { orgId: number; onSaved?: (item: MediaItem) => void }) {
  const [recordState, setRecordState] = useState<"idle" | "countdown" | "recording" | "paused" | "stopped">("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [recordings, setRecordings] = useState<{ name: string; url: string; blob: Blob; duration: number; size: number }[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedItems, setSavedItems] = useState<Record<number, boolean>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const saveMediaItem = trpc.lms.media.saveMediaItem.useMutation();

  const isRecording = recordState === "recording";

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.beginPath();
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    animFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  const startCountdown = () => {
    setCountdown(3);
    setRecordState("countdown");
    let c = 3;
    const iv = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(iv);
        startRecording();
      }
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      animFrameRef.current = requestAnimationFrame(drawWaveform);

      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        cancelAnimationFrame(animFrameRef.current);
        analyserRef.current = null;
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const dur = Math.round((Date.now() - startTimeRef.current) / 1000);
        const name = `audio-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-")}.webm`;
        setRecordings((prev) => [{ name, url, blob, duration: dur, size: blob.size }, ...prev]);
        setRecordState("stopped");
      };
      mr.start(250);
      startTimeRef.current = Date.now();
      setElapsed(0);
      setRecordState("recording");
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch (err: any) {
      toast.error(err?.message ?? "Microphone access denied");
      setRecordState("idle");
    }
  };

  const pauseRecording = () => {
    mediaRecorderRef.current?.pause();
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    setRecordState("paused");
  };

  const resumeRecording = () => {
    mediaRecorderRef.current?.resume();
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    animFrameRef.current = requestAnimationFrame(drawWaveform);
    setRecordState("recording");
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const handleSaveToLibrary = async (rec: typeof recordings[0], idx: number) => {
    setSavingIdx(idx);
    try {
      const formData = new FormData();
      formData.append("file", rec.blob, rec.name);
      formData.append("orgId", String(orgId));
      formData.append("folder", "lms-media");
      const result = await new Promise<{ key: string; url: string; fileName: string; fileSize: number; fileType: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
          else reject(new Error(`Upload failed: ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.open("POST", "/api/media-upload");
        xhr.send(formData);
      });
      const saved = await saveMediaItem.mutateAsync({
        orgId,
        fileName: result.fileName,
        mimeType: "audio/webm",
        fileSize: result.fileSize,
        fileKey: result.key,
        url: result.url,
        source: "direct",
        tags: ["audio", "recording"],
        durationSeconds: rec.duration,
      });
      setSavedItems((prev) => ({ ...prev, [idx]: true }));
      const item: MediaItem = { id: (saved as any).id, url: result.url, filename: result.fileName, mimeType: "audio/webm", fileSize: result.fileSize };
      onSaved?.(item);
      toast.success("Audio saved to Media Library");
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed");
    } finally {
      setSavingIdx(null);
    }
  };

  return (
    <div className="flex gap-0 h-full">
      {/* Main recording area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-lg font-semibold">Record Audio</h2>
          <p className="text-sm text-muted-foreground">Record your microphone directly to the Media Library</p>
        </div>

        {/* Waveform canvas */}
        <div className="w-full max-w-md h-24 rounded-2xl border border-border bg-muted/30 overflow-hidden relative">
          <canvas ref={canvasRef} className="w-full h-full" width={600} height={96} />
          {!isRecording && recordState !== "paused" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-end gap-0.5 h-8">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="w-1 rounded-full bg-muted-foreground/20" style={{ height: `${20 + Math.sin(i * 0.8) * 15}px` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timer */}
        {(isRecording || recordState === "paused") && (
          <div className="flex items-center gap-2">
            <div className={cn("h-2.5 w-2.5 rounded-full", isRecording ? "bg-red-500 animate-pulse" : "bg-yellow-500")} />
            <span className="text-2xl font-mono font-bold tabular-nums">{formatTime(elapsed)}</span>
            {recordState === "paused" && <span className="text-sm text-muted-foreground">(paused)</span>}
          </div>
        )}

        {/* Countdown overlay */}
        {recordState === "countdown" && (
          <div className="text-6xl font-bold text-primary animate-pulse">{countdown}</div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {recordState === "idle" && (
            <Button size="lg" className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30" onClick={startCountdown}>
              <Mic className="h-6 w-6" />
            </Button>
          )}
          {recordState === "countdown" && (
            <Button size="lg" variant="outline" className="h-14 w-14 rounded-full" onClick={() => setRecordState("idle")}>
              <Square className="h-5 w-5" />
            </Button>
          )}
          {recordState === "recording" && (
            <>
              <Button size="lg" variant="outline" className="h-14 w-14 rounded-full" onClick={pauseRecording}>
                <Pause className="h-5 w-5" />
              </Button>
              <Button size="lg" className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white" onClick={stopRecording}>
                <Square className="h-5 w-5 fill-current" />
              </Button>
            </>
          )}
          {recordState === "paused" && (
            <>
              <Button size="lg" className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white" onClick={resumeRecording}>
                <Play className="h-5 w-5 fill-current" />
              </Button>
              <Button size="lg" className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white" onClick={stopRecording}>
                <Square className="h-5 w-5 fill-current" />
              </Button>
            </>
          )}
          {recordState === "stopped" && (
            <Button size="lg" className="h-14 px-6 rounded-full bg-primary text-primary-foreground" onClick={() => { setRecordState("idle"); setElapsed(0); }}>
              <Mic className="h-5 w-5 mr-2" /> Record Again
            </Button>
          )}
        </div>
      </div>

      {/* Recordings list */}
      <div className="w-72 border-l border-border flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Recordings ({recordings.length})</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {recordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
              <Headphones className="h-8 w-8 opacity-30" />
              <p>No recordings yet</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recordings.map((rec, idx) => (
                <div key={idx} className="p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rec.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatTime(rec.duration)}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatFileSize(rec.size)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { const a = document.createElement("a"); a.href = rec.url; a.download = rec.name; a.click(); }}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className={cn("h-7 w-7", savedItems[idx] ? "text-teal-500" : "")}
                        onClick={() => handleSaveToLibrary(rec, idx)}
                        disabled={savingIdx === idx || !!savedItems[idx]}
                      >
                        {savingIdx === idx ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Library className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                  <audio src={rec.url} controls className="w-full mt-2 h-8" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Upload Audio ──────────────────────────────────────────────────────────────
function UploadAudioSubTab({ orgId, onSaved }: { orgId: number; onSaved?: (item: MediaItem) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedItems, setUploadedItems] = useState<MediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveMediaItem = trpc.lms.media.saveMediaItem.useMutation();
  const { enqueue } = useUploadQueue();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const maxSize = 3 * 1024 * 1024 * 1024; // 3 GB
    let queued = 0;
    Array.from(files).forEach((file) => {
      if (file.size > maxSize) { toast.error(`"${file.name}" is too large — maximum 3 GB`); return; }
      if (!file.type.startsWith("audio/")) { toast.error(`"${file.name}" is not an audio file`); return; }
      enqueue({
        file,
        orgId,
        folder: "lms-media",
        onComplete: async (result) => {
          if (!result) return;
          try {
            const saved = await saveMediaItem.mutateAsync({
              orgId,
              fileName: result.fileName,
              mimeType: result.fileType || file.type || "audio/mpeg",
              fileSize: result.fileSize,
              fileKey: result.key,
              url: result.url,
              source: "direct",
              tags: ["audio", "upload"],
            });
            const item: MediaItem = { id: (saved as any).id, url: result.url, filename: result.fileName, mimeType: result.fileType || file.type, fileSize: result.fileSize };
            setUploadedItems((prev) => [item, ...prev]);
            toast.success(`"${result.fileName}" uploaded to Media Library`);
            onSaved?.(item);
          } catch (err: any) {
            toast.error(`Failed to save "${result.fileName}": ${err?.message ?? "Unknown error"}`);
          }
        },
        onError: (message) => { toast.error(`Upload failed: ${message}`); },
      });
      queued++;
    });
    if (queued > 0) {
      toast.info(queued === 1 ? `"${files[0].name}" added to upload queue` : `${queued} audio files added to upload queue`);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
      <div>
        <h2 className="text-lg font-semibold">Upload Audio</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload audio files — they are queued and processed in the background</p>
      </div>
      <div
        className={cn(
          "border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Music className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Drop audio files here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A, OGG, WebM · Max 3 GB · Multiple files supported</p>
        </div>
      </div>
      {uploadedItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Uploaded this session</h3>
          {uploadedItems.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Music className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.filename}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(item.fileSize)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <CheckCircle className="h-4 w-4 text-teal-500" />
                  <span className="text-xs text-teal-600">Saved</span>
                </div>
              </div>
              <audio src={item.url} controls className="w-full h-8" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// ── Text-to-Speech ────────────────────────────────────────────────────────────

function TTSSubTab({ orgId, onSaved }: { orgId: number; onSaved?: (item: MediaItem) => void }) {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<"alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer">("nova");
  const [speed, setSpeed] = useState(1.0);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savedItem, setSavedItem] = useState<MediaItem | null>(null);
  const generateSpeech = trpc.lms.media.generateSpeech.useMutation();

  const handleGenerate = async () => {
    if (!text.trim()) { toast.error("Please enter some text"); return; }
    try {
      const result = await generateSpeech.mutateAsync({
        orgId,
        text: text.trim(),
        voice,
        speed,
        fileName: fileName.trim() || undefined,
      });
      setPreviewUrl(result.url);
      const item: MediaItem = { id: result.id, url: result.url, filename: result.filename, mimeType: "audio/mpeg", fileSize: result.fileSize };
      setSavedItem(item);
      onSaved?.(item);
      toast.success("Speech generated and saved to Media Library");
    } catch (err: any) {
      toast.error(err?.message ?? "Speech generation failed");
    }
  };

  const charCount = text.length;
  const maxChars = 4096;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
      <div>
        <h2 className="text-lg font-semibold">Text-to-Speech</h2>
        <p className="text-sm text-muted-foreground mt-1">Convert text to natural-sounding speech and save it to your Media Library</p>
      </div>

      {/* Text input */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Text</Label>
          <span className={cn("text-xs", charCount > maxChars * 0.9 ? "text-destructive" : "text-muted-foreground")}>
            {charCount.toLocaleString()} / {maxChars.toLocaleString()}
          </span>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxChars))}
          placeholder="Enter the text you want to convert to speech..."
          className="min-h-[160px] resize-y text-sm"
        />
      </div>

      {/* Voice & Speed controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium">Voice</Label>
          <Select value={voice} onValueChange={(v) => setVoice(v as typeof voice)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICE_OPTIONS.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{v.label}</span>
                    <span className="text-xs text-muted-foreground">{v.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Speed
            </Label>
            <span className="text-sm font-mono text-muted-foreground">{speed.toFixed(2)}×</span>
          </div>
          <Slider
            value={[speed]}
            onValueChange={([v]) => setSpeed(Math.round(v * 100) / 100)}
            min={0.25}
            max={4.0}
            step={0.05}
            className="mt-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.25× (slow)</span>
            <span>1.0× (normal)</span>
            <span>4.0× (fast)</span>
          </div>
        </div>
      </div>

      {/* File name */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium">File Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <div className="flex items-center gap-2">
          <Input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder={`tts-${voice}-...`}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground shrink-0">.mp3</span>
        </div>
      </div>

      {/* Generate button */}
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={handleGenerate}
        disabled={generateSpeech.isPending || !text.trim()}
      >
        {generateSpeech.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Generating speech...</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Generate Speech</>  
        )}
      </Button>

      {/* Preview */}
      {previewUrl && savedItem && (
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Volume2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{savedItem.filename}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(savedItem.fileSize)} · MP3 · {voice} voice · {speed}×</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <CheckCircle className="h-4 w-4 text-teal-500" />
              <span className="text-xs text-teal-600">Saved</span>
            </div>
          </div>
          <audio src={previewUrl} controls className="w-full h-8" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { const a = document.createElement("a"); a.href = previewUrl; a.download = savedItem.filename; a.click(); }}>
              <Download className="h-3.5 w-3.5" /> Download MP3
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { setPreviewUrl(null); setSavedItem(null); setText(""); setFileName(""); }}>
              <Plus className="h-3.5 w-3.5" /> Generate Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main RecordEditPage ──────────────────────────────────────────────────────

export default function RecordEditPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>("record");
  const [lastSavedItem, setLastSavedItem] = useState<MediaItem | undefined>(undefined);
  const { user } = useAuth();
  const orgId = (user as any)?.orgId ?? 1;

  const handleItemSaved = (item: MediaItem) => {
    setLastSavedItem(item);
  };

  const TABS: { id: StudioTab; label: string; icon: React.ElementType }[] = [
    { id: "record", label: "Record Video", icon: Circle },
    { id: "upload", label: "Upload Video", icon: Upload },
    { id: "edit", label: "Edit Video", icon: Scissors },
    { id: "audio", label: "Audio", icon: Headphones },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-bold">Teachific Studio™</h1>
          <p className="text-sm text-muted-foreground">Record, upload, and edit video and audio — add captions, transcripts, highlight clips, and AI-generated speech</p>
        </div>
        {lastSavedItem && (
          <div className="flex items-center gap-2 text-sm text-teal-600">
            <CheckCircle className="h-4 w-4" />
            <span>Saved to Media Library</span>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0 px-6 border-b border-border bg-background shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === "record" && (
          <RecordTab orgId={orgId} onSaved={(item) => { handleItemSaved(item); }} />
        )}
        {activeTab === "upload" && (
          <UploadTab orgId={orgId} onSaved={(item) => { handleItemSaved(item); setActiveTab("edit"); }} />
        )}
        {activeTab === "edit" && (
          <EditTab orgId={orgId} initialItem={lastSavedItem} />
        )}
        {activeTab === "audio" && (
          <AudioTab orgId={orgId} onSaved={handleItemSaved} />
        )}
      </div>
    </div>
  );
}
