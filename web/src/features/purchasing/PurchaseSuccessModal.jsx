"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { ShoppingCart, Check } from 'lucide-react';

export default function PurchaseSuccessModal({ isOpen, onClose, chatbotName = "Travel Planner AI", orderId }) {
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            // 5 saniye sonra otomatik olarak chatbotlarım sayfasına yönlendir
            const timer = setTimeout(() => {
                router.push('/dashboard/chatbots');
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [isOpen, router]);

    const handleView = () => {
        router.push('/dashboard/chatbots');
    };

    const handleCancel = () => {
        router.push('/dashboard/checkout-empty');
    };

    const handleClose = () => {
        router.push('/dashboard/checkout-empty');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-[440px] overflow-hidden border-transparent bg-luma-card p-0">
                <div className="border-b border-white/10 px-6 py-4">
                    <DialogTitle className="text-base font-semibold text-white">
                        Satın Alma Başarılı
                    </DialogTitle>
                </div>
                <div className="flex flex-col items-center p-6 pt-8 text-center">
                    <div className="relative mb-4 flex h-20 w-20 items-center justify-center" aria-hidden="true">
                        <ShoppingCart className="h-16 w-16 text-emerald-400" strokeWidth={1.5} />
                        <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                            <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                    </div>
                    <p className="mb-2.5 font-display text-xl font-bold text-emerald-400">
                        Satın Alma Başarılı
                    </p>
                    <DialogDescription className="mb-1 font-display text-[15px] font-semibold text-white">
                        {chatbotName} sohbetin aktif hale getirildi.
                    </DialogDescription>
                    <p className="mb-6 text-[14px] text-white/55">
                        Sahip olduğun chatbotlar arasında görüntüleyebilirsin.
                    </p>
                    {orderId && (
                        <p className="mb-6 -mt-4 font-mono text-[13px] text-white/60">
                            Sipariş No: <span className="text-white/85">{orderId}</span>
                        </p>
                    )}
                    <div className="grid w-full grid-cols-2 gap-3">
                        <button
                            onClick={handleCancel}
                            className="rounded-xl border border-transparent bg-white/10 px-3 py-3 font-display text-[15px] font-medium text-white transition-all duration-200 hover:border-transparent hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleView}
                            className="rounded-xl border border-transparent bg-emerald-500 px-3 py-3 font-display text-[15px] font-semibold text-white transition-all duration-200 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Görüntüle
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
