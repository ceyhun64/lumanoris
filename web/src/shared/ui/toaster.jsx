"use client";
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import {
  Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport,
} from "@/shared/ui/toast";

const VARIANT_ICONS = {
  success: CheckCircle2,
  destructive: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        const Icon = VARIANT_ICONS[variant];
        return (
          <Toast key={id} variant={variant} {...props}>
            {Icon && (
              <Icon
                data-toast-icon
                className={`h-5 w-5 shrink-0 mt-0.5 ${variant === "loading" ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            )}
            <div className="grid gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
