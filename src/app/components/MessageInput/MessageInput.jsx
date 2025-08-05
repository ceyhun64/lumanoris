'use client';
import { useRef, useState } from 'react';
import VoiceModal from '../VoiceModal/VoiceModal';

export default function MessageInput({ onSend, onResetChat }) {
    const fileInputRef = useRef(null);
    const [selectedFileName, setSelectedFileName] = useState('');
    const [voiceModalOpen, setVoiceModalOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudioUrl, setRecordedAudioUrl] = useState('');
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const textareaRef = useRef(null);

    const handleSend = () => {
        if (message.trim() && onSend) {
            onSend(message);
            setMessage('');
            setSelectedFileName('');
            setRecordedAudioUrl('');
        }
    };

    const handleInput = (e) => {
        textareaRef.current.style.height = "67px";
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFileName(file.name);
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
            <div className="message-input-ctr">
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
                {selectedFileName && (
                    <div className="file-preview">
                        <span>{selectedFileName}</span>
                        <button onClick={() => {
                            setSelectedFileName('');
                            setMessage('');
                        }}>×</button>
                    </div>
                )}
                <div className="left">
                    <button className="icon-plus" onClick={() => fileInputRef.current.click()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="26" viewBox="0 0 25 26" fill="none">
                            <path d="M12.5005 5.70898V20.292M5.20898 13.0005H19.792" stroke="#FF66C4" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>

                    <textarea
                        ref={textareaRef}
                        placeholder="Yeni sohbete başla..."
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            handleInput(e);
                        }}
                        onInput={handleInput} // mobile için gerekebilir
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSend();
                        }}
                        style={{
                            resize: "none", // kullanıcı manuel büyütmesin diye
                            overflowY: "auto"
                        }}
                    />

                    <button className="send" onClick={handleSend}>
                        {/* Gönder ikonu */}
                        <svg width="34" height="35" viewBox="0 0 34 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_7772_2648)">
                                <path d="M14.6049 17.4928L10.9684 7.79529L32.7877 17.4928L10.9684 27.1902L14.6049 17.4928Z" fill="#FF66C4" fillOpacity="0.2" />
                                <path d="M14.6049 17.4928L10.9684 7.79529L32.7877 17.4928L10.9684 27.1902L14.6049 17.4928ZM14.6049 17.4928H21.878" stroke="#FF99D6" strokeLinecap="round" strokeLinejoin="round" />
                            </g>
                            <defs>
                                <clipPath id="clip0_7772_2648">
                                    <rect width="24" height="24" fill="white" transform="translate(17.0293 0.521484) rotate(45)" />
                                </clipPath>
                            </defs>
                        </svg>
                    </button>
                </div>

                <div className="right-actions">
                    <button className="icon-button" onClick={() => setVoiceModalOpen(true)}>
                        <svg width="17" height="22" viewBox="0 0 17 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <mask id="mask0_7960_16038" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="17" height="22">
                                <path d="M12 4.5C12 2.567 10.433 1 8.5 1C6.567 1 5 2.567 5 4.5V11C5 12.933 6.567 14.5 8.5 14.5C10.433 14.5 12 12.933 12 11V4.5Z" fill="#555555" stroke="white" stroke-width="2" stroke-linejoin="round" />
                                <path d="M1 10.5C1 14.642 4.358 18 8.5 18M8.5 18C12.642 18 16 14.642 16 10.5M8.5 18V21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </mask>
                            <g mask="url(#mask0_7960_16038)">
                                <path d="M-3.5 -1H20.5V23H-3.5V-1Z" fill="#FF99D6" />
                            </g>
                        </svg>

                    </button>
                    <span className="divider" />
                    <button className="icon-button" onClick={onResetChat}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="23" height="21" viewBox="0 0 23 21" fill="none">
                            <rect x="3.31836" y="12.1719" width="5.53293" height="6.63951" fill="#603D56" />
                            <rect x="1.10742" y="1.10742" width="19.9185" height="15.4922" rx="6" fill="#603D56" />
                            <path d="M7.94057 10.215H9.96031V12.2348C9.96031 12.8459 10.4558 13.3414 11.0669 13.3414C11.678 13.3414 12.1735 12.8459 12.1735 12.2348V10.215H14.1938C14.8049 10.215 15.3003 9.71957 15.3003 9.10845C15.3003 8.49734 14.8049 8.00187 14.1938 8.00187H12.1735V5.98159C12.1735 5.37047 11.678 4.875 11.0669 4.875C10.4558 4.875 9.96031 5.37047 9.96031 5.98159V8.00186H7.94057C7.32946 8.00186 6.83398 8.49733 6.83398 9.10844C6.83398 9.71955 7.32946 10.215 7.94057 10.215Z" fill="#FF99D6" />
                            <path d="M0.807118 14.2735L1.15454 15.1699C1.97314 17.2809 3.36393 19.1159 5.17726 20.4764C5.63815 20.8217 6.1855 21 6.74042 21C7.05489 21 7.37152 20.9427 7.67626 20.8266C8.51917 20.5045 9.12811 19.7843 9.30534 18.9008L9.55335 17.6673C12.5241 17.8029 15.5261 17.5462 18.3687 16.9243C19.8055 16.6066 20.9558 15.5514 21.373 14.1606C21.8792 12.4164 22.1359 10.6301 22.1359 8.85025C22.1359 7.06881 21.8792 5.28195 21.3703 3.53021C20.9558 2.14914 19.8055 1.09389 18.3644 0.77509C13.5923 -0.258007 8.54889 -0.259081 3.77134 0.776174C2.33462 1.09389 1.18426 2.14915 0.768752 3.53562C-0.254087 7.00396 -0.256244 10.6717 0.762268 14.1444C0.771453 14.1741 0.792522 14.2357 0.807118 14.2735ZM2.89007 4.16672C3.07378 3.55291 3.59465 3.08175 4.24466 2.93856C8.70937 1.97083 13.4307 1.96976 17.8911 2.93748C18.5454 3.08175 19.0663 3.55291 19.2473 4.15753C19.6958 5.69854 19.9227 7.27791 19.9227 8.85025C19.9227 10.421 19.6958 12.0003 19.25 13.5338C19.0663 14.1476 18.5454 14.6188 17.8933 14.7625C15.0566 15.3844 12.061 15.6076 9.06977 15.4255C8.32088 15.3736 7.65304 15.8966 7.50445 16.6282L7.1354 18.4648C7.09758 18.6523 6.96358 18.7296 6.88685 18.7587C6.80959 18.7884 6.65884 18.8209 6.50485 18.7058C5.02382 17.5943 3.88698 16.0949 3.21752 14.3691L2.87819 13.4933C1.98718 10.4394 1.99151 7.21307 2.89007 4.16672Z" fill="#FF99D6" />
                        </svg>
                    </button>
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
