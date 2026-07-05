'use client';
import { useRef, useState } from 'react';
import VoiceModal from '@/features/chat/VoiceModal';
import { X, Plus, Send, Mic, Square, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            alert('Mikrofon erişimi reddedildi.');
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
                    <div className="relative flex min-w-[130px] flex-col items-center gap-2 rounded-xl border-2 border-pink-400 bg-black p-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#FF66C4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            <path d="M14 2v6h6" stroke="#FF66C4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>

                        <span className="text-center text-[13px] font-medium text-white">
                            {selectedFileName}
                        </span>

                        <button
                            onClick={() => {
                                setSelectedFileName('');
                                setSelectedFile(null);
                            }}
                            className="absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Dosyayı kaldır"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* SOHBET BARI (Message Input Container) */}
            <div className="relative z-0 flex w-full items-end">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                <div className="flex w-full items-end rounded-xl bg-luma-input">
                    {recordedAudioUrl && (
                        <div className="flex items-center gap-2 px-3 text-sm text-white">
                            <span>🎤 Ses Kaydedildi</span>
                            <button
                                onClick={() => {
                                    setRecordedAudioUrl('');
                                    setMessage('');
                                }}
                                className="text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                                aria-label="Ses kaydını kaldır"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="flex h-[67px] shrink-0 items-center justify-center border-none bg-transparent p-2.5 text-indigo-400 transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
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
                            "h-[68px] max-h-[180px] flex-1 resize-none border-none bg-transparent py-[25px] pl-0 pr-2.5 font-sans text-[15px] font-light text-white placeholder:text-white/45 focus:text-pink-200 focus:outline-none disabled:opacity-60",
                            message.length < 150 ? "overflow-hidden" : "overflow-y-auto",
                        )}
                    />

                    <button
                        onClick={handleSend}
                        disabled={isRecording || !(message.trim() || selectedFileName || recordedAudioUrl)}
                        className="flex h-[67px] shrink-0 items-center justify-center border-none bg-transparent p-2.5 text-pink-300 transition-transform duration-200 hover:scale-110 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                        aria-label="Gönder"
                    >
                        <Send className="h-5 w-5 -rotate-45" />
                    </button>
                </div>

                <div className="ml-2 flex h-[67px] items-center gap-5 rounded-xl bg-luma-input px-5">
                    {isRecording ? (
                        <button
                            onClick={stopRecording}
                            className="flex items-center justify-center text-rose-500 transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                            aria-label="Kaydı durdur"
                        >
                            <Square className="h-5 w-5 fill-rose-500/20" />
                        </button>
                    ) : (
                        <button
                            onClick={() => setVoiceModalOpen(true)}
                            disabled={!!selectedFileName}
                            className="flex items-center justify-center text-pink-300 transition-transform duration-200 hover:scale-110 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                            aria-label="Sesli mesaj"
                        >
                            <Mic className="h-5 w-5" />
                        </button>
                    )}

                    <span className="h-full w-px bg-white/10" />

                    <button
                        onClick={onResetChat}
                        className="flex items-center justify-center text-pink-300 transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                        aria-label="Sohbeti sıfırla"
                    >
                        <RotateCcw className="h-5 w-5" />
                    </button>
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
