'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Checkbox } from '@/shared/ui/checkbox';
import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/hooks/use-toast';

export default function VoiceModal({ isOpen, onClose, onConfirm }) {
    const [doNotShowAgain, setDoNotShowAgain] = useState(false);

    const handleConfirm = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            onConfirm(); // sadece izin verildiğini bildir
            onClose();
        } catch (error) {
            toast({ variant: "destructive", title: "Mikrofon izni reddedildi." });
            console.error(error);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[440px] bg-luma-card border-transparent p-6 text-center">
                <div className="flex flex-col items-center">
                    <div className="mb-3 text-fuchsia-400" aria-hidden="true">
                        <svg width="70" height="70" viewBox="0 0 81 81" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <mask id="mask0_7772_14507" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="11" y="3" width="59" height="75">
                                <path d="M52.3125 18.5625C52.3125 12.0386 47.0239 6.75 40.5 6.75C33.9761 6.75 28.6875 12.0386 28.6875 18.5625V40.5C28.6875 47.0239 33.9761 52.3125 40.5 52.3125C47.0239 52.3125 52.3125 47.0239 52.3125 40.5V18.5625Z" fill="#555555" stroke="white" strokeWidth="6.75" strokeLinejoin="round" />
                                <path d="M15.1875 38.8125C15.1875 52.7918 26.5207 64.125 40.5 64.125M40.5 64.125C54.4793 64.125 65.8125 52.7918 65.8125 38.8125M40.5 64.125V74.25" stroke="white" strokeWidth="6.75" strokeLinecap="round" strokeLinejoin="round" />
                            </mask>
                            <g mask="url(#mask0_7772_14507)">
                                <path d="M0 0H81V81H0V0Z" fill="currentColor" />
                            </g>
                        </svg>
                    </div>

                    <DialogTitle className="mb-2.5 text-xl font-semibold text-fuchsia-400">
                        Bu sohbete bir sesli mesaj göndermek üzeresiniz.
                    </DialogTitle>
                    <DialogDescription className="mb-8 font-display text-body-lg font-semibold leading-relaxed text-white">
                        Devam etmek istiyor musunuz?
                    </DialogDescription>

                    <div className="grid w-full grid-cols-2 gap-3">
                        <Button
                            onClick={onClose}
                            variant="secondary"
                            className="h-auto border-transparent bg-white/10 py-3 text-body-lg hover:border-transparent hover:bg-white/18"
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            variant="outline"
                            className="h-auto border-fuchsia-400 bg-fuchsia-400/10 py-3 text-body-lg text-fuchsia-400 hover:border-fuchsia-300 hover:bg-fuchsia-400/20 hover:text-fuchsia-300"
                        >
                            Devam Et
                        </Button>
                    </div>

                    <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-white/70">
                        <Checkbox
                            checked={doNotShowAgain}
                            onCheckedChange={() => setDoNotShowAgain(prev => !prev)}
                        />
                        Tekrar Gösterme
                    </label>
                </div>
            </DialogContent>
        </Dialog>
    );
}
