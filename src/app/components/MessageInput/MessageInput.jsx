'use client';
import { useRef, useState } from 'react';
import VoiceModal from '../VoiceModal/VoiceModal';

export default function MessageInput() {
    const fileInputRef = useRef(null);
    const [selectedFileName, setSelectedFileName] = useState('');
    const [voiceModalOpen, setVoiceModalOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudioUrl, setRecordedAudioUrl] = useState('');
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFileName(file.name);
            setMessage(file.name);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setRecordedAudioUrl(url);
                setIsRecording(false);
            };

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
    };

    return (
        <>
            <div className="message-input-container">
                <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    onChange={handleFileSelect}
                />

                <div className="message-box">


                    <input
                        className="message-input"
                        type="text"
                        placeholder="Mesaj yaz"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />

                    {selectedFileName && (
                        <div className="file-badge">
                            {selectedFileName}
                        </div>
                    )}

                    {isRecording && (
                        <div className="recording-status">
                            🎙️ Ses kaydediliyor...
                            <button className="stop-btn" onClick={stopRecording}>Durdur</button>
                        </div>
                    )}

                    {recordedAudioUrl && !isRecording && (
                        <audio controls src={recordedAudioUrl} style={{ marginTop: '8px' }} />
                    )}

                    <div className="bottom">
                        <button
                            className="icon-button"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <mask id="mask0_7772_14213" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="1" y="1" width="22" height="22">
                                    <path d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22Z" fill="#555555" stroke="white" stroke-width="2" stroke-linejoin="round" />
                                    <path d="M12 8V16M8 12H16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </mask>
                                <g mask="url(#mask0_7772_14213)">
                                    <path d="M0 0H24V24H0V0Z" fill="#FF99D6" />
                                </g>
                            </svg>

                        </button>

                        <button
                            className="icon-button"
                            onClick={() => setVoiceModalOpen(true)}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <mask id="mask0_7772_14220" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="3" y="1" width="18" height="22">
                                    <path d="M15.5 5.5C15.5 3.567 13.933 2 12 2C10.067 2 8.5 3.567 8.5 5.5V12C8.5 13.933 10.067 15.5 12 15.5C13.933 15.5 15.5 13.933 15.5 12V5.5Z" fill="#555555" stroke="white" stroke-width="2" stroke-linejoin="round" />
                                    <path d="M4.5 11.5C4.5 15.642 7.858 19 12 19M12 19C16.142 19 19.5 15.642 19.5 11.5M12 19V22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </mask>
                                <g mask="url(#mask0_7772_14220)">
                                    <path d="M0 0H24V24H0V0Z" fill="#FF99D6" />
                                </g>
                            </svg>

                        </button>
                    </div>
                </div>
            </div>

            <VoiceModal
                isOpen={voiceModalOpen}
                onClose={() => setVoiceModalOpen(false)}
                onConfirm={() => {
                    setVoiceModalOpen(false);
                    startRecording(); // sadece mikrofonu başlat
                }}
            />
        </>
    );
}
