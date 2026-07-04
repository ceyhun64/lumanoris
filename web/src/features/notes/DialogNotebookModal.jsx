"use client";
import { useState, useEffect } from "react";

export default function DialogNotebookModal({ userId, botId, inputMessage, outputMessage, isOpen, onClose, onPublish }) {
    const [title, setTitle] = useState("");
    const [showFeedback, setShowFeedback] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Çift tıklamayı önlemek için

    const handlePublish = async () => {
        if (!title.trim() || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const payload = {
                user_id: userId,
                chatbot_id: botId,
                name: title,
                input_message: inputMessage,
                output_message: outputMessage,
                // gerekirse diğer alanları da ekle
            };

            const formData = new FormData();
            formData.append("data", JSON.stringify(payload));

            const res = await fetch("/api/note/adddialogbook.php", {
                method: "POST",
                body: formData
            });

            const restext = await res.text();
            const result = JSON.parse(restext);

             if (result.success) {
                if (onPublish) onPublish(title);
                setTitle("");
                setShowFeedback(true);
                setTimeout(() => {
                    setShowFeedback(false);
                    onClose();
                }, 1800);
            } else {
                alert("Hata: " + result.message);
            }
        }
        catch (err) {
            console.error("Yayınlama hatası:", err);
            alert("Bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };
    /*const handlePublish = () => {
        if (!title.trim()) return;
        if (onPublish) onPublish(title);
        setTitle("");
        setShowFeedback(true);
        setTimeout(() => {
            setShowFeedback(false);
            onClose();
        }, 1800); // feedback 1.8sn görünsün
    };*/

    useEffect(() => {
        const handleEsc = (e) => e.key === "Escape" && onClose();
        if (isOpen) document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Feedback Badge */}
            {showFeedback && (
                <div className="fixed bottom-6 right-6 px-3 py-1.5 rounded-lg bg-indigo-400 text-white text-[13px] font-medium pointer-events-none z-[999999] animate-[fadeInOut_2s_ease_forwards]">
                    Başarıyla yayınlandı ✅
                </div>
            )}

            <div className="share-overlay" onClick={onClose}>
                <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>Diyalog Defterine Ekle</h3>
                        <button className="close-btn" onClick={onClose}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M12 13.4008L7.10005 18.3008C6.91672 18.4841 6.68338 18.5758 6.40005 18.5758C6.11672 18.5758 5.88338 18.4841 5.70005 18.3008C5.51672 18.1174 5.42505 17.8841 5.42505 17.6008C5.42505 17.3174 5.51672 17.0841 5.70005 16.9008L10.6 12.0008L5.70005 7.10078C5.51672 6.91745 5.42505 6.68411 5.42505 6.40078C5.42505 6.11745 5.51672 5.88411 5.70005 5.70078C5.88338 5.51745 6.11672 5.42578 6.40005 5.42578C6.68338 5.42578 6.91672 5.51745 7.10005 5.70078L12 10.6008L16.9 5.70078C17.0834 5.51745 17.3167 5.42578 17.6 5.42578C17.8834 5.42578 18.1167 5.51745 18.3 5.70078C18.4834 5.88411 18.575 6.11745 18.575 6.40078C18.575 6.68411 18.4834 6.91745 18.3 7.10078L13.4 12.0008L18.3 16.9008C18.4834 17.0841 18.575 17.3174 18.575 17.6008C18.575 17.8841 18.4834 18.1174 18.3 18.3008C18.1167 18.4841 17.8834 18.5758 17.6 18.5758C17.3167 18.5758 17.0834 18.4841 16.9 18.3008L12 13.4008Z"
                                    fill="#FF99D6"
                                />
                            </svg>
                        </button>
                    </div>
                    <div className="modal-body">
                        <p className="desc-2" style={{ marginBottom: "20px" }}>
                            Diyaloğunuza uygun bir başlık belirleyin ve Diyalog Defteri sayfasında bu içeriği diğer insanlarla paylaşın.
                        </p>
                        <div className="new-list-input">
                            <input
                                type="text"
                                placeholder="Diyalog başlığı"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={onClose}>
                                İptal
                            </button>
                            <button className="save-btn" onClick={handlePublish}>
                                Yayınla
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
