"use client";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import ShareModal from "@/features/sharing/ShareModal";
import { useEffect, useRef, useState } from "react";
import CommentModal from "@/features/comments/CommentModal";
import AddToSaleListModal from "@/features/chatbot-mgmt/AddToSaleListModal";
import DeleteConfirmModal from "@/shared/ui/DeleteConfirmModal";
import PublishModal from "@/features/chatbot-mgmt/PublishModal";
import BuyModal from "@/features/purchasing/BuyModal";
import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, MessageSquare, Share2 } from "lucide-react";

export default function ChatbotCard({ id, userId, authorUserId, ownerUserId, isIndependent, title, image, likes, dislikes, comments, dialogs, status, sellerStatus, profileImage, category, weeklyPrice, monthlyPrice, onDelete, onChanged }) {
    const isInactiveSeller = !isIndependent && sellerStatus && sellerStatus !== 'active';
    const isOwn = String(authorUserId) === String(userId);
    const isPurchased = !isOwn && String(ownerUserId) === String(userId);
    const router = useRouter();
    const [shareOpen, setShareOpen] = useState(false);
    const [commentOpen, setCommentOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [publishOpen, setPublishOpen] = useState(false);
    const [unpublishConfirmOpen, setUnpublishConfirmOpen] = useState(false);
    const [buyOpen, setBuyOpen] = useState(false);
    const [cardMenuOpen, setCardMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [likeCount, setLikeCount] = useState(likes || 0);
    const [dislikeCount, setDislikeCount] = useState(dislikes || 0);
    const [commentCount, setCommentCount] = useState(comments || 0);
    const [commentList, setCommentList] = useState([]);

    const handleLike = async (e) => {
        e.stopPropagation();
        try {
            const res = await fetch("/api/social/likechatbot.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ data: JSON.stringify({ user_id: userId, chatbot_id: id }) }),
            });
            const result = await res.json();
            if (result.success) {
                if (result.action === "liked") {
                    setLiked(true); setLikeCount(p => p + 1);
                    if (disliked) { setDisliked(false); setDislikeCount(p => p - 1); }
                } else if (result.action === "unliked") {
                    setLiked(false); setLikeCount(p => p - 1);
                }
            }
        } catch (err) { console.error("Like API error:", err); }
    };

    const handleDislike = async (e) => {
        e.stopPropagation();
        try {
            const res = await fetch("/api/social/dislikechatbot.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ data: JSON.stringify({ user_id: userId, chatbot_id: id }) }),
            });
            const result = await res.json();
            if (result.success) {
                if (result.action === "disliked") {
                    setDisliked(true); setDislikeCount(p => p + 1);
                    if (liked) { setLiked(false); setLikeCount(p => p - 1); }
                } else if (result.action === "undisliked") {
                    setDisliked(false); setDislikeCount(p => p - 1);
                }
            }
        } catch (err) { console.error("Dislike API error:", err); }
    };

    useEffect(() => {
        if (!id) return;
        // Both endpoints read $_GET (session provides identity) — previously
        // sent as a POST body, so $_GET was always empty and the "did I
        // already react" check never resolved.
        const checkLike = async () => {
            try {
                const res = await fetch(`/api/social/diduserlike.php?chatbot_id=${id}`);
                const result = await res.json();
                if (result.success) setLiked(result.didLike);
            } catch (err) { console.error("diduserlike API error:", err); }
        };
        const checkDislike = async () => {
            try {
                const res = await fetch(`/api/social/diduserdislike.php?chatbot_id=${id}`);
                const result = await res.json();
                if (result.success) setDisliked(result.didDisLike);
            } catch (err) { console.error("diduserdislike API error:", err); }
        };
        checkLike();
        checkDislike();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/social/getchatbotcomments.php?chatbot_id=${id}`)
            .then(r => r.json())
            .then(data => setCommentList(data.comments || []))
            .catch(err => console.error("Yorumlar alınamadı:", err));
    }, [id]);

    const handleUnpublish = async () => {
        try {
            const res = await fetch('/api/chatbot/unpublishchatbot.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ data: JSON.stringify({ id, user_id: userId }) }),
            });
            const result = await res.json();
            if (result.success) { if (onChanged) onChanged(); }
            else alert(result.message);
        } catch (err) { alert('Yayından kaldırma hatası: ' + err.message); }
        setUnpublishConfirmOpen(false);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) setCardMenuOpen(false);
        }
        if (cardMenuOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [cardMenuOpen]);

    return (
        <>
            <div
                role="button"
                tabIndex={0}
                className={cn(
                    'relative flex items-stretch gap-0 rounded-2xl overflow-hidden cursor-pointer',
                    'bg-gradient-to-r from-[#111120] to-[#0D0D1A]',
                    'border border-fuchsia-400/10 transition-all duration-300',
                    'hover:-translate-y-0.5 hover:border-fuchsia-400/22 hover:shadow-[0_6px_24px_rgba(217,70,239,0.13)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base',
                    isInactiveSeller ? 'opacity-70 saturate-50' : '',
                )}
                onClick={() => router.push('/dashboard/chat?botId=' + id)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push('/dashboard/chat?botId=' + id);
                    }
                }}
            >
                {/* Inactive seller banner */}
                {isInactiveSeller && (
                    <div
                        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center gap-2 py-1.5 bg-amber-500/20 border-b border-amber-500/25 cursor-pointer transition-colors hover:bg-amber-500/30"
                        onClick={(e) => { e.stopPropagation(); router.push('/dashboard/chatbots/create'); }}
                    >
                        <span className="text-[11px] text-amber-300 font-semibold">Yayında Değil — Pazaryeri kaydını tamamla</span>
                    </div>
                )}

                {/* Glow blob (left) */}
                <div className="absolute top-0 left-0 h-full w-[120px] pointer-events-none overflow-hidden opacity-40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="205" height="220" viewBox="0 0 205 220" fill="none">
                        <g filter="url(#cc_blur)">
                            <ellipse cx="19.5" cy="61.2" rx="66.5" ry="39.2" fill="url(#cc_grad)" />
                        </g>
                        <defs>
                            <filter id="cc_blur" x="-165" y="-96" width="370" height="315" filterUnits="userSpaceOnUse">
                                <feGaussianBlur stdDeviation="59.3" />
                            </filter>
                            <linearGradient id="cc_grad" x1="-47" y1="61.2" x2="86" y2="61.2" gradientUnits="userSpaceOnUse">
                                <stop offset="0.21" stopColor="#C026D3" />
                                <stop offset="0.79" stopColor="#8B5CF6" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* Bot thumbnail */}
                <div className="relative w-[110px] shrink-0">
                    <Image
                        src={image}
                        alt="chatbot"
                        fill
                        className="object-cover"
                        sizes="110px"
                    />
                </div>

                {/* Card content */}
                <div className="flex flex-col flex-1 min-w-0 px-4 py-3.5 gap-3">
                    {/* Top row */}
                    <div className="flex items-center gap-3">
                        {/* Avatar + title */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <Image
                                src={profileImage}
                                alt="user"
                                width={38}
                                height={38}
                                className="w-9 h-9 shrink-0 rounded-full object-cover border border-fuchsia-400/20"
                            />
                            <p className="text-[14px] font-semibold text-white/90 leading-snug truncate">{title}</p>
                        </div>

                        {/* Dialog count + status (desktop only) */}
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                            <span className="text-label text-luma-muted">{dialogs} Diyalog</span>
                            <span className={cn(
                                'px-2 py-0.5 rounded-md text-[11px] font-semibold',
                                status === "Satın Alındı"
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                    : 'bg-fuchsia-500/12 text-fuchsia-300 border border-fuchsia-400/18',
                            )}>
                                {status}
                            </span>
                        </div>

                        {/* 3-dot menu */}
                        <div className="relative shrink-0 ml-1" ref={menuRef}>
                            <button
                                aria-label="Chatbot menüsü"
                                className="flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-white/80 hover:bg-fuchsia-500/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base"
                                onClick={(e) => { e.stopPropagation(); setCardMenuOpen(v => !v); }}
                            >
                                <svg width="4" height="14" viewBox="0 0 4 16" fill="currentColor">
                                    <path d="M4 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM4 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM2 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                                </svg>
                            </button>
                            {cardMenuOpen && (
                                <div
                                    className="absolute right-0 top-9 z-50 min-w-[160px] rounded-xl border border-fuchsia-400/12 bg-[#0E0E22] shadow-[0_8px_32px_rgba(0,0,0,0.55)] overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[12.5px] text-rose-400 hover:bg-rose-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteOpen(true); setCardMenuOpen(false); }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 20 21" fill="currentColor" className="opacity-80">
                                            <path d="M0 5.375C0 5.08 0 4.9325 0.09125 4.84125C0.1825 4.75 0.33 4.75 0.625 4.75H19.375C19.67 4.75 19.8175 4.75 19.9088 4.84125C20 4.9325 20 5.08 20 5.375V5.69C20 5.8025 20 5.86 19.9825 5.91C19.9674 5.95308 19.9431 5.99233 19.9113 6.025C19.8738 6.0625 19.8237 6.0875 19.7225 6.13875C18.9088 6.545 18.5025 6.74875 18.2063 7.05375C17.9532 7.3144 17.7599 7.62707 17.64 7.97C17.5 8.37 17.5 8.825 17.5 9.735V16C17.5 18.3575 17.5 19.535 16.7675 20.2675C16.035 21 14.8575 21 12.5 21H7.5C5.1425 21 3.965 21 3.2325 20.2675C2.5 19.535 2.5 18.3575 2.5 16V9.735C2.5 8.825 2.5 8.37 2.36 7.97C2.24007 7.62707 2.04683 7.3144 1.79375 7.05375C1.4975 6.74875 1.09125 6.545 0.2775 6.13875C0.0568881 5.99233 0.0325681 5.95308 0.0175 5.91C0 5.86 0 5.8025 0 5.69V5.375Z" />
                                        </svg>
                                        Sil
                                    </button>
                                    {isOwn && !isIndependent && (
                                        <button
                                            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[12.5px] text-white/70 hover:bg-fuchsia-500/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setUnpublishConfirmOpen(true); setCardMenuOpen(false); }}
                                        >
                                            Yayından Kaldır
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile: dialog + status */}
                    <div className="flex sm:hidden items-center gap-2">
                        <span className="text-label text-luma-muted">{dialogs} Diyalog</span>
                        <span className={cn(
                            'px-2 py-0.5 rounded-md text-[11px] font-semibold',
                            status === "Satın Alındı"
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                                : 'bg-fuchsia-500/12 text-fuchsia-300 border border-fuchsia-400/18',
                        )}>
                            {status}
                        </span>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3">
                        <StatBtn active={liked} activeClass="text-fuchsia-300" onClick={handleLike}>
                            <ThumbsUp className="h-4 w-4" strokeWidth={1.8} />
                            {likeCount}
                        </StatBtn>
                        <StatBtn active={disliked} activeClass="text-rose-400" onClick={handleDislike}>
                            <ThumbsDown className="h-4 w-4" strokeWidth={1.8} />
                            {dislikeCount}
                        </StatBtn>
                        <StatBtn onClick={(e) => { e.stopPropagation(); setCommentOpen(true); }}>
                            <MessageSquare className="h-4 w-4" strokeWidth={1.8} />
                            {commentCount}
                        </StatBtn>
                        <StatBtn onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}>
                            <Share2 className="h-4 w-4" strokeWidth={1.8} />
                            Paylaş
                        </StatBtn>
                    </div>

                    {/* Actions row */}
                    {(isOwn || isPurchased) && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {isOwn && (
                                <ActionBtn onClick={(e) => { e.stopPropagation(); router.push('/dashboard/chatbots/create?id=' + id); }}>
                                    Düzenle
                                </ActionBtn>
                            )}
                            {isOwn && isIndependent && (
                                <ActionBtn onClick={(e) => { e.stopPropagation(); setPublishOpen(true); }}>
                                    Herkese Açık Yayınla
                                </ActionBtn>
                            )}
                            {isOwn && !isIndependent && (
                                <ActionBtn onClick={(e) => { e.stopPropagation(); setAddOpen(true); }}>
                                    Satış Fiyatını Düzenle
                                </ActionBtn>
                            )}
                            {isPurchased && (
                                <ActionBtn onClick={(e) => { e.stopPropagation(); setBuyOpen(true); }}>
                                    Tekrar Satın Al
                                </ActionBtn>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ShareModal isOpen={shareOpen} urlId={id} onClose={() => setShareOpen(false)} />
            <CommentModal
                isOpen={commentOpen}
                onClose={() => setCommentOpen(false)}
                comments={commentList}
                onSend={async (commentText) => {
                    const payload = { user_id: userId, chatbot_id: id, comment: commentText };
                    try {
                        const formData = new FormData();
                        formData.append("data", JSON.stringify(payload));
                        const res = await fetch("/api/social/addcomment.php", { method: "POST", body: formData });
                        const result = JSON.parse(await res.text());
                        if (result.success) setCommentCount(p => p + 1);
                        else alert(result.message);
                    } catch (err) { alert("Yorum eklenemedi: " + err.message); }
                }}
            />
            <AddToSaleListModal isOpen={addOpen} onClose={() => setAddOpen(false)} botId={id} weeklyPrice={weeklyPrice} monthlyPrice={monthlyPrice} />
            <PublishModal isOpen={publishOpen} onClose={() => setPublishOpen(false)} onPublished={() => { if (onChanged) onChanged(); }} botId={id} userId={userId} weeklyPrice={weeklyPrice} monthlyPrice={monthlyPrice} />
            <BuyModal isOpen={buyOpen} onClose={() => setBuyOpen(false)} botData={{ id, isim: title, ucret_haftalik: weeklyPrice, ucret_aylik: monthlyPrice }} userId={userId} />
            <DeleteConfirmModal isOpen={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} onConfirm={() => { setConfirmDeleteOpen(false); if (onDelete) onDelete(); }} />
            <DeleteConfirmModal isOpen={unpublishConfirmOpen} onClose={() => setUnpublishConfirmOpen(false)} onConfirm={handleUnpublish} title="Yayından kaldırmayı onaylıyor musunuz?" description="Chatbotunuz pazaryerinden kaldırılacaktır. Botunuz silinmez, istediğiniz zaman tekrar yayınlayabilirsiniz." confirmLabel="Onayla" />
        </>
    );
}

function StatBtn({ active, activeClass, onClick, children }) {
    return (
        <button
            className={cn(
                'flex items-center gap-1.5 text-[12px] transition-colors px-0 rounded-md',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base',
                active ? (activeClass ?? 'text-fuchsia-300') : 'text-white/45 hover:text-white/75',
            )}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function ActionBtn({ onClick, children }) {
    return (
        <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fuchsia-500/8 border border-fuchsia-400/18 text-fuchsia-300 text-[11.5px] font-semibold hover:bg-fuchsia-500/15 hover:border-fuchsia-400/35 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-luma-base"
            onClick={onClick}
        >
            {children}
        </button>
    );
}
