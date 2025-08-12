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

        const newComment = {
            text: trimmed,
            author: 'siz',
            date: 'şimdi'
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

    const truncateText = (text, maxLines = 3) => {
        const words = text.split(' ');
        const maxWords = maxLines * 8; // Yaklaşık 8 kelime per satır
        
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
                {/* Header */}
                <div className="modal-header">
                    <h3>Yorumlar</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 13.4L7.1 18.3C6.92 18.48 6.68 18.58 6.4 18.58C6.12 18.58 5.88 18.48 5.7 18.3C5.52 18.12 5.43 17.88 5.43 17.6C5.43 17.32 5.52 17.08 5.7 16.9L10.6 12L5.7 7.1C5.52 6.92 5.43 6.68 5.43 6.4C5.43 6.12 5.52 5.88 5.7 5.7C5.88 5.52 6.12 5.43 6.4 5.43C6.68 5.43 6.92 5.52 7.1 5.7L12 10.6L16.9 5.7C17.08 5.52 17.32 5.43 17.6 5.43C17.88 5.43 18.12 5.52 18.3 5.7C18.48 5.88 18.58 6.12 18.58 6.4C18.58 6.68 18.48 6.92 18.3 7.1L13.4 12L18.3 16.9C18.48 17.08 18.58 17.32 18.58 17.6C18.58 17.88 18.48 18.12 18.3 18.3C18.12 18.48 17.88 18.58 17.6 18.58C17.32 18.58 17.08 18.48 16.9 18.3L12 13.4Z" fill="#FF99D6" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">

                    {/* Yorumlar Listesi */}
                    <div className="comment-list">
                        {localComments.map((comment, index) => {
                            const { text, isTruncated } = truncateText(comment.text);
                            const isExpanded = expandedComments.has(index);
                            
                            return (
                                <div className="comment-item" key={index}>
                                    <div className="avatar-circle" />
                                    <div className="comment-content">
                                        <div className={`comment-text-wrapper ${isExpanded ? 'expanded' : ''}`}>
                                            <p className="comment-text">
                                                {isExpanded ? comment.text : text}
                                            </p>
                                            {isTruncated && (
                                                <button 
                                                    className="read-more-btn"
                                                    onClick={() => toggleCommentExpansion(index)}
                                                >
                                                    {isExpanded ? 'Daha az göster' : 'Devamını oku'}
                                                    <svg 
                                                        className={`arrow-icon ${isExpanded ? 'expanded' : ''}`}
                                                        width="16" 
                                                        height="16" 
                                                        viewBox="0 0 16 16" 
                                                        fill="none"
                                                    >
                                                        <path 
                                                            d="M6 12L10 8L6 4" 
                                                            stroke="#FF66C4" 
                                                            strokeWidth="2" 
                                                            strokeLinecap="round" 
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <p className="comment-meta">
                                            <strong>{comment.author}</strong> – {comment.date}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Yorum Girişi */}
                    <div className="comment-input">
                        <input
                            type="text"
                            placeholder="Yorum bırak..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button onClick={handleSend}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                                <path d="M9.04157 10.6858L6.57561 4.10993L21.3714 10.6858L6.57561 17.2617L9.04157 10.6858Z" fill="#FF66C4" fill-opacity="0.2" />
                                <path d="M9.04157 10.6858L6.57561 4.10993L21.3714 10.6858L6.57561 17.2617L9.04157 10.6858ZM9.04157 10.6858H13.9735" stroke="#FF99D6" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
