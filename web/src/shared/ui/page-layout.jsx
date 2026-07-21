import { cn } from "@/lib/utils";

/**
 * The single layout system every standard dashboard page is built on.
 * PageLayout (container) + PageHeader (eyebrow/title/description/action) +
 * PageSection (vertical rhythm between content blocks) + CardGrid/StatGrid
 * (card dispositions) — a new page composes these instead of re-deriving
 * padding/spacing/grid values by hand. Pages with a genuinely different
 * composition (Chat has no page-title concept; the checkout flow hides the
 * sidebar at the layout level) are deliberate exceptions and don't use this.
 */

function PageLayout({ children, className }) {
  return (
    <div className={cn("flex h-full w-full flex-col px-4 py-6 text-white md:px-16", className)}>
      {children}
    </div>
  );
}

/**
 * eyebrow: small uppercase label above the title (e.g. "Finans").
 * title: the page's h1.
 * description: optional one-line subtitle under the title.
 * action: optional node rendered on the right, bottom-aligned with the title
 *   block (a button, a count pill, a filter dropdown — whatever the page's
 *   one primary right-side affordance is).
 * children: optional extra content rendered under the description but still
 *   inside the header's bottom margin (e.g. History's inline search field).
 */
function PageHeader({ eyebrow, eyebrowClassName, title, description, action, children, className }) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <span className={cn("mb-1.5 block text-[11px] font-display font-semibold uppercase tracking-[0.14em] text-fuchsia-400/70", eyebrowClassName)}>
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-md text-[13.5px] text-white/45">{description}</p>
        )}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Wraps one content block below the header. Consecutive PageSections get a
 * consistent 24px gap between them via an adjacent-sibling selector, so the
 * last section never carries a trailing margin and a page with only one
 * section needs no special-casing.
 */
function PageSection({ children, className }) {
  return <div className={cn("[&+&]:mt-6", className)}>{children}</div>;
}

/** Standard card grid — chatbot cards, list items, anything in a browse grid. */
function CardGrid({ children, className }) {
  return (
    <div className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}

/** Standard metric-tile row (StatCard grid) — 2-up on mobile, 4-up at sm+. */
function StatGrid({ children, className }) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-4", className)}>
      {children}
    </div>
  );
}

export { PageLayout, PageHeader, PageSection, CardGrid, StatGrid };
