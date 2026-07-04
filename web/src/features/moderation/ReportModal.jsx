'use client';
import { useState, useEffect } from 'react';

export default function ReportModal({ isOpen, repId, onClose }) {
    const [step, setStep] = useState(1);
    const [selectedReasons, setSelectedReasons] = useState([]);
    const [extraDetail, setExtraDetail] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [userId, setUserId] = useState(null);
    const [chatbotId, setChatbotId] = useState(null);
    
    useEffect(() => {
        if(repId)
        {
            setChatbotId(repId);
            return;
        }
        let botId = 0;
        const params = new URLSearchParams(window.location.search);
        botId = params.get("botid") || 0;
        setChatbotId(botId);
    },[]);

    useEffect(() => {
        const closeOnEsc = (e) => e.key === 'Escape' && onClose();
        if (isOpen) document.addEventListener('keydown', closeOnEsc);
        return () => document.removeEventListener('keydown', closeOnEsc);
    }, [isOpen, onClose]);

    const handleCheckboxChange = (value) => {
        setSelectedReasons(prev => 
            prev.includes(value) 
                ? prev.filter(item => item !== value) 
                : [...prev, value]
        );
    };

    const handleContinue = () => {
        if (selectedReasons.length > 0) setStep(2);
    };

    const handleSubmit = async () => {
        const payload = {
            user_id: userId,
            chatbot_id:  chatbotId,
            reported_for: selectedReasons, // Direkt slug dizisi gidiyor
            report_detail: extraDetail
        };

        //console.log(payload);

        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));

        try {
            const response = await fetch('/api/social/addreport.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                setShowFeedback(true);
                setTimeout(() => {
                    setShowFeedback(false);
                    onClose();
                    setStep(1);
                    setSelectedReasons([]);
                    setExtraDetail('');
                }, 2000);
            } else {
                alert("Hata: " + result.message);
            }
        } catch (error) {
            alert("Bağlantı hatası!");
        }
    };

    const reportOptions = [
        { label: 'Cinsel içerik', value: 'sexual_content' },
        { label: 'Yasal sorun', value: 'legal_issue' },
        { label: 'Terörizmi destekliyor', value: 'terrorism' },
        { label: 'Spam veya yanıltıcı içerik', value: 'spam' }
    ];

    if (!isOpen) return null;

    return (
        <div className="share-overlay" onClick={onClose}>
            {showFeedback && (
                <div className="copy-badge">
                    Bildiriminiz alındı 🎉
                </div>
            )}
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Neler Oluyor?</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 13.4008L7.10005 18.3008C6.91672 18.4841 6.68338 18.5758 6.40005 18.5758C6.11672 18.5758 5.88338 18.4841 5.70005 18.3008C5.51672 18.1174 5.42505 17.8841 5.42505 17.6008C5.42505 17.3174 5.51672 17.0841 5.70005 16.9008L10.6 12.0008L5.70005 7.10078C5.51672 6.91745 5.42505 6.68411 5.42505 6.40078C5.42505 6.11745 5.51672 5.88411 5.70005 5.70078C5.88338 5.51745 6.11672 5.42578 6.40005 5.42578C6.68338 5.42578 6.91672 5.51745 7.10005 5.70078L12 10.6008L16.9 5.70078C17.0834 5.51745 17.3167 5.42578 17.6 5.42578C17.8834 5.42578 18.1167 5.51745 18.3 5.70078C18.4834 5.88411 18.575 6.11745 18.575 6.40078C18.575 6.68411 18.4834 6.91745 18.3 7.10078L13.4 12.0008L18.3 16.9008C18.4834 17.0841 18.575 17.3174 18.575 17.6008C18.575 17.8841 18.4834 18.1174 18.3 18.3008C18.1167 18.4841 17.8834 18.5758 17.6 18.5758C17.3167 18.5758 17.0834 18.4841 16.9 18.3008L12 13.4008Z" fill="#FF99D6" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="icon" style={{ margin: "12px 0" }}>
                        <svg width="57" height="56" viewBox="0 0 57 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clip-path="url(#clip0_7772_4292)">
                                <path opacity="0.3" d="M19.4809 6.22266L6.72534 18.9782V37.0227L19.4809 49.7782H37.5253L50.2809 37.0227V18.9782L37.5253 6.22266H19.4809ZM28.5031 43.556C26.792 43.556 25.392 42.156 25.392 40.4449C25.392 38.7338 26.792 37.3338 28.5031 37.3338C30.2142 37.3338 31.6142 38.7338 31.6142 40.4449C31.6142 42.156 30.2142 43.556 28.5031 43.556ZM31.6142 34.2227H25.392V12.4449H31.6142V34.2227Z" fill="#D063CC" />
                                <path d="M40.1044 0H16.8956L0.5 16.3956V39.6044L16.8956 56H40.1044L56.5 39.6044V16.3956L40.1044 0ZM50.2778 37.0222L37.5222 49.7778H19.4778L6.72222 37.0222V18.9778L19.4778 6.22222H37.5222L50.2778 18.9778V37.0222Z" fill="#D063CC" />
                                <path d="M28.503 43.5552C30.2212 43.5552 31.6141 42.1623 31.6141 40.4441C31.6141 38.7259 30.2212 37.333 28.503 37.333C26.7847 37.333 25.3918 38.7259 25.3918 40.4441C25.3918 42.1623 26.7847 43.5552 28.503 43.5552Z" fill="#D063CC" />
                                <path d="M25.3918 12.4443H31.6141V34.2221H25.3918V12.4443Z" fill="#D063CC" />
                            </g>
                            <defs>
                                <clipPath id="clip0_7772_4292">
                                    <rect width="56" height="56" fill="white" transform="translate(0.5)" />
                                </clipPath>
                            </defs>
                        </svg>
                    </div>

                    {step === 1 ? (
                        <>
                            <h4 className="modal-title" style={{ color: "#D063CC" }}>İçeriği tüm topluluk kurallarına göre kontrol edeceğiz.</h4>
                            <p className="desc">En doğru seçimi yapmanız gerekmiyor.</p>
                            <div className="checkbox-list">
                                {reportOptions.map((option) => (
                                    <label key={option.value} className="checkbox-option">
                                        <input
                                            type="checkbox"
                                            // State içinde artık 'Cinsel içerik' değil, 'sexual_content' tutuluyor
                                            checked={selectedReasons.includes(option.value)}
                                            onChange={() => handleCheckboxChange(option.value)}
                                        />
                                        <span className="custom-check"></span>
                                        {/* Ekranda gözüken kısım */}
                                        {option.label}
                                    </label>
                                ))}
                            </div>

                            <button className="report-btn" onClick={handleContinue}>Devam Et</button>
                        </>
                    ) : (
                        <>
                            <h4 className="modal-title" style={{ color: "#D063CC" }}>Ayrıntılı bilgi vermek ister misiniz?</h4>
                            <p className="desc">Bu kısım isteğe bağlıdır.</p>
                            <textarea
                                placeholder="Ayrıntı ekle..."
                                value={extraDetail}
                                onChange={(e) => setExtraDetail(e.target.value)}
                            />
                            <button className="report-btn" onClick={handleSubmit}>Bildir</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
