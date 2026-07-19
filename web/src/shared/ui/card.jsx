import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef(({ className, interactive = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // rounded-2xl (not the shadcn-default rounded-xl) because that's what
      // every hand-rolled "card" div in this app already converged on
      // (ChatbotCard, wallet balance card, MarketplaceListCard, following
      // list items) — codifying the de facto standard rather than fighting
      // it on every migration.
      "rounded-2xl border border-fuchsia-400/10 bg-gradient-card text-white shadow-card transition-all duration-250",
      // `interactive` codifies the "clickable card" hover treatment that was
      // independently hand-copied (with tiny drifting variations in the
      // lift amount / glow color / duration) into ChatbotCard, following's
      // list items, MarketplaceListCard and others — one lift+glow now, not
      // N slightly-different ones.
      interactive && "cursor-pointer border-transparent hover:-translate-y-0.5 hover:border-fuchsia-400/22 hover:shadow-[0_6px_24px_rgba(217,70,239,0.13)]",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-display font-semibold leading-none tracking-tight text-white", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-fuchsia-300/65", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-5 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
