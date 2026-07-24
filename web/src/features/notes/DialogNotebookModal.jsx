"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/hooks/use-toast';

export default function DialogNotebookModal({ userId, botId, inputMessage, outputMessage, isOpen, onClose, onPublish }) {
    const [title, setTitle] = useState("");
    const [showFeedback, setShowFeedback] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Çift tıklamayı önlemek için

    const handlePublish = async () => {
        if (!title.trim() || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const payload = {
                user_id: userId,
                chatbot_id: botId,
                name: title,
                input_message: inputMessage,
                output_message: outputMessage,
                // gerekirse diğer alanları da ekle
            };

            const formData = new FormData();
            formData.append("data", JSON.stringify(payload));

            const res = await fetch("/api/note/adddialogbook.php", {
                method: "POST",
                body: formData
            });

            const restext = await res.text();
            const result = JSON.parse(restext);

             if (result.success) {
                if (onPublish) onPublish(title);
                setTitle("");
                setShowFeedback(true);
                setTimeout(() => {
                    setShowFeedback(false);
                    onClose();
                }, 1800);
            } else {
                toast({ variant: "destructive", title: "Hata", description: result.message });
            }
        }
        catch (err) {
            console.error("Yayınlama hatası:", err);
            toast({ variant: "destructive", title: "Bir hata oluştu." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Feedback Badge */}
            {showFeedback && (
                <div className="fixed bottom-6 right-6 px-3 py-1.5 rounded-lg bg-fuchsia-400 text-white text-body-sm font-medium pointer-events-none z-[999999] animate-[fadeInOut_2s_ease_forwards]">
                    Başarıyla yayınlandı ✅
                </div>
            )}

            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-[450px] bg-luma-card border-transparent p-6 text-center">
                    <DialogTitle className="mb-1 text-title-sm">Diyalog Defterine Ekle</DialogTitle>
                    <DialogDescription className="mb-5 text-left font-sans text-body font-normal leading-6 text-white">
                        Diyaloğunuza uygun bir başlık belirleyin ve Diyalog Defteri sayfasında bu içeriği diğer insanlarla paylaşın.
                    </DialogDescription>
                    <div className="mb-6 flex w-full items-center justify-center rounded-xl bg-luma-input px-5 py-4">
                        <input
                            type="text"
                            placeholder="Diyalog başlığı"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent font-display text-body-lg text-white placeholder:text-white/40 focus:outline-none"
                        />
                    </div>
                    <div className="flex justify-between gap-6">
                        <Button
                            onClick={onClose}
                            variant="secondary"
                            className="h-auto min-w-[120px] flex-1 border border-transparent bg-white/[0.06] py-3 text-title-sm hover:bg-white/[0.1]"
                        >
                            İptal
                        </Button>
                        <Button onClick={handlePublish} className="h-auto min-w-[120px] flex-1 py-3 text-title-sm">
                            Yayınla
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
