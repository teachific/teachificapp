import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, ArrowRight } from "lucide-react";
import { PLAN_LABELS, TIER_ORDER, type PlanTier } from "../../../shared/tierLimits";

interface UpgradePromptDialogProps {
  open: boolean;
  onClose: () => void;
  /** The minimum plan required to unlock this feature */
  requiredPlan: PlanTier;
  /** Short feature name, e.g. "AI Course Generation" */
  featureName: string;
  /** Optional longer description of what the feature does */
  featureDescription?: string;
}

const PLAN_COLORS: Record<PlanTier, string> = {
  free: "bg-gray-100 text-gray-700",
  starter: "bg-blue-100 text-blue-700",
  builder: "bg-purple-100 text-purple-700",
  pro: "bg-amber-100 text-amber-700",
  enterprise: "bg-emerald-100 text-emerald-700",
};

export default function UpgradePromptDialog({
  open,
  onClose,
  requiredPlan,
  featureName,
  featureDescription,
}: UpgradePromptDialogProps) {
  const planLabel = PLAN_LABELS[requiredPlan];
  const colorClass = PLAN_COLORS[requiredPlan];

  // Build upgrade path: show current required plan and anything above it
  const upgradePath = TIER_ORDER.filter(
    (t) => TIER_ORDER.indexOf(t) >= TIER_ORDER.indexOf(requiredPlan)
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">Upgrade to unlock {featureName}</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                This feature requires a{" "}
                <Badge className={`text-xs px-1.5 py-0 ${colorClass}`}>{planLabel}</Badge> plan or
                higher.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {featureDescription && (
          <p className="text-sm text-muted-foreground -mt-2 mb-2">{featureDescription}</p>
        )}

        <div className="rounded-lg border border-border bg-muted/30 p-4 flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Available on
          </p>
          <div className="flex flex-wrap gap-2">
            {upgradePath.map((tier) => (
              <Badge key={tier} className={`${PLAN_COLORS[tier]} border-0`}>
                {PLAN_LABELS[tier]}
              </Badge>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Maybe later
          </Button>
          <Button
            className="w-full sm:w-auto gap-2"
            onClick={() => {
              // Navigate to billing/upgrade page
              window.location.href = "/settings/billing";
            }}
          >
            <Zap className="h-4 w-4" />
            Upgrade Plan
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
