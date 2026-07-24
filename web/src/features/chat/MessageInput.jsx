'use client';
import { useRef, useState } from 'react';
import VoiceModal from '@/features/chat/VoiceModal';
import { X, Plus, Send, Mic, Square, RotateCcw, FileText } from 'lucide-react';
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
    const textareaRef = useRef(null);

    // Mesaj gönderildiğinde veya silindiğinde yüksekliği sıfırla
    const resetTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "67px";
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
            textareaRef.current.style.height = "67px";
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
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

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
                        textareaRef.current.style.height = "67px";
                        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
                    }
                };

                recognition.onerror = (err) => console.error("Speech Recog Error:", err);

                recognitionRef.current = recognition;
                recognition.start();
            }

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            toast({ variant: "destructive", title: "Mikrofon erişimi reddedildi." });
            console.error(error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

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

            {/* SOHBET BARI (Message Input Container) — tek birleşik kompozitör */}
            <div className="relative z-0 flex w-full items-end">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                <div className="flex w-full items-end rounded-2xl bg-luma-input ring-1 ring-inset ring-white/[0.07] transition-all duration-150 focus-within:ring-fuchsia-400/40 focus-within:shadow-[0_0_0_3px_rgba(217,70,239,0.08)]">
                    {recordedAudioUrl && (
                        <div className="flex h-[67px] shrink-0 items-center gap-2 pl-4 text-sm text-white/85">
                            <Mic className="h-4 w-4 text-fuchsia-300" />
                            <span>Ses Kaydedildi</span>
                            <button
                                onClick={() => {
                                    setRecordedAudioUrl('');
                                    setMessage('');
                                }}
                                className="flex h-6 w-6 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="Ses kaydını kaldır"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="flex h-[67px] shrink-0 items-center justify-center border-none bg-transparent p-2.5 text-fuchsia-400 transition-colors duration-150 hover:text-fuchsia-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                        aria-label="Dosya ekle"
                    >
                        <Plus className="h-5 w-5" />
                    </button>

                    <textarea
                        ref={textareaRef}
                        placeholder={isRecording ? "Dinleniyor..." : "Yeni sohbete başla..."}
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            handleInput(e);
                        }}
                        onInput={handleInput}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        disabled={isRecording}
                        className={cn(
                            "h-[68px] max-h-[180px] flex-1 resize-none border-none bg-transparent py-[25px] pl-0 pr-2.5 font-sans text-body-lg font-normal text-white placeholder:text-white/45 focus:outline-none disabled:opacity-60",
                            message.length < 150 ? "overflow-hidden" : "overflow-y-auto",
                        )}
                    />

                    <div className="flex h-[67px] shrink-0 items-center gap-1 pr-2">
                        {isRecording ? (
                            <button
                                onClick={stopRecording}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-400 transition-colors duration-150 hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="Kaydı durdur"
                            >
                                <Square className="h-4 w-4 fill-rose-500/20" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setVoiceModalOpen(true)}
                                disabled={!!selectedFileName}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-fuchsia-300 transition-colors duration-150 hover:bg-fuchsia-500/10 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="Sesli mesaj"
                            >
                                <Mic className="h-4 w-4" />
                            </button>
                        )}

                        <button
                            onClick={onResetChat}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-fuchsia-300 transition-colors duration-150 hover:bg-fuchsia-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Sohbeti sıfırla"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </button>

                        <button
                            onClick={handleSend}
                            disabled={isRecording || !(message.trim() || selectedFileName || recordedAudioUrl)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-btn text-white transition-all duration-150 hover:brightness-110 disabled:opacity-30 disabled:hover:brightness-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Gönder"
                        >
                            <Send className="h-4 w-4 -rotate-45" />
                        </button>
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
