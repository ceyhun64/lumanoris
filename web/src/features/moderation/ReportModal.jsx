'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Checkbox } from '@/shared/ui/checkbox';
import { Textarea } from '@/shared/ui/textarea';

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
        fetch("/api/auth/sessioncheck.php", { credentials: "include" })
            .then((res) => res.json())
            .then((result) => { if (result.authenticated) setUserId(result.user_id); })
            .catch((err) => console.error("Session check error:", err));
    }, []);

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[450px] bg-luma-card border-white/10 p-6 text-center">
                {showFeedback && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-glow">
                        Bildiriminiz alındı 🎉
                    </div>
                )}
                <div className="flex flex-col items-center">
                    <div className="my-3 text-fuchsia-400" aria-hidden="true">
                        <svg width="48" height="48" viewBox="0 0 57 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_7772_4292)">
                                <path opacity="0.3" d="M19.4809 6.22266L6.72534 18.9782V37.0227L19.4809 49.7782H37.5253L50.2809 37.0227V18.9782L37.5253 6.22266H19.4809ZM28.5031 43.556C26.792 43.556 25.392 42.156 25.392 40.4449C25.392 38.7338 26.792 37.3338 28.5031 37.3338C30.2142 37.3338 31.6142 38.7338 31.6142 40.4449C31.6142 42.156 30.2142 43.556 28.5031 43.556ZM31.6142 34.2227H25.392V12.4449H31.6142V34.2227Z" fill="currentColor" />
                                <path d="M40.1044 0H16.8956L0.5 16.3956V39.6044L16.8956 56H40.1044L56.5 39.6044V16.3956L40.1044 0ZM50.2778 37.0222L37.5222 49.7778H19.4778L6.72222 37.0222V18.9778L19.4778 6.22222H37.5222L50.2778 18.9778V37.0222Z" fill="currentColor" />
                                <path d="M28.503 43.5552C30.2212 43.5552 31.6141 42.1623 31.6141 40.4441C31.6141 38.7259 30.2212 37.333 28.503 37.333C26.7847 37.333 25.3918 38.7259 25.3918 40.4441C25.3918 42.1623 26.7847 43.5552 28.503 43.5552Z" fill="currentColor" />
                                <path d="M25.3918 12.4443H31.6141V34.2221H25.3918V12.4443Z" fill="currentColor" />
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
                            <DialogTitle className="mb-3 text-lg font-semibold text-fuchsia-400">
                                İçeriği tüm topluluk kurallarına göre kontrol edeceğiz.
                            </DialogTitle>
                            <DialogDescription className="mb-3.5 font-display text-[15px] font-semibold text-white">
                                En doğru seçimi yapmanız gerekmiyor.
                            </DialogDescription>
                            <div className="mb-5 flex w-full flex-col">
                                {reportOptions.map((option) => (
                                    <label
                                        key={option.value}
                                        className="flex cursor-pointer items-center gap-3.5 rounded-xl p-2 font-sans text-sm text-white transition-colors duration-200 hover:bg-fuchsia-400/5"
                                    >
                                        <Checkbox
                                            checked={selectedReasons.includes(option.value)}
                                            onCheckedChange={() => handleCheckboxChange(option.value)}
                                        />
                                        {option.label}
                                    </label>
                                ))}
                            </div>

                            <button
                                onClick={handleContinue}
                                className="w-full rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-4 font-display text-[15px] font-medium text-white transition-all duration-300 hover:bg-fuchsia-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                Devam Et
                            </button>
                        </>
                    ) : (
                        <>
                            <DialogTitle className="mb-3 text-lg font-semibold text-fuchsia-400">
                                Ayrıntılı bilgi vermek ister misiniz?
                            </DialogTitle>
                            <DialogDescription className="mb-3.5 font-display text-[15px] font-semibold text-white">
                                Bu kısım isteğe bağlıdır.
                            </DialogDescription>
                            <Textarea
                                className="mb-3.5 min-h-[100px]"
                                placeholder="Ayrıntı ekle..."
                                value={extraDetail}
                                onChange={(e) => setExtraDetail(e.target.value)}
                            />
                            <button
                                onClick={handleSubmit}
                                className="w-full rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-4 font-display text-[15px] font-medium text-white transition-all duration-300 hover:bg-fuchsia-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                Bildir
                            </button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
