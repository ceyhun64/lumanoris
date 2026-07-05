'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { cn } from '@/lib/utils';

export default function CommentModal({ isOpen, onClose, comments = [], onSend }) {
    const [input, setInput] = useState('');
    const [localComments, setLocalComments] = useState(comments);
    const [expandedComments, setExpandedComments] = useState(new Set());

    useEffect(() => {
        setLocalComments(comments);
    }, [comments]);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;

        // Burada oluşturduğumuz objenin key'lerini aşağıdaki render kısmıyla aynı yapıyoruz
        const newComment = {
            comment: trimmed,
            comment_owner: 'Siz',
            commented_at: 'Şimdi'
        };

        setLocalComments(prev => [...prev, newComment]);
        onSend?.(trimmed);
        setInput('');
    };

    const toggleCommentExpansion = (index) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    // HATAYI ENGELLEYEN GÜVENLİ FONKSİYON
    const truncateText = (text, maxLines = 3) => {
        // Eğer text string değilse veya boşsa hatayı önlemek için hemen boş değer dön
        if (!text || typeof text !== 'string') {
            return { text: '', isTruncated: false };
        }

        const words = text.split(' ');
        const maxWords = maxLines * 8;

        if (words.length <= maxWords) {
            return { text, isTruncated: false };
        }

        return {
            text: words.slice(0, maxWords).join(' ') + '...',
            isTruncated: true
        };
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[440px] bg-luma-card border-white/10 p-6">
                <DialogTitle className="mb-4 text-center text-[16px]">Yorumlar</DialogTitle>

                <div className="mb-4 flex max-h-[360px] flex-col gap-1 overflow-y-auto text-left">
                    {localComments && localComments.map((comment, index) => {
                        // FALLBACK SİSTEMİ: Farklı API'lerden gelen farklı isimleri yakala
                        const commentBody = comment.comment || comment.text || "";
                        const owner = comment.comment_owner || comment.author || "Bilinmiyor";
                        const date = comment.commented_at || comment.date || "";

                        const { text, isTruncated } = truncateText(commentBody);
                        const isExpanded = expandedComments.has(index);

                        return (
                            <div key={index} className="flex items-start gap-3 rounded-xl p-2.5 transition-colors duration-150 hover:bg-white/5">
                                <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400" />
                                <div className="min-w-0 flex-1">
                                    <p className={cn("text-[14px] leading-relaxed text-white", !isExpanded && "line-clamp-3")}>
                                        {isExpanded ? commentBody : text}
                                    </p>
                                    {isTruncated && (
                                        <button
                                            onClick={() => toggleCommentExpansion(index)}
                                            className="mt-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            {isExpanded ? 'Daha az göster' : 'Devamını oku'}
                                        </button>
                                    )}
                                    <p className="mt-1 text-xs text-white/45">
                                        <strong className="font-semibold text-white/70">{owner}</strong> – {date}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-luma-input px-4 py-3">
                    <input
                        type="text"
                        placeholder="Yorum bırak..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        className="flex-1 bg-transparent font-sans text-[14px] text-white placeholder:text-white/40 focus:outline-none"
                    />
                    <button
                        onClick={handleSend}
                        className="shrink-0 text-sm font-semibold text-pink-400 hover:text-pink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        Gönder
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
