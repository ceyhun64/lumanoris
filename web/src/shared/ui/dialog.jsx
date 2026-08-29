"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * TASMA KURALLARI — her iki içerik varyantı da bunları taşır:
 *
 *   • Genişlik: `w-full` viewport'un tamamını kaplıyordu, yani dar ekranda
 *     kutu iki kenara da yapışıyordu. `calc(100vw-2rem)` her iki yanda
 *     1rem pay bırakır; `max-w-*` ile birlikte çalışır.
 *   • Yükseklik: hiçbir tavan yoktu. Uzun içerik (sözleşme metinleri, uzun
 *     form, uzun liste) viewport'u aşıyor ve kaydırılamıyordu — üst/alt
 *     kısımlara hiç ulaşılamıyordu. Artık `calc(100dvh-2rem)` tavanı ve
 *     kendi içinde dikey kaydırma var.
 *   • `overscroll-contain`: modalın sonuna gelince kaydırma arkadaki
 *     sayfaya sıçramasın.
 *
 * Kendi `max-h`/`overflow` sınıfını veren çağrı yerleri (ör. sözleşme
 * popup'ları) tailwind-merge sayesinde bunları geçersiz kılmaya devam eder.
 */
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-[calc(100vw-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] translate-x-[-50%] translate-y-[-50%] overflow-y-auto overscroll-contain gap-4 rounded-2xl border border-transparent bg-luma-elevated p-6 shadow-modal duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring">
        <X className="h-4 w-4" />
        <span className="sr-only">Kapat</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * Kendi kutusunu ve kapatma düğmesini getiren modaller için gövdesiz varyant:
 * yalnızca portal + overlay + ortalama sağlar, görsel kabuk çağırana ait.
 *
 * Neden gerekli: elle yazılmış `fixed inset-0` bir overlay, sayfa ağacının
 * içinde kaldığı için üstündeki her stacking context'e ve scroll kutusuna
 * bağımlı — tam sayfayı kapladığı garanti değil. Portal ile overlay her zaman
 * document.body'ye çıkar; ayrıca Esc, dışarı tıklama, odak tuzağı ve arka plan
 * kaydırma kilidi bedava gelir.
 */
const DialogContentBare = React.forwardRef(
  ({ className, overlayClassName, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay className={cn("bg-black/80 backdrop-blur-md", overlayClassName)} />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] translate-x-[-50%] translate-y-[-50%] overflow-y-auto overscroll-contain focus:outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  ),
);
DialogContentBare.displayName = "DialogContentBare";

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-display font-semibold leading-none tracking-tight text-white", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-fuchsia-300/65", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger,
  DialogContent, DialogContentBare, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
};
