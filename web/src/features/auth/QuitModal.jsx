'use client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';

export default function QuitModal({ isOpen, onClose, onConfirm }) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[440px] bg-luma-card border-transparent p-6 text-center">
                <div className="flex flex-col items-center">
                    <div className="mb-3 text-rose-500" aria-hidden="true">
                        <svg width="90" height="90" viewBox="0 0 117 117" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path opacity="0.5" d="M58.5 97.5C48.1566 97.5 38.2368 93.3911 30.9228 86.0772C23.6089 78.7632 19.5 68.8434 19.5 58.5C19.5 48.1566 23.6089 38.2368 30.9228 30.9228C38.2368 23.6089 48.1566 19.5 58.5 19.5V97.5Z" fill="currentColor" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M80.2912 41.2919C79.6066 41.9775 79.222 42.9068 79.222 43.8757C79.222 44.8446 79.6066 45.7739 80.2912 46.4594L88.6763 54.8444H48.75C47.7803 54.8444 46.8503 55.2297 46.1646 55.9153C45.479 56.601 45.0938 57.531 45.0938 58.5007C45.0938 59.4704 45.479 60.4004 46.1646 61.086C46.8503 61.7717 47.7803 62.1569 48.75 62.1569H88.6763L80.2912 70.5419C79.932 70.8767 79.6439 71.2803 79.4441 71.7288C79.2442 72.1773 79.1368 72.6615 79.1281 73.1524C79.1195 73.6433 79.2098 74.131 79.3937 74.5862C79.5775 75.0415 79.8512 75.4551 80.1984 75.8022C80.5456 76.1494 80.9592 76.4231 81.4145 76.607C81.8697 76.7909 82.3574 76.8812 82.8483 76.8726C83.3392 76.8639 83.8234 76.7565 84.2719 76.5566C84.7204 76.3568 85.124 76.0687 85.4588 75.7094L100.084 61.0844C100.768 60.3989 101.153 59.4696 101.153 58.5007C101.153 57.5318 100.768 56.6025 100.084 55.9169L85.4588 41.2919C84.7732 40.6072 83.8439 40.2227 82.875 40.2227C81.9061 40.2227 80.9768 40.6072 80.2912 41.2919Z" fill="currentColor" />
                        </svg>
                    </div>
                    <DialogTitle className="mb-2.5 text-xl font-semibold text-rose-500">
                        Çıkış yapmayı onaylıyor musunuz?
                    </DialogTitle>
                    <DialogDescription className="mb-8 font-display text-body-lg font-semibold leading-relaxed text-white">
                        Oturumunuz kapatılacak ve giriş ekranına yönlendirileceksiniz.
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
                            Çıkış Yap
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
