'use client';
import { useEffect, useState } from 'react';

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

    if (!isOpen) return null;

    return (
        <div className="comments-overlay" onClick={onClose}>
            <div className="comments-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Yorumlar</h3>
                    <button className="close-btn" onClick={onClose}>
                        {/* SVG buraya... */}
                    </button>
                </div>

                <div className="modal-body">
                    <div className="comment-list">
                        {localComments && localComments.map((comment, index) => {
                            // FALLBACK SİSTEMİ: Farklı API'lerden gelen farklı isimleri yakala
                            const commentBody = comment.comment || comment.text || "";
                            const owner = comment.comment_owner || comment.author || "Bilinmiyor";
                            const date = comment.commented_at || comment.date || "";

                            const { text, isTruncated } = truncateText(commentBody);
                            const isExpanded = expandedComments.has(index);
                            
                            return (
                                <div className="comment-item" key={index}>
                                    <div className="avatar-circle" />
                                    <div className="comment-content">
                                        <div className={`comment-text-wrapper ${isExpanded ? 'expanded' : ''}`}>
                                            <p className="comment-text">
                                                {isExpanded ? commentBody : text}
                                            </p>
                                            {isTruncated && (
                                                <button 
                                                    className="read-more-btn"
                                                    onClick={() => toggleCommentExpansion(index)}
                                                >
                                                    {isExpanded ? 'Daha az göster' : 'Devamını oku'}
                                                </button>
                                            )}
                                        </div>
                                        <p className="comment-meta">
                                            <strong>{owner}</strong> – {date}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="comment-input">
                        <input
                            type="text"
                            placeholder="Yorum bırak..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button style={{ color: "#ff66b2" }} onClick={handleSend}>Gönder</button>
                    </div>
                </div>
            </div>
        </div>
    );
}