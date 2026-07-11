import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import ShareModal from '@/features/sharing/ShareModal';
import ReportModal from '@/features/moderation/ReportModal';
import AddToListModal from '@/features/lists/AddToListModal';
import DeleteConfirmModal from '@/shared/ui/DeleteConfirmModal';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from '@/shared/hooks/use-toast';

const BADGE_CLASSES = {
    sold:     'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    produced: 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30',
    rented:   'bg-violet-500/15 text-violet-300 border border-violet-500/30',
};

export default function BotCard({ bot, userId, onRemove }) {
    const router = useRouter();
    const { image, title, author, dialogues, time, badge, avatar } = bot;
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef();
    const [shareOpen, setShareOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [showFeedbackBadge, setShowFeedbackBadge] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // 'notInterested' | 'hideBot' | null
    const userLists = bot.userLists || [];

    const handleNotInterested = () => {
        // if (!userId) { router.push('/login'); return; } // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
        setMenuOpen(false);
        setConfirmAction('notInterested');
    };

    const confirmNotInterested = async () => {
        setConfirmAction(null);
        const payload = { user_id: userId, category_id: bot?.kategori_id };
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));
        try {
            const response = await fetch('/api/social/adduninterest.php', { method: 'POST', body: formData });
            const result = JSON.parse(await response.text());
            if (result.success) { toast({ variant: "success", title: "Teşekkürler", description: "Geri bildiriminiz alındı." }); router.push("/dashboard"); }
            else toast({ variant: "destructive", title: "Bir hata oluştu", description: result.message });
        } catch (error) {
            console.error("Hata:", error);
            toast({ variant: "destructive", title: "Bağlantı hatası", description: "Sunucuyla bağlantı kurulamadı." });
        }
    };

    const toggleMenu = () => setMenuOpen(prev => !prev);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
        }
        if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const handleHideBot = (e) => {
        e.stopPropagation();
        // if (!userId) { router.push('/login'); return; } // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
        setMenuOpen(false);
        setConfirmAction('hideBot');
    };

    const confirmHideBot = async () => {
        setConfirmAction(null);
        setShowFeedbackBadge(true);
        const payload = { user_id: userId, chatbot_id: bot?.id };
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));
        try {
            const response = await fetch('/api/social/addhide.php', { method: 'POST', body: formData });
            const result = JSON.parse(await response.text());
            if (result.success) {
                toast({ variant: "success", title: "Teşekkürler", description: "Geri bildiriminiz alındı." });
                if (onRemove) onRemove(bot.id);
            } else toast({ variant: "destructive", title: "Bir hata oluştu", description: result.message });
        } catch (error) {
            console.error("Hata:", error);
            toast({ variant: "destructive", title: "Bağlantı hatası", description: "Sunucuyla bağlantı kurulamadı." });
        }
        setTimeout(() => { setShowFeedbackBadge(false); }, 2000);
    };

    return (
        <div
            className="relative flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-b from-[#111120] to-[#0D0D1A] border border-fuchsia-400/10 transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-400/25 hover:shadow-[0_8px_32px_rgba(217,70,239,0.18)]"
            onClick={() => router.push(`/dashboard/chat/?botId=${bot.id}`)}
        >
            {/* Glow blob top */}
            <div className="absolute top-0 left-0 right-0 h-[80px] pointer-events-none overflow-hidden opacity-60">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="161" viewBox="0 0 200 161" fill="none" preserveAspectRatio="xMidYTop slice">
                    <g filter="url(#bc_blur)">
                        <ellipse cx="101.044" cy="-4.511" rx="69.328" ry="40.867" fill="url(#bc_grad)" />
                    </g>
                    <defs>
                        <filter id="bc_blur" x="-92" y="-169" width="386" height="329" filterUnits="userSpaceOnUse">
                            <feGaussianBlur stdDeviation="61.873" result="blur" />
                        </filter>
                        <linearGradient id="bc_grad" x1="31.7" y1="-4.5" x2="170.4" y2="-4.5" gradientUnits="userSpaceOnUse">
                            <stop offset="0.21" stopColor="#C026D3" />
                            <stop offset="0.79" stopColor="#8B5CF6" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Image */}
            <div className="relative w-full aspect-[3/2] overflow-hidden">
                {badge && (
                    <span className={cn(
                        'absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md text-[10px] font-semibold font-display tracking-wide',
                        BADGE_CLASSES[badge.type] ?? 'bg-white/10 text-white/80 border border-transparent',
                    )}>
                        {badge.label}
                    </span>
                )}
                <Image src={image} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 300px" />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-2 px-3.5 py-3">
                <div className="flex items-start justify-between gap-2">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden border border-fuchsia-400/20">
                            <Image src={avatar} alt="Avatar" width={32} height={32} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[15px] font-semibold text-white/90 leading-snug truncate">{title}</p>
                            <p className="text-[13px] text-white/45 truncate">{author}</p>
                        </div>
                    </div>

                    {/* Context menu trigger */}
                    <div className="relative shrink-0" ref={menuRef}>
                        <button
                            className="flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-white/80 hover:bg-fuchsia-500/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={(e) => { e.stopPropagation(); toggleMenu(); }}
                            aria-label="Diğer seçenekler"
                        >
                            <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor">
                                <path d="M9 12.4a1.4 1.4 0 1 1 0 2.8A1.4 1.4 0 0 1 9 12.4ZM9 7.5a1.4 1.4 0 1 1 0 2.8A1.4 1.4 0 0 1 9 7.5ZM9 2.6a1.4 1.4 0 1 1 0 2.8A1.4 1.4 0 0 1 9 2.6Z" />
                            </svg>
                        </button>

                        {menuOpen && (
                            <div
                                className="absolute right-0 top-8 z-50 min-w-[180px] rounded-xl border border-fuchsia-400/12 bg-[#0E0E22] shadow-[0_8px_32px_rgba(0,0,0,0.55)] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MenuItem onClick={() => { setModalVisible(true); setMenuOpen(false); }} icon="📑">Listeye Kaydet</MenuItem>
                                <MenuItem onClick={() => { setShareOpen(true); setMenuOpen(false); }} icon="↗">Paylaş</MenuItem>
                                <div className="h-px bg-fuchsia-400/10 mx-2" />
                                <MenuItem onClick={handleNotInterested} icon="👎">İlgilenmiyorum</MenuItem>
                                <MenuItem onClick={handleHideBot} icon="—">Bu Profili Önermeyin</MenuItem>
                                <MenuItem onClick={(e) => { e.stopPropagation(); setReportOpen(true); setMenuOpen(false); }} icon="⚠" danger>Bildir</MenuItem>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-[12.5px] text-white/38 leading-none">
                    {dialogues} Diyalog · {time} önce yayımlandı
                </p>
            </div>

            <ShareModal isOpen={shareOpen} urlId={bot.id} onClose={() => setShareOpen(false)} />
            <ReportModal isOpen={reportOpen} repId={bot.id} onClose={() => setReportOpen(false)} />
            <AddToListModal userId={userId} botId={bot.id} isOpen={modalVisible} onClose={() => setModalVisible(false)} lists={userLists} />

            <DeleteConfirmModal
                isOpen={confirmAction === 'notInterested'}
                onClose={() => setConfirmAction(null)}
                onConfirm={confirmNotInterested}
                title="İlgilenmiyor musunuz?"
                description="Bu kategoriyle ilgilenmediğinizi bildirmek istediğinize emin misiniz? Bu kategorideki içerikleri artık daha az göreceksiniz."
                confirmLabel="Onayla"
            />
            <DeleteConfirmModal
                isOpen={confirmAction === 'hideBot'}
                onClose={() => setConfirmAction(null)}
                onConfirm={confirmHideBot}
                title="Bu profili gizle"
                description="Bu botu bir daha size önermeyeceğiz. Onaylıyor musunuz?"
                confirmLabel="Onayla"
            />

            {showFeedbackBadge && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-fuchsia-600 text-white text-xs font-semibold shadow-glow whitespace-nowrap">
                    Uyarınız alındı
                </div>
            )}
        </div>
    );
}

function MenuItem({ onClick, icon, danger, children }) {
    return (
        <button
            className={cn(
                'flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13.5px] transition-colors text-left',
                danger ? 'text-rose-400 hover:bg-rose-500/10' : 'text-white/75 hover:bg-fuchsia-500/10 hover:text-white',
            )}
            onClick={onClick}
        >
            <span className="w-4 text-center opacity-70">{icon}</span>
            {children}
        </button>
    );
}
