import Image from 'next/image';
import { useState } from 'react';
import ShareModal from '@/features/sharing/ShareModal';
import ReportModal from '@/features/moderation/ReportModal';
import AddToListModal from '@/features/lists/AddToListModal';
import DeleteConfirmModal from '@/shared/ui/DeleteConfirmModal';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from '@/shared/hooks/use-toast';
import { requireLogin } from '@/shared/lib/auth-guard';
import { MoreVertical, Bookmark, Share2, ThumbsDown, EyeOff, Flag } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/shared/ui/dropdown-menu';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';

export default function BotCard({ bot, userId, onRemove }) {
    const router = useRouter();
    const { image, title, author, dialogues, time, badge, avatar } = bot;
    const [shareOpen, setShareOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [showFeedbackBadge, setShowFeedbackBadge] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // 'notInterested' | 'hideBot' | null
    const userLists = bot.userLists || [];

    const handleNotInterested = () => {
        if (!requireLogin(userId, router)) return;
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


    const handleHideBot = () => {
        if (!requireLogin(userId, router)) return;
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
        <Card
            interactive
            role="button"
            tabIndex={0}
            className="relative flex flex-col overflow-hidden p-0"
            onClick={() => router.push(`/dashboard/chat/?botId=${bot.id}`)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/dashboard/chat/?botId=${bot.id}`);
                }
            }}
        >
            {/* Image */}
            <div className="relative w-full aspect-[3/2] overflow-hidden">
                {badge && (
                    <Badge variant={badge.type} className="absolute top-2.5 left-2.5 z-10">
                        {badge.label}
                    </Badge>
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="flex shrink-0 items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-white/80 hover:bg-fuchsia-500/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Diğer seçenekler"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => setModalVisible(true)}>
                                <Bookmark className="h-4 w-4" /> Listeye Kaydet
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShareOpen(true)}>
                                <Share2 className="h-4 w-4" /> Paylaş
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleNotInterested}>
                                <ThumbsDown className="h-4 w-4" /> İlgilenmiyorum
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleHideBot}>
                                <EyeOff className="h-4 w-4" /> Bu Profili Önermeyin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setReportOpen(true)} className="text-rose-400 focus:text-rose-400">
                                <Flag className="h-4 w-4" /> Bildir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
        </Card>
    );
}
