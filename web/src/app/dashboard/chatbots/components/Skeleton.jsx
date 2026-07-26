/**
 * Page-local skeleton box. Visually distinct from shared/ui/skeleton.jsx
 * (different rounding + tint) — kept local so this page's loading state
 * doesn't change appearance.
 */
export default function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />;
}
