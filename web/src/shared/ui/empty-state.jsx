import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";

/**
 * Reusable empty-state pattern: icon + headline + description + optional action.
 * Replaces hand-rolled empty screens so every "nothing here yet" state looks
 * and feels the same across the app.
 */
function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6 gap-3",
        className
      )}
    >
      {Icon && (
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500/15 to-violet-500/10 border border-fuchsia-400/15 mb-1">
          <Icon className="w-6 h-6 text-fuchsia-300/80" strokeWidth={1.75} />
        </div>
      )}
      {title && (
        <h3 className="text-body-lg font-display font-semibold text-white/85">{title}</h3>
      )}
      {description && (
        <p className="text-body-sm text-luma-muted max-w-[320px] leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
