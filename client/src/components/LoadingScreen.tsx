import { Clapperboard } from "lucide-react";

/**
 * Full-page branded loading screen shown while auth state resolves.
 * Displays a spinning clapperboard icon and "Lights, camera, learning..." in teal.
 */
export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white gap-5">
      {/* Spinning clapperboard */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <span className="absolute inline-flex h-20 w-20 rounded-full bg-teal-400/20 animate-ping" />
        {/* Icon wrapper — spins */}
        <span
          className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-50"
          style={{ animation: "spin 1.8s linear infinite" }}
        >
          <Clapperboard className="h-8 w-8 text-teal-500" strokeWidth={1.5} />
        </span>
      </div>

      {/* Brand wordmark */}
      <div className="flex items-baseline gap-0.5 select-none">
        <span className="text-2xl font-black tracking-tight text-slate-800">teach</span>
        <span className="text-2xl font-black tracking-tight text-teal-500">ific</span>
        <span className="text-base font-black text-slate-800">™</span>
      </div>

      {/* Tagline */}
      <p
        className="text-sm font-semibold tracking-wide text-teal-500"
        style={{ animation: "pulse 2s ease-in-out infinite" }}
      >
        Lights, camera, learning…
      </p>
    </div>
  );
}
