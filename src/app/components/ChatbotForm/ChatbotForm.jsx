"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import sampleImage from "../../../images/sample-bot-page.png";

import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';

function ChatbotForm({bot, botId, userId}) {
    const router = useRouter();
        const [open, setOpen] = useState(false);
        const [selected, setSelected] = useState('');
        const [formData, setFormData] = useState({
            botName: '',
            description: '',
            stylePrompt: '',
            trainingPrompt: '', 
            message: '',
            showInProfile: false,
            recommendable: true,
            isPublic: false,
            weeklyPrice: 0,
            monthlyPrice: 0,
        });
    
    const [uploadedFiles, setUploadedFiles] = useState([]); // {file, name, status, url?, content?}
    const [isDragging, setIsDragging] = useState(false);
    const [filesBackgroundContent, setFilesBackgroundContent] = useState('');
    const [coverImage, setCoverImage] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [errors, setErrors] = useState({});
    const [showErrors, setShowErrors] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const generalFileInputRef = useRef(null);
    const [promptGenerationStatus, setPromptGenerationStatus] = useState('idle'); 
    //const [userId, setUserId] = useState(userId);

    const [ocrWorker, setOcrWorker] = useState(null);
    const [pdfJs, setPdfJs] = useState(null);
    const [trainingContent, setTrainingContent] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatusText, setSubmitStatusText] = useState('');
    const [originalTrainingPrompt, setOriginalTrainingPrompt] = useState('');

    //const MAX_TRAINING_CHARS = 10000;

    useEffect(() => {
    if (bot) {
            // Parse existing style_prompt for file contents
            const stylePrompt = bot.chatbot.style_prompt || '';
            
            // Extract user prompt (after ARKA PLAN section)
            
            setFormData({
                botName: bot.chatbot.isim || '',
                description: bot.chatbot.aciklama || '',
                stylePrompt: bot.chatbot.style_prompt || '',
                message: bot.chatbot.sohbet_basi_mesaj || '',
                trainingPrompt: bot.chatbot.training_prompt || '',
                showInProfile: false,
                recommendable: true,
                isPublic: false,
                weeklyPrice: Number(bot.chatbot.ucret_haftalik) || 0, 
                monthlyPrice: Number(bot.chatbot.ucret_aylik) || 0
            });
            setOriginalTrainingPrompt(bot.chatbot.training_prompt || '');
            setCoverImage(bot.chatbot.kapak_fotografi || null);
            setProfileImage(bot.chatbot.profil_fotografi || null);
            
            if (bot.kategori_id) {
                setSelectedCategory({ 
                    id: bot.chatbot.kategori_id, 
                    kategori_adi_tr: bot.chatbot.kategori_adi_tr || 'Kategori Seçili' 
                });
            }
        }
    }, [bot]);

    useEffect(() => {
            // Kütüphane Yüklemesi Sadece İstemcide Çalışır
            const loadClientSideLibraries = async () => {
                try {
                    // 1. Tesseract.js Worker'ı Yükle
                    const { createWorker } = await import('tesseract.js');
                    const worker = await createWorker('eng');
                    setOcrWorker(worker);
                } catch (error) {
                    console.error("İstemci tarafı kütüphaneleri yüklenirken hata:", error);
                }
            };
    
            loadClientSideLibraries();
    
            fetch('/api/getcategories.php')
                .then(async res => {
                    const text = await res.text();
                    try {
                        const data = JSON.parse(text);
                        if (Array.isArray(data)) {
                            setCategories(data);
                        } else {
                            console.error("Gelen veri bir dizi değil:", data);
                        }
                    } catch (parseError) {
                        console.error("JSON Parse Hatası! Sunucu muhtemelen PHP hatası döndürdü.");
                    }
                })
                .catch(err => console.error("Fetch Hatası:", err));
    
            return () => {
                if (ocrWorker) ocrWorker.terminate();
            };
        }, []);

        const generatePromptFromFileContent = async (file, base64Data) => {
            let content = "";
            let extractionSuccess = true;

            try {
                if (file.type.startsWith("image/") && ocrWorker) {
                const { data: { text } } = await ocrWorker.recognize(base64Data);
                content = text || "[OCR Başarısız: Metin alınamadı]";
                } 
                else if (file.type === 'application/pdf') {
                const base64String = base64Data.split(',')[1];
                const res = await fetch('/api/readpdf.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ base64Data: base64String })
                });
                const tdata = await res.text();
            //console.log(tdata); // Removed for clean extraction
                const data = JSON.parse(tdata);
                if (data.success) {
                    content = data.text || "[PDF Metni Okunamadı]";
                } else {
                    content = `[PDF İşleme Hatası: ${data.error}]`;
                    extractionSuccess = false;
                }
                }
            } catch (e) {
                alert(`[Dosya İşleme Hatası: ${e.message}] Dosya: ${file.name}`);
                extractionSuccess = false;
            }
            if (!extractionSuccess || !content || content.length === 0) {
                return { success: false, content: '', filename: file.name };
            }

            const currentPrompt = "";
            const basePrompt =
                `${content}`;

            // Eğer içerik "Yükleniyor..." yazısıysa onu temizle (güvenlik önlemi)
            const cleanCurrentPrompt = currentPrompt.includes("Yükleniyor...") ? "" : currentPrompt;

            return content;
        };

        const handleGeneralFileDrop = async (e) => {
            e.preventDefault();
            setIsDragging(false);

            const MAX_TRAINING_CHARS = 10000;

            const file = e.dataTransfer.files[0];
            if (!file) return;
                    
            const isAllowed = file.type.startsWith("image/") || file.type === "application/pdf";
                        
            if (!isAllowed) {
                alert("Hata: Yalnızca .pdf dosyaları veya resimler desteklenmektedir.");
                return;
            }

            setPromptGenerationStatus('processing');
            
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result;
                setUploadedFiles(prev => [
                    ...prev, 
                    {
                        name: file.name, // Dosya adını tutmak iyi olur
                        url: base64,
                        type: file.type
                    }
                ]);

                const result = await generatePromptFromFileContent(file, base64);
                const extractedText = (typeof result === 'object' && result !== null) ? result.content : result;
                if(extractedText) {
                    const currentLength = formData.trainingPrompt ? formData.trainingPrompt.length : 0;
                    const newTotalLength = currentLength + extractedText.length;

                    if (newTotalLength > MAX_TRAINING_CHARS)
                    {
                        alert(`Karakter sınırını aştınız! Eğitim verisi toplamda ${MAX_TRAINING_CHARS.toLocaleString()} karakteri geçemez.\n\nŞu anki: ${currentLength.toLocaleString()}\nEklenmeye çalışılan: ${extractedText.length.toLocaleString()}`);
                        setUploadedFiles(prev => prev.filter(f => f.name !== file.name));
                        return;
                    }
                    setFormData(prev => ({
                        ...prev,
                        trainingPrompt: prev.trainingPrompt ? prev.trainingPrompt + "\n" + extractedText : extractedText
                    }));
                }
            };
            reader.readAsDataURL(file);
        };

        const handleGeneralDragOver = (e) => {
            e.preventDefault();
            setIsDragging(true);
        };

        const handleGeneralDragLeave = () => {
            setIsDragging(false);
        };

        const handleFileUpload = (e, type) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target.result;
                    if (type === 'cover') {
                        setCoverImage(base64);
                        if (errors.coverImage) {
                            setErrors(prev => ({ ...prev, coverImage: '' }));
                        }
                    } else {
                        setProfileImage(base64);
                        if (errors.profileImage) {
                            setErrors(prev => ({ ...prev, profileImage: '' }));
                        }
                    }
                };
                reader.readAsDataURL(file);
            }
        };

        const handleChange = (e) => {
            const { name, value, type, checked } = e.target;
            
            // 1. Durum: Stil promptu değişirse durumu sıfırla
            if (name === 'stylePrompt') {
                setPromptGenerationStatus('idle');
            }

            // 2. Durum: Sayısal fiyat alanları için özel kontrol (weeklyPrice ve monthlyPrice)
            if (name === 'weeklyPrice' || name === 'monthlyPrice') {
                // Sayı olmayan her şeyi temizle
                let cleanValue = value.replace(/[^\d]/g, "");

                // Baştaki sıfırları temizle (Örn: "01" -> "1", "00" -> "0")
                if (cleanValue !== "") {
                    cleanValue = Number(cleanValue).toString();
                } else {
                    cleanValue = "0"; // Tamamen silinirse 0 kalsın
                }

                setFormData(prev => ({
                    ...prev,
                    [name]: cleanValue
                }));
            } else {
                // 3. Durum: Diğer standart inputlar (Checkbox, text vs.)
                setFormData(prev => ({
                    ...prev,
                    [name]: type === 'checkbox' ? checked : value
                }));
            }
            
            // 4. Durum: Hata mesajlarını temizle
            if (errors[name]) {
                setErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        };

        const validateForm = () => {
            const newErrors = {};

            if (!formData.botName.trim()) {
                newErrors.botName = 'Bot ismi gereklidir';
            } else if (formData.botName.trim().length < 3) {
                newErrors.botName = 'Bot ismi en az 3 karakter olmalıdır';
            }

            if (!formData.description.trim()) {
                newErrors.description = 'Açıklama gereklidir';
            } else if (formData.description.trim().length < 10) {
                newErrors.description = 'Açıklama en az 10 karakter olmalıdır';
            }

            if (!selectedCategory) {
                newErrors.category = 'Kategori seçimi gereklidir';
            }

            const fullPromptLength = (formData.stylePrompt + filesBackgroundContent).trim().length;
            if (fullPromptLength < 20) {
                newErrors.stylePrompt = 'Style prompt veya yüklenen dosya içeriği en az 20 karakter olmalıdır';
            }

            if (!coverImage) {
                newErrors.coverImage = 'Kapak görseli gereklidir';
            }

            if (!profileImage) {
                newErrors.profileImage = 'Profil görseli gereklidir';
            }

            if (formData.weeklyPrice === undefined || formData.weeklyPrice === null || formData.weeklyPrice <= 0) {
                newErrors.weeklyPrice = 'Haftalık satış fiyatı pozitif bir sayı olmalıdır';
            }

            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        };

        const handleSubmit = async (e) => {
            e.preventDefault();

            if (!validateForm()) {
                setShowErrors(true);
                return;
            }

            setIsSubmitting(true);
            setSubmitStatusText(bot ? "Güncelleniyor..." : "Yayınlanıyor...");

            const isTrainingChanged = formData.trainingPrompt !== originalTrainingPrompt;
            const formDataToSend = new FormData();

            const chatbotData = {
                id: botId ? botId : bot.id,
                author_user_id: userId,
                owner_user_id : userId,
                isim: formData.botName || "Yeni Chatbot",
                aciklama: formData.description,
                kategori_id: selectedCategory?.id,
                style_prompt: formData.stylePrompt + filesBackgroundContent,
                //training_prompt: formData.trainingPrompt || "",
                sohbet_basi_mesaj: formData.message || "",
                ucret_haftalik: formData.weeklyPrice,
                ucret_aylik: formData.monthlyPrice,
                kapak_fotografi: coverImage,
                profil_fotografi: profileImage
            };

            formDataToSend.append('data', JSON.stringify(chatbotData));

            uploadedFiles.forEach((fileObj) => {
                if (fileObj.file) {
                    formDataToSend.append('training_documents[]', fileObj.file);
                }
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            try {
                const response = await fetch(bot ? '/api/updatechatbot.php' : '/api/savechatbot.php', {
                method: 'POST',
                body: formDataToSend,
                signal: controller.signal,
                });

                const resultText = await response.text();

                let result;
                try {
                    result = JSON.parse(resultText);
                } catch (parseErr) {
                    console.error("Sunucu JSON olmayan yanıt döndü:", resultText);
                    alert("Sunucu beklenmeyen bir yanıt döndü. Lütfen tekrar deneyin.\n\nYanıt: " + resultText.slice(0, 300));
                    setIsSubmitting(false);
                    return;
                }

                if (result.success) {
                    if (isTrainingChanged && formData.trainingPrompt)
                    {
                        const fullText = formData.trainingPrompt;
                        const chunkSize = 10000;
                        for (let i = 0; i < fullText.length; i += chunkSize)
                        {
                            const chunk = fullText.slice(i, i + chunkSize);
                            const chunkForm = new FormData();

                            chunkForm.append('data', JSON.stringify({
                                id: botId ? botId : result.id, // Yeni bot ise dönen ID'yi kullan
                                textChunk: chunk,
                                isFirst: i === 0
                            }));

                            await fetch('/api/update_training_chunk.php', {
                                method: 'POST',
                                body: chunkForm
                            });
                        }
                    }
                    alert(bot ? "Başarıyla güncellendi!" : "Başarıyla yayınlandı!");
                    router.push('/dashboard/chatbots');
                    } else {
                    alert("Hata oluştu: " + (result.message || "Bilinmeyen hata"));
                    setIsSubmitting(false);
                    }
            } catch (error) {
                console.error("İstek gönderilirken hata oluştu:", error);
                if (error.name === 'AbortError') {
                    alert("İstek zaman aşımına uğradı. Görseller çok büyük olabilir, lütfen daha küçük görsellerle tekrar deneyin.");
                } else {
                    alert("Sunucuyla bağlantı kurulamadı.");
                }
                setIsSubmitting(false);
            } finally {
                clearTimeout(timeoutId);
            }
        };

        useEffect(() => {
            // Hem kategoriler yüklenmiş olmalı hem de düzenleme modunda (bot verisi var) olmalıyız
            if (categories.length > 0 && bot?.chatbot?.kategori_id) {
                const targetId = bot.chatbot.kategori_id;
                const foundCategory = categories.find(cat => cat.id == targetId);
                
                if (foundCategory) {
                    setSelectedCategory(foundCategory);
                }
            }
        }, [categories, bot]);

  return (
    <div className="chatbot-form-wrapper">
            <form className="chatbot-form" onSubmit={handleSubmit}>
                <div className="image-upload-section">
    {/* KAPAK GÖRSELİ KARTI */}
    <div className={`upload-card ${showErrors && errors.coverImage ? 'error' : ''}`}>
        <div className="card-left">
            <div className="preview-box">
                {coverImage ? (
                    <img src={coverImage} alt="cover preview" />
                ) : (
                    <div className="placeholder-icon">
                        {/* Mevcut Kapak SVG İkonun */}
                        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path opacity="0.5" d="M20.3712 43.7501H29.6295C36.1316 43.7501 39.3837 43.7501 41.7191 42.2188C42.727 41.5587 43.595 40.7064 44.2732 39.7105C45.8337 37.4188 45.8337 34.2251 45.8337 27.8418C45.8337 21.4584 45.8337 18.2647 44.2732 15.973C43.595 14.9772 42.727 14.1248 41.7191 13.4647C40.2191 12.4793 38.3399 12.1272 35.4628 12.0022C34.0899 12.0022 32.9087 10.9813 32.6399 9.65843C32.4345 8.68941 31.9009 7.82101 31.1292 7.19999C30.3575 6.57898 29.395 6.24345 28.4045 6.2501H21.5962C19.5378 6.2501 17.7649 7.67718 17.3607 9.65843C17.092 10.9813 15.9107 12.0022 14.5378 12.0022C11.6628 12.1272 9.78366 12.4813 8.28158 13.4647C7.27436 14.125 6.40715 14.9774 5.72949 15.973C4.16699 18.2647 4.16699 21.4563 4.16699 27.8418C4.16699 34.2272 4.16699 37.4168 5.72741 39.7105C6.40241 40.7022 7.26908 41.5543 8.28158 42.2188C10.617 43.7501 13.8691 43.7501 20.3712 43.7501Z" fill="#FF66C4" />
                            <path d="M36.5753 19.3165C36.3493 19.3146 36.1251 19.3572 35.9156 19.4419C35.7061 19.5266 35.5153 19.6517 35.3542 19.8102C35.193 19.9686 35.0646 20.1573 34.9764 20.3653C34.8882 20.5734 34.8418 20.7968 34.8398 21.0227C34.8398 21.9644 35.6169 22.7269 36.5753 22.7269H38.8898C39.8482 22.7269 40.6273 21.9623 40.6273 21.0227C40.6254 20.7966 40.579 20.573 40.4906 20.3648C40.4022 20.1566 40.2737 19.9679 40.1123 19.8094C39.9509 19.651 39.7599 19.5259 39.5501 19.4413C39.3404 19.3567 39.116 19.3143 38.8898 19.3165H36.5753Z" fill="#FF66C4" />
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M25.0005 19.3164C20.2088 19.3164 16.3213 23.1331 16.3213 27.8393C16.3213 32.5456 20.2067 36.3622 25.0025 36.3622C29.7942 36.3622 33.6817 32.5477 33.6817 27.8414C33.6817 23.1352 29.7963 19.3164 25.0025 19.3164M25.0025 22.7268C22.1275 22.7268 19.7942 25.0164 19.7942 27.8393C19.7942 30.6622 22.1275 32.9539 25.0025 32.9539C27.8796 32.9539 30.2109 30.6643 30.2109 27.8393C30.2109 25.0164 27.8796 22.7268 25.0025 22.7268Z" fill="#FF66C4" />
                        </svg>
                    </div>
                )}
            </div>
            <p className="upload-label">CHATBOT KAPAK <br /> GÖRSELİ EKLE</p>
        </div>
        <div className="card-right">
            <h4>Kapak Görseli — Temel Tavsiyeler</h4>
            <ul>
                <li>Görsel kare formatta olmalıdır (ör. 1080x1080 px).</li>
                <li>Kapak görseli içeriğin genel temasını yansıtmalı ve ana odak ortada kalmalıdır.</li>
                <li>Görseldeki yazılar ve önemli detaylar kenarlara çok yakın olmamalıdır.</li>
                <li>Yüksek çözünürlüklü ve bulanık olmayan görseller kullanılmalıdır.</li>
            </ul>
            <label htmlFor="cover-upload" className="change-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                KAPAK GÖRSELİNİ DEĞİŞTİR
            </label>
            <input type="file" id="cover-upload" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'cover')} />
        </div>
    </div>

    {/* PROFİL GÖRSELİ KARTI */}
    <div className={`upload-card ${showErrors && errors.profileImage ? 'error' : ''}`}>
        <div className="card-left">
            <div className="preview-box">
                {profileImage ? (
                    <img src={profileImage} alt="profile preview" />
                ) : (
                    <div className="placeholder-icon">
                        {/* Mevcut Profil SVG İkonun */}
                        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24.9998 18.2285C22.2811 18.2285 20.1477 20.366 20.1477 22.916C20.1477 25.466 22.2811 27.6035 25.0019 27.6035C27.7186 27.6035 29.8519 25.466 29.8519 22.916C29.8519 20.366 27.7186 18.2285 24.9998 18.2285ZM17.0227 22.916C17.0227 18.5618 20.6331 15.1035 25.0019 15.1035C29.3665 15.1035 32.9769 18.5618 32.9769 22.916C32.9769 27.2702 29.3665 30.7285 24.9998 30.7285C20.6331 30.7285 17.0227 27.2702 17.0227 22.916ZM19.6873 35.3181C19.3331 35.0868 19.0831 35.0827 18.979 35.1098C18.6651 35.1959 18.3519 35.2889 18.0394 35.3889L15.9873 36.0452C14.4019 36.5535 13.229 37.7889 12.8331 39.2848L11.9373 43.0681C11.89 43.2678 11.8038 43.4563 11.6836 43.6227C11.5635 43.7891 11.4117 43.9302 11.237 44.0379C10.8842 44.2555 10.4594 44.3241 10.0561 44.2285C9.65271 44.1329 9.30385 43.881 9.08623 43.5282C8.86861 43.1754 8.80006 42.7506 8.89564 42.3473L9.79981 38.5306L9.80606 38.5139C10.4769 35.9306 12.4665 33.891 15.0352 33.0702L17.0852 32.4118C17.4408 32.2993 17.7984 32.1938 18.1581 32.0952C19.404 31.7556 20.5811 32.1681 21.3977 32.7014C22.1644 33.2035 23.4352 33.8243 25.0019 33.8243C26.5644 33.8243 27.8352 33.2035 28.6019 32.7014C29.4186 32.1681 30.5956 31.7556 31.8436 32.0952C32.2019 32.1924 32.5588 32.298 32.9144 32.4118L34.9644 33.0702C37.5331 33.891 39.5227 35.9306 40.1936 38.5139L40.1998 38.5306L41.104 42.3473C41.1996 42.7506 41.131 43.1754 40.9134 43.5282C40.6958 43.881 40.3469 44.1329 39.9436 44.2285C39.5402 44.3241 39.1154 44.2555 38.7626 44.0379C38.4098 43.8203 38.1579 43.4714 38.0623 43.0681L37.1665 39.2848C36.7706 37.7889 35.5977 36.5535 34.0123 36.0452L31.9602 35.3889C31.6477 35.2889 31.3345 35.1959 31.0206 35.1098C30.9165 35.0827 30.6665 35.0868 30.3123 35.3181C29.2498 36.0118 27.3831 36.9493 24.9998 36.9493C22.6165 36.9493 20.7498 36.0118 19.6873 35.3181Z" fill="#FFE6F2" />
                            <path d="M21.5976 2.60352H28.4018C30.6768 2.60352 32.4809 2.60352 33.933 2.72227C35.4205 2.8431 36.6768 3.09727 37.8268 3.6806C39.6885 4.63028 41.2018 6.14501 42.1497 8.00768C42.7351 9.15352 42.9893 10.4118 43.1101 11.8993C43.2288 13.3514 43.2288 15.1556 43.2288 17.4306V32.5681C43.2288 34.8431 43.2288 36.6473 43.1101 38.0993C42.9893 39.5868 42.7351 40.8431 42.1518 41.9931C41.2026 43.8545 39.6886 45.3678 37.8268 46.316C36.6768 46.9014 35.4205 47.1556 33.933 47.2764C32.4809 47.3952 30.6768 47.3952 28.4018 47.3952H21.5976C19.3226 47.3952 17.5184 47.3952 16.0663 47.2764C14.5788 47.1556 13.3226 46.9014 12.1747 46.3181C10.3125 45.3693 8.79845 43.8553 7.84967 41.9931C7.26426 40.8431 7.01009 39.5868 6.88926 38.0993C6.77051 36.6473 6.77051 34.8431 6.77051 32.5681V17.4306C6.77051 15.1556 6.77051 13.3514 6.88926 11.8993C7.01009 10.4118 7.26426 9.1556 7.84759 8.00768C8.79691 6.14515 10.3117 4.63111 12.1747 3.68268C13.3205 3.09727 14.5788 2.8431 16.0663 2.72227C17.5184 2.60352 19.3226 2.60352 21.5976 2.60352ZM16.3205 5.83685C15.0288 5.94102 14.2268 6.1431 13.5913 6.46602C12.3177 7.1151 11.2821 8.15066 10.633 9.42435C10.3101 10.0598 10.1101 10.8618 10.0038 12.1535C9.89759 13.466 9.89551 15.141 9.89551 17.4993V32.4993C9.89551 34.8598 9.89551 36.5348 10.0038 37.8452C10.108 39.1368 10.108 39.1368 10.0038 37.8452C10.108 39.1368 10.3101 39.9389 10.633 40.5743C11.2821 41.848 12.3177 42.8836 13.5913 43.5327C14.2268 43.8556 15.0288 44.0556 16.3205 44.1618C17.633 44.2681 19.308 44.2702 21.6663 44.2702H28.333C30.6934 44.2702 32.3684 44.2702 33.6788 44.1618C34.9705 44.0577 35.7726 43.8556 36.408 43.5327C37.6817 42.8836 38.7173 41.848 39.3663 40.5743C39.6893 39.9389 39.8893 39.1368 39.9955 37.8452C40.1018 36.5327 40.1038 34.8598 40.1038 32.4993V17.4993C40.1038 15.141 40.1038 13.4639 39.9955 12.1535C39.8913 10.8618 39.6893 10.0598 39.3663 9.42435C38.7173 8.15066 37.6817 7.1151 36.408 6.46602C35.7726 6.1431 34.9705 5.9431 33.6788 5.83685C32.3663 5.7306 30.6913 5.72852 28.333 5.72852H21.6663C19.308 5.72852 17.6309 5.72852 16.3205 5.83685Z" fill="#FFE6F2" />
                            <path d="M21.3545 9.375C21.3545 8.9606 21.5191 8.56317 21.8121 8.27015C22.1052 7.97712 22.5026 7.8125 22.917 7.8125H27.0837C27.4981 7.8125 27.8955 7.97712 28.1885 8.27015C28.4815 8.56317 28.6462 8.9606 28.6462 9.375C28.6462 9.7894 28.4815 10.1868 28.1885 10.4799C27.8955 10.7729 27.4981 10.9375 27.0837 10.9375H22.917C22.5026 10.9375 22.1052 10.7729 21.8121 10.4799C21.5191 10.1868 21.3545 9.7894 21.3545 9.375Z" fill="#FFE6F2" />
                        </svg>
                    </div>
                )}
            </div>
            <p className="upload-label">PROFiL GÖRSELİ <br /> EKLE</p>
        </div>
        <div className="card-right">
            <h4>Profil Görseli — Temel Tavsiyeler</h4>
            <ul>
                <li>Görsel kare formatta olmalıdır (ör. 1080x1080 px).</li>
                <li>Profil görseli kare yüklenir ancak sistemde daire şeklinde kırpılabilir.</li>
                <li>Bu nedenle logo, yüz veya simge tam ortada ve net şekilde görünmelidir.</li>
                <li>Kenarlara yerleştirilen öğeler kırpma sırasında kaybolabilir.</li>
            </ul>
            <label htmlFor="profile-upload" className="change-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                PROFiL GÖRSELİNİ DEĞİŞTİR
            </label>
            <input type="file" id="profile-upload" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'profile')} />
        </div>
    </div>
</div>

                <input
                    type="text"
                    name="botName"
                    value={formData.botName}
                    onChange={handleChange}
                    placeholder="BOT İSMİ"
                    className={`text-input ${showErrors && errors.botName ? 'error' : ''}`}
                    style={{ textTransform: 'none' }}
                    maxLength="20"
                />

                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="AÇIKLAMA"
                    className={`textarea-input ${showErrors && errors.description ? 'error' : ''}`}
                    style={{ textTransform: 'none' }}
                    maxLength="100"
                ></textarea>

                <h4 className="section-title">DAVRANIŞ AYARLARI</h4>

                <div className={`accordion-select ${showErrors && errors.category ? 'error' : ''}`}>
                    <div className="select-header" onClick={() => setOpen(!open)}>
                        <span>{selectedCategory ? selectedCategory.kategori_adi_tr : 'KATEGORİ SEÇ'}</span>
                        <div className={`arrow ${open ? 'open' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path opacity="0.5" d="M8.5 2.66732C8.5 2.53471 8.44732 2.40753 8.35355 2.31376C8.25978 2.22 8.13261 2.16732 8 2.16732C7.86739 2.16732 7.74022 2.22 7.64645 2.31376C7.55268 2.40753 7.5 2.53471 7.5 2.66732H8.5ZM7.5 2.66732L7.5 13.334H8.5L8.5 2.66732H7.5Z" fill="white" />
                                <path d="M4 9.33398L8 13.334L12 9.33398" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    
                    {open && (
                        <div className="options">
                            {categories.map((cat) => (
                                <div
                                    key={cat.id} 
                                    className={`option ${selectedCategory?.id === cat.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setOpen(false);
                                    }}
                                >
                                    {cat.kategori_adi_tr}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- DOSYA YÜKLEME VE ÖNİZLEME ALANI (Girişlerin Üstüne Taşındı) --- */}
                <div
                    className={`drag-drop-area ${isDragging ? 'dragging' : ''}`}
                    onDrop={handleGeneralFileDrop}
                    onDragOver={handleGeneralDragOver}
                    onDragLeave={handleGeneralDragLeave}
                    onClick={() => generalFileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={generalFileInputRef}
                        accept=".pdf,.docx,.txt,image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const fakeEvent = {
                                    dataTransfer: { files: [file] },
                                    preventDefault: () => {},
                                };
                                handleGeneralFileDrop(fakeEvent);
                            }
                        }}
                    />

                    <div className="upload-icon">
                        <svg width="37" height="33" viewBox="0 0 37 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M6.37682 20.0022H30.3724C31.9634 20.0022 33.4892 19.3702 34.6142 18.2452C35.7392 17.1202 36.3713 15.5943 36.3713 14.0033C36.3713 12.4123 35.7392 10.8865 34.6142 9.76148C33.4892 8.63647 31.9634 8.00445 30.3724 8.00445C29.8125 8.00445 29.5325 8.00445 29.3386 7.96445C28.7427 7.84448 28.4587 7.66251 28.1068 7.1666C27.9908 7.00663 27.8268 6.6427 27.5009 5.91483C26.7128 4.15334 25.4317 2.65757 23.8123 1.60802C22.1929 0.55847 20.3044 0 18.3746 0C16.4448 0 14.5563 0.55847 12.9369 1.60802C11.3175 2.65757 10.0364 4.15334 9.24829 5.91483C8.92235 6.6427 8.75838 7.00463 8.6424 7.1666C8.29046 7.66251 8.00652 7.84648 7.41063 7.96645C7.21466 8.00445 6.93671 8.00445 6.37682 8.00445C4.78581 8.00445 3.25997 8.63647 2.13496 9.76148C1.00995 10.8865 0.37793 12.4123 0.37793 14.0033C0.37793 15.5943 1.00995 17.1202 2.13496 18.2452C3.25997 19.3702 4.78581 20.0022 6.37682 20.0022Z" fill="#FF66C4" fill-opacity="0.37" />
                            <path d="M13.376 17.003L18.3751 12.0039M18.3751 12.0039L23.3741 17.003M18.3751 12.0039V32.0002" stroke="#FF66C4" strokeLinecap="round" />
                        </svg>
                    </div>
                    <p>DOSYALARINIZI BURAYA SÜRÜKLEYİN VE BIRAKIN</p>
                </div>

                {/* Yüklenen Belge Kutusu (Konumu burası, inputun hemen üstü) */}
                {uploadedFiles.length > 0 && (
                    <div className="files-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {uploadedFiles.map((f, index) => (
                            <div key={index} className={`file-preview ${f.status}`} style={{ position: 'relative', border: '2px solid #FF66C4', borderRadius: '8px', padding: '1rem', minWidth: '120px' }}>
                                {f.status === 'processing' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.25rem', fontSize: '0.8rem', textAlign: 'center', borderRadius: '4px 4px 0 0' }}>İşleniyor...</div>}
                                {f.status === 'error' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(255,0,0,0.8)', color: 'white', padding: '0.25rem', fontSize: '0.8rem', textAlign: 'center', borderRadius: '4px 4px 0 0' }}>Hata</div>}
                                {f.url && f.type?.startsWith('image/') ? (
                                    <img src={f.url} alt={f.name} style={{ maxWidth: '100%', borderRadius: '4px' }} />
                                ) : (
                                    <div style={{ textAlign: 'center' }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="#FF66C4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#FF66C4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M14 2v6h6" stroke="#FF66C4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{f.name}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => setUploadedFiles([])} style={{ padding: '1rem', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            Dosyaları Temizle
                        </button>
                    </div>
                )}

                <textarea
                    name="stylePrompt"
                    value={formData.stylePrompt}
                    onChange={handleChange}
                    placeholder="STYLE PROMPT*"
                    className={`textarea-input ${showErrors && errors.stylePrompt ? 'error' : ''}`}
                    style={{ 
                        textTransform: 'none', 
                        borderColor: promptGenerationStatus === 'processing' ? '#FF66C4' : '',
                        transition: 'all 0.3s ease'
                    }}
                ></textarea>

                <input type="hidden" name="trainingPrompt" value={formData.trainingPrompt || ''} onChange={handleChange} />

                {formData.trainingPrompt && (
                    <div style={{
                        marginTop: '15px',
                        marginBottom: '15px',
                        padding: '12px 16px',
                        backgroundColor: 'rgba(255, 102, 196, 0.03)', 
                        border: '1px dashed rgba(255, 102, 196, 0.4)', // Kesikli çizgi "birleşen veri" hissi verir
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        boxShadow: '0 2px 15px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            <div style={{
                                width: '34px',
                                height: '34px',
                                backgroundColor: '#FF66C4',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                flexShrink: 0
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zM9 12h6M9 16h6" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#FF66C4', textTransform: 'uppercase' }}>
                                    Eğitim Verisi Birleştirildi
                                </p>
                                <p style={{ margin: 0, fontSize: '10px', color: '#ccc' }}>
                                    Toplam: <strong>{formData.trainingPrompt.length.toLocaleString()}</strong> karakter
                                </p>
                            </div>
                        </div>
                        
                        <button 
                            type="button" 
                            onClick={() => {
                                if(window.confirm("Tüm eğitim verisi temizlensin mi?")) {
                                    setFormData(prev => ({ ...prev, trainingPrompt: '' }));
                                    setUploadedFiles([]);
                                }
                            }}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: 'rgba(255, 77, 77, 0.1)',
                                border: '1px solid #ff4d4d',
                                color: '#ff4d4d',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                            }}
                        >
                            Sıfırla
                        </button>
                    </div>
                )}

                <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="SOHBET BAŞI MESAJI"
                    className={`textarea-input ${showErrors && errors.message ? 'error' : ''}`}
                    style={{ textTransform: 'none' }}
                    maxLength="300"
                ></textarea>

                <div className="pricing-section-wrapper">
                    <h3 className="section-title">Satış Fiyatını Belirle</h3>
                    <hr className="divider" />
                    <p className="section-description">
                        Yapay zekânızın haftalık satış fiyatını belirleyiniz. Belirlediğiniz ücret, kullanıcıların yapay zekânıza erişim bedeli olarak uygulanır 
                        ve haftalık kazanç hesabında esas alınır. Aylık satın alma seçeneğinde, haftalık ücretlerin toplamına göre indirim uygulanır.
                    </p>

                    <div className="pricing-container">
                        <div className="price-setting-area">
                            {/* Haftalık Fiyat */}
                            <div className="price-input-group">
                                <label htmlFor="weeklyPrice">Belirlediğin satış fiyatı (Bir Haftalık)</label>
                                <div className="input-wrapper">
                                    <input
                                        id="weeklyPrice"
                                        type="number"
                                        name="weeklyPrice"
                                        value={formData.weeklyPrice}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className={`text-input ${showErrors && errors.weeklyPrice ? 'error' : ''}`}
                                    />
                                    <span className="currency-symbol">₺</span>
                                </div>
                            </div>

                            {/* Aylık Fiyat (Yeni Eklendi) */}
                            <div className="price-input-group" style={{marginTop: "3rem"}}>
                                <label htmlFor="monthlyPrice">Belirlediğin satış fiyatı (Bir Aylık)</label>
                                <div className="input-wrapper">
                                    <input
                                        id="monthlyPrice"
                                        type="number"
                                        name="monthlyPrice"
                                        value={formData.monthlyPrice}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className={`text-input ${showErrors && (errors.monthlyPrice || (formData.monthlyPrice < formData.weeklyPrice * 3 || formData.monthlyPrice > formData.weeklyPrice * 4)) ? 'error' : ''}`}
                                    />
                                    <span className="currency-symbol">₺</span>
                                </div>
                                {/* Dinamik Uyarı Mesajı */}
                                {formData.weeklyPrice > 0 && (formData.monthlyPrice < formData.weeklyPrice * 3 || formData.monthlyPrice > formData.weeklyPrice * 4) && (
                                    <small className="text-danger">
                                        Aylık ücret, haftalık ücretin 3 ile 4 katı arasında olmalıdır. 
                                        ({formData.weeklyPrice * 3}₺ - {formData.weeklyPrice * 4}₺)
                                    </small>
                                )}
                            </div>
                        </div>

                        <div className="earnings-display">
                            <p>Haftalık Satıştan Kazancın: <span className="earning-value">{(formData.weeklyPrice * 0.85).toFixed(2)} ₺</span></p>
                            <p>Aylık Satıştan Kazancın: <span className="earning-value">{(formData.monthlyPrice * 0.80).toFixed(2)} ₺</span></p>
                        </div>
                    </div>
                </div>

                {showErrors && Object.keys(errors).length > 0 && (
                    <div className="error-messages">
                        <h4>Lütfen aşağıdaki hataları düzeltin:</h4>
                        <ul>
                            {errors.botName && <li>• {errors.botName}</li>}
                            {errors.description && <li>• {errors.description}</li>}
                            {errors.category && <li>• {errors.category}</li>}
                            {errors.stylePrompt && <li>• {errors.stylePrompt}</li>}
                            {errors.message && <li>• {errors.message}</li>}
                            {errors.coverImage && <li>• {errors.coverImage}</li>}
                            {errors.profileImage && <li>• {errors.profileImage}</li>}
                        </ul>
                    </div>
                )}

                <div className="submit-area" style={{ marginTop: '20px' }}>
                    <button 
                        type="submit" 
                        className={`submit-button ${isSubmitting ? 'submitting' : ''}`}
                        disabled={isSubmitting}
                        style={{
                            opacity: isSubmitting ? 0.7 : 1,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        {isSubmitting && (
                            <div className="spinner" style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid #ffffff33',
                                borderTop: '2px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                        )}
                        <span>
                            {isSubmitting ? submitStatusText : (bot ? "Güncelle" : "Yayınla")}
                        </span>
                    </button>

                    {/* Spinner animasyonu için küçük bir style tag'i (eğer CSS dosyan yoksa) */}
                    <style dangerouslySetInnerHTML={{__html: `
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    `}} />
                </div>
            </form>
        </div>
  )
}

export default ChatbotForm