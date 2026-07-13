'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';

export default function AddToListModalEmpty({ isOpen, onClose, onCreate, header = "Yeni Liste Oluştur" }) {
    const [newListName, setNewListName] = useState('');

    const handleSubmit = () => {
        const trimmed = newListName.trim();
        if (trimmed) {
            onCreate(trimmed);
            setNewListName('');
        }
    };

    useEffect(() => {
        if (isOpen) setNewListName('');
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[450px] bg-luma-card border-transparent p-6 text-center">
                <DialogTitle className="mb-1 text-[16px]">{header}</DialogTitle>
                <DialogDescription className="mb-5 text-left font-sans text-[14px] font-normal leading-6 text-white">
                    Yeni bir liste oluşturmak için isim girin.
                </DialogDescription>

                <div className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-luma-input px-5 py-4">
                    <input
                        type="text"
                        placeholder="Liste adı"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                        className="flex-1 bg-transparent font-display text-[15px] text-white placeholder:text-white/40 focus:outline-none"
                    />
                    <button
                        onClick={handleSubmit}
                        className="flex items-center justify-center rounded-lg p-1 text-fuchsia-400 transition-colors hover:bg-fuchsia-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Liste oluştur"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex justify-between gap-6">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        className="h-auto min-w-[120px] flex-1 border border-transparent bg-white/[0.06] py-3 text-[16px] hover:bg-white/[0.1]"
                    >
                        İptal
                    </Button>
                    <Button onClick={handleSubmit} className="h-auto min-w-[120px] flex-1 py-3 text-[16px]">
                        Kaydet
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
