'use client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';

export default function BlockModal({ isOpen, onClose, onConfirm }) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[440px] bg-luma-card border-transparent p-6 text-center">
                <div className="flex flex-col items-center">
                    <div className="mb-3 text-rose-500" aria-hidden="true">
                        <svg width="80" height="81" viewBox="0 0 98 99" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M49 0.75C22.09 0.75 0.25 22.59 0.25 49.5C0.25 76.41 22.09 98.25 49 98.25C75.91 98.25 97.75 76.41 97.75 49.5C97.75 22.59 75.91 0.75 49 0.75ZM10 49.5C10 27.9525 27.4525 10.5 49 10.5C58.0187 10.5 66.3063 13.5713 72.8875 18.7388L18.2388 73.3875C12.8842 66.5781 9.98163 58.1625 10 49.5ZM49 88.5C39.9813 88.5 31.6938 85.4287 25.1125 80.2612L79.7612 25.6125C85.1158 32.4218 88.0184 40.8375 88 49.5C88 71.0475 70.5475 88.5 49 88.5Z" fill="currentColor" />
                        </svg>
                    </div>
                    <DialogTitle className="mb-2.5 text-xl font-semibold text-rose-500">
                        Engellemeyi Onaylıyor musunuz?
                    </DialogTitle>
                    <DialogDescription className="mb-8 font-display text-body-lg font-semibold leading-relaxed text-white">
                        Bu kullanıcıyı engellediğinizde artık size mesaj gönderemeyecek. Devam etmek istiyor musunuz?
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
                            onClick={onConfirm}
                            variant="outline"
                            className="h-auto border-rose-500 bg-rose-500/10 py-3 text-body-lg text-rose-500 hover:border-rose-400 hover:bg-rose-500/20 hover:text-rose-400"
                        >
                            Engelle
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
