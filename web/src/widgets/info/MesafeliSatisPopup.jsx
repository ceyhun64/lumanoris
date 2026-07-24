'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';

export default function TermsOfSalePopup({ onClose }) {
    const [info, setInfo] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchInfo() {
            try {
                const res = await fetch("/api/content/gettermsofsale.php");
                const resultText = await res.text();
                const result = JSON.parse(resultText);
                setInfo(result.satis_kosullari);
            } catch (err) {
                console.error("Error:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchInfo();
    }, []);

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex max-h-[80vh] max-w-[900px] flex-col overflow-hidden bg-luma-elevated border-transparent p-0">
                <DialogTitle className="shrink-0 px-6 pb-3 pt-6 text-title-sm">Teslimat ve İade Koşulları</DialogTitle>

                {/* API'den gelen HTML içeriği burada render ediliyor */}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 [&_h1]:mb-2.5 [&_h1]:text-[1.4em] [&_h1]:font-bold [&_h1]:text-white [&_h2]:mt-5 [&_h2]:text-[1.1em] [&_h2]:font-bold [&_h2]:text-fuchsia-400 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-white [&_li]:mb-2 [&_li]:text-[0.95em] [&_p]:mb-2.5 [&_p]:text-[0.95em] [&_p]:leading-relaxed [&_p]:text-white/65 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-9 [&_ul]:text-white/65">
                    {isLoading ? (
                        <p className="text-sm text-white/50">Yükleniyor...</p>
                    ) : (
                        <div dangerouslySetInnerHTML={{ __html: info }} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
