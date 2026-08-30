'use client';
import { useEffect, useRef, useState } from 'react';
import VoiceModal, { SKIP_VOICE_PROMPT_KEY } from '@/features/chat/VoiceModal';
import { X, Plus, ArrowUp, Mic, Square, RotateCcw, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/shared/hooks/use-toast';

// Tarayıcı desteği kontrolü
const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function MessageInput({ onSend, onResetChat }) {
    const fileInputRef = useRef(null);
    const [selectedFileName, setSelectedFileName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [voiceModalOpen, setVoiceModalOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudioUrl, setRecordedAudioUrl] = useState('');

    const mediaRecorderRef = useRef(null);
    const recognitionRef = useRef(null);
    const audioChunksRef = useRef([]);
    // Mikrofon akisi: track'ler acikca durdurulmazsa kayit bittikten sonra da
    // mikrofon acik kalir (sekmede kayit gostergesi soner gibi gorunmez) ve
    // sonraki kayit denemesi cihazi mesgul bulur.
    const streamRef = useRef(null);
    const textareaRef = useRef(null);

    // Mesaj gönderildiğinde veya silindiğinde yüksekliği sıfırla
    const resetTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    const handleSend = () => {
        if ((message.trim() || selectedFileName || recordedAudioUrl) && onSend) {
            onSend({
                text: message,
                fileName: selectedFileName,
                file: selectedFile || null,
                audioUrl: recordedAudioUrl || null
            });

            // Temizlik
            setMessage('');
            setSelectedFileName('');
            setSelectedFile(null);
            setRecordedAudioUrl('');
            resetTextareaHeight();
        }
    };

    const handleInput = (e) => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFileName(file.name);
            setSelectedFile(file);
            setRecordedAudioUrl('');
        }
    };

    const releaseMic = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    };

    const startRecording = async () => {
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
            toast({
                variant: "destructive",
                title: "Tarayıcı desteklemiyor",
                description: "Bu tarayıcı ses kaydını desteklemiyor. Güncel bir sürüm deneyin.",
            });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // 1. Ses Kaydı Ayarları (Blob/Audio dosyası için)
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setRecordedAudioUrl(url);
                setIsRecording(false);
                setSelectedFileName('');
                setSelectedFile(null);
                // Not: Burada setMessage('') yapmıyoruz ki yazıya dökülen metin kalsın.
            };

            // 2. Web Speech API Ayarları (Sesi yazıya dökmek için)
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'tr-TR';
                recognition.continuous = true;
                recognition.interimResults = true;

                recognition.onresult = (event) => {
                    let transcript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        transcript += event.results[i][0].transcript;
                    }
                    setMessage(transcript); // Textarea içeriğini güncelle

                    // Yazı doldukça textarea yüksekliğini otomatik ayarla
                    if (textareaRef.current) {
                        textareaRef.current.style.height = "auto";
                        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
                    }
                };

                recognition.onerror = (err) => console.error("Speech Recog Error:", err);

                recognitionRef.current = recognition;
                recognition.start();
            }

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            // Her başarısızlığı "izin reddedildi" diye göstermek yanlış
            // teşhise götürüyordu: mikrofon hiç yoksa, cihaz başka bir
            // uygulamada meşgulse ya da sayfa güvenli bağlamda değilse de
            // buraya düşülüyor. Nedeni ayırt edip kullanıcıya ne
            // yapabileceğini söyle.
            let title = "Mikrofona erişilemedi";
            let description = "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.";

            if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
                title = "Mikrofon izni verilmedi";
                description = "Tarayıcının adres çubuğundaki kilit simgesinden bu site için mikrofon iznini açın.";
            } else if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError") {
                title = "Mikrofon bulunamadı";
                description = "Cihazınıza bağlı bir mikrofon algılanmadı.";
            } else if (error?.name === "NotReadableError") {
                title = "Mikrofon kullanımda";
                description = "Mikrofonu kullanan başka bir uygulamayı kapatıp tekrar deneyin.";
            } else if (!window.isSecureContext) {
                title = "Güvenli bağlantı gerekli";
                description = "Sesli mesaj yalnızca HTTPS (veya localhost) üzerinden çalışır.";
            }

            toast({ variant: "destructive", title, description });
            console.error("getUserMedia:", error?.name, error);
            releaseMic();
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        releaseMic();
    };

    // Kayit surerken sayfadan cikilirsa mikrofon acik kalmasin.
    useEffect(() => () => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
        recognitionRef.current?.stop();
        streamRef.current?.getTracks().forEach((t) => t.stop());
    }, []);

    return (
        <>
            {(selectedFileName && !recordedAudioUrl) && (
                <div className="mb-2.5 flex justify-start px-5">
                    <div className="flex items-center gap-2 rounded-lg border border-fuchsia-400/30 bg-luma-elevated px-3.5 py-2">
                        <FileText className="h-4 w-4 shrink-0 text-fuchsia-400" />
                        <span className="max-w-[220px] truncate text-body-sm font-medium text-white/85">
                            {selectedFileName}
                        </span>
                        <button
                            onClick={() => {
                                setSelectedFileName('');
                                setSelectedFile(null);
                            }}
                            className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Dosyayı kaldır"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Sohbet kompozitoru — anasayfadaki "yeni sohbete başla"
                kutusuyla ayni dil: metin alani ustte, eylemler altta kendi
                sirasinda, yuvarlak gonder dugmesi. Eski halinde her sey tek
                sirayla diziliydi ve 67px yukseklige sabitlenmisti. */}
            <div className="relative z-0 w-full">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                <div className="rounded-[26px] bg-gradient-to-br from-fuchsia-500/25 via-violet-500/15 to-white/[0.06] p-px transition-all duration-300 focus-within:from-fuchsia-400/70 focus-within:via-violet-400/40 focus-within:shadow-[0_0_45px_-10px_rgba(217,70,239,0.5)]">
                    <div className="rounded-[25px] bg-[#0a0a12] px-3.5 pb-3 pt-3">
                        {recordedAudioUrl && (
                            <div className="mb-2 flex w-fit items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-body-sm text-white/85">
                                <Mic className="h-3.5 w-3.5 text-fuchsia-300" />
                                <span>Ses kaydedildi</span>
                                <button
                                    onClick={() => { setRecordedAudioUrl(''); setMessage(''); }}
                                    className="flex h-5 w-5 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    aria-label="Ses kaydını kaldır"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )}

                        <textarea
                            ref={textareaRef}
                            placeholder={isRecording ? "Dinleniyor..." : "Yeni sohbete başla..."}
                            value={message}
                            rows={1}
                            onChange={(e) => { setMessage(e.target.value); handleInput(e); }}
                            onInput={handleInput}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            disabled={isRecording}
                            data-focus-managed
                            className={cn(
                                "block max-h-[200px] w-full resize-none border-none bg-transparent px-2 py-2 font-sans text-[15px] leading-6 text-white outline-none placeholder:text-white/40 disabled:opacity-60",
                                message.length < 150 ? "overflow-hidden" : "overflow-y-auto",
                            )}
                        />

                        <div className="mt-1.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/[0.07] hover:text-fuchsia-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    aria-label="Dosya ekle"
                                    title="Dosya ekle"
                                >
                                    <Plus className="h-[18px] w-[18px]" />
                                </button>

                                {isRecording ? (
                                    <button
                                        onClick={stopRecording}
                                        className="flex h-8 items-center gap-1.5 rounded-full bg-rose-500/15 px-3 text-label font-medium text-rose-300 transition-colors hover:bg-rose-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        aria-label="Kaydı durdur"
                                    >
                                        <Square className="h-3 w-3 fill-current" />
                                        <span>Durdur</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            let skip = false;
                                            try {
                                                skip = localStorage.getItem(SKIP_VOICE_PROMPT_KEY) === "1";
                                            } catch {
                                                /* yok say */
                                            }
                                            if (skip) startRecording();
                                            else setVoiceModalOpen(true);
                                        }}
                                        disabled={!!selectedFileName}
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/[0.07] hover:text-fuchsia-300 disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        aria-label="Sesli mesaj"
                                        title="Sesli mesaj"
                                    >
                                        <Mic className="h-[18px] w-[18px]" />
                                    </button>
                                )}

                                <button
                                    onClick={onResetChat}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/[0.07] hover:text-fuchsia-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    aria-label="Sohbeti sıfırla"
                                    title="Sohbeti sıfırla"
                                >
                                    <RotateCcw className="h-[18px] w-[18px]" />
                                </button>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                                <span className="hidden items-center gap-1.5 text-[11px] text-white/30 md:flex">
                                    <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-sans text-white/50">
                                        Enter
                                    </kbd>
                                    gönder
                                </span>
                                <button
                                    onClick={handleSend}
                                    disabled={isRecording || !(message.trim() || selectedFileName || recordedAudioUrl)}
                                    aria-label="Gönder"
                                    className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        (isRecording || !(message.trim() || selectedFileName || recordedAudioUrl))
                                            ? "cursor-not-allowed bg-white/[0.06] text-white/25"
                                            : "bg-gradient-btn text-white shadow-glow hover:scale-105 active:scale-95",
                                    )}
                                >
                                    <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <VoiceModal
                isOpen={voiceModalOpen}
                onClose={() => setVoiceModalOpen(false)}
                onConfirm={() => {
                    setVoiceModalOpen(false);
                    startRecording();
                }}
            />
        </>
    );
}
