import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import ShareModal from '@/features/sharing/ShareModal';
import ReportModal from '@/features/moderation/ReportModal';
import AddToListModal from '@/features/lists/AddToListModal';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const BADGE_CLASSES = {
    sold:     'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    produced: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    rented:   'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
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
    const userLists = bot.userLists || [];

    const handleNotInterested = async () => {
        if (!userId) { router.push('/login'); return; }
        const isConfirmed = window.confirm("Bu kategoriyle ilgilenmediğinizi bildirmek istediğinize emin misiniz? Bu kategorideki içerikleri artık daha az göreceksiniz.");
        if (!isConfirmed) return;
        const payload = { user_id: userId, category_id: bot?.kategori_id };
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));
        try {
            const response = await fetch('/api/social/adduninterest.php', { method: 'POST', body: formData });
            const result = JSON.parse(await response.text());
            if (result.success) { alert("Geri bildiriminiz alındı, teşekkür ederiz."); router.push("/dashboard"); }
            else alert("Bir hata oluştu: " + result.message);
        } catch (error) {
            console.error("Hata:", error);
            alert("Sunucuyla bağlantı kurulamadı.");
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

    const handleHideBot = async (e) => {
        e.stopPropagation();
        if (!userId) { router.push('/login'); return; }
        setShowFeedbackBadge(true);
        setMenuOpen(false);
        const isConfirmed = window.confirm("Bu botu bir daha size önermeyeceğiz. Onaylıyor musunuz?");
        if (!isConfirmed) return;
        const payload = { user_id: userId, chatbot_id: bot?.id };
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));
        try {
            const response = await fetch('/api/social/addhide.php', { method: 'POST', body: formData });
            const result = JSON.parse(await response.text());
            if (result.success) {
                alert("Geri bildiriminiz alındı, teşekkür ederiz.");
                setShowFeedbackBadge(false);
                if (onRemove) onRemove(bot.id);
            } else alert("Bir hata oluştu: " + result.message);
        } catch (error) {
            console.error("Hata:", error);
            alert("Sunucuyla bağlantı kurulamadı.");
        }
        setTimeout(() => { setShowFeedbackBadge(false); onRemove?.(); }, 2000);
    };

    return (
        <div
            className="relative flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-b from-[#111120] to-[#0D0D1A] border border-indigo-400/10 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/25 hover:shadow-[0_8px_32px_rgba(99,102,241,0.18)]"
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
                            <stop offset="0.21" stopColor="#4F46E5" />
                            <stop offset="0.79" stopColor="#06B6D4" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Image */}
            <div className="relative w-full aspect-[3/2] overflow-hidden">
                {badge && (
                    <span className={cn(
                        'absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md text-[10px] font-semibold font-display tracking-wide',
                        BADGE_CLASSES[badge.type] ?? 'bg-white/10 text-white/80 border border-white/15',
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
                        <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden border border-indigo-400/20">
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
                            className="flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-white/80 hover:bg-indigo-500/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={(e) => { e.stopPropagation(); toggleMenu(); }}
                            aria-label="Diğer seçenekler"
                        >
                            <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor">
                                <path d="M9 12.4a1.4 1.4 0 1 1 0 2.8A1.4 1.4 0 0 1 9 12.4ZM9 7.5a1.4 1.4 0 1 1 0 2.8A1.4 1.4 0 0 1 9 7.5ZM9 2.6a1.4 1.4 0 1 1 0 2.8A1.4 1.4 0 0 1 9 2.6Z" />
                            </svg>
                        </button>

                        {menuOpen && (
                            <div
                                className="absolute right-0 top-8 z-50 min-w-[180px] rounded-xl border border-indigo-400/12 bg-[#0E0E22] shadow-[0_8px_32px_rgba(0,0,0,0.55)] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MenuItem onClick={() => { setModalVisible(true); setMenuOpen(false); }} icon="📑">Listeye Kaydet</MenuItem>
                                <MenuItem onClick={() => { setShareOpen(true); setMenuOpen(false); }} icon="↗">Paylaş</MenuItem>
                                <div className="h-px bg-indigo-400/10 mx-2" />
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

            {showFeedbackBadge && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-glow whitespace-nowrap">
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
                danger ? 'text-rose-400 hover:bg-rose-500/10' : 'text-white/75 hover:bg-indigo-500/10 hover:text-white',
            )}
            onClick={onClick}
        >
            <span className="w-4 text-center opacity-70">{icon}</span>
            {children}
        </button>
    );
}
