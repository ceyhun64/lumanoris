"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import sampleImage from "@/images/sample-bot-page.png";

import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import { cn } from "@/lib/utils";
import { RefreshCw, Upload, ChevronDown, FileText } from "lucide-react";

const inputClass = (hasError) => cn(
    "mb-6 w-full rounded-lg border border-transparent bg-white/[0.04] px-3 py-4 font-display text-xs font-medium uppercase text-white/95 outline-none transition-all duration-300 max-md:mb-3",
    hasError && "border-rose-400 bg-rose-400/10",
);
const textareaClass = (hasError) => cn(
    "mb-6 min-h-[180px] w-full resize-y rounded-lg border border-transparent bg-white/[0.04] px-3 py-4 font-display text-xs font-medium uppercase text-white/95 outline-none transition-all duration-300 max-md:mb-3",
    hasError && "border-rose-400 bg-rose-400/10",
);

// PHP tarafındaki coin_engine.php > calculateMessageAllowance() ile aynı
// formülün JS aynası (Sohbet Luma Coini, satın alınan bota özel bonus hak).
const COIN_TIER_BASE = 150;
const COIN_TIER_STEP = 100;
const COIN_TIER_CAP = 1000;
function calculateMessageAllowance(totalPaid) {
    if (!totalPaid || totalPaid < 100) return 0;
    const tier = Math.floor(totalPaid / 100);
    return Math.min(COIN_TIER_CAP, COIN_TIER_BASE + (tier - 1) * COIN_TIER_STEP);
}

function ChatbotForm({bot, botId, userId, independentMode = false}) {
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
            
            if (bot.chatbot.kategori_id) {
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
    
            fetch('/api/content/getcategories.php')
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
                const res = await fetch('/api/training/readpdf.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ base64Data: base64String })
                });
                const tdata = await res.text();
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

            if (!independentMode && (formData.weeklyPrice === undefined || formData.weeklyPrice === null || formData.weeklyPrice <= 0)) {
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
                id: botId ? botId : (bot?.id ?? -1),
                author_user_id: userId,
                owner_user_id : userId,
                isim: formData.botName || "Yeni Chatbot",
                aciklama: formData.description,
                kategori_id: selectedCategory?.id,
                style_prompt: formData.stylePrompt + filesBackgroundContent,
                //training_prompt: formData.trainingPrompt || "",
                sohbet_basi_mesaj: formData.message || "",
                kapak_fotografi: coverImage,
                profil_fotografi: profileImage,
            };

            // Fiyat alanları sadece pazaryeri (bağımsız olmayan) modda
            // gönderilir; bağımsız botlarda mevcut fiyatlar (varsa, yayından
            // kaldırılmışsa) generic düzenleme ile EZİLMEZ.
            if (!independentMode) {
                chatbotData.ucret_haftalik = formData.weeklyPrice;
                chatbotData.ucret_aylik = formData.monthlyPrice;
            }

            // is_independent yalnızca İLK OLUŞTURMADA gönderilir; düzenlemede
            // yayın durumu generic update ile değiştirilmez (publishchatbot.php /
            // unpublishchatbot.php'nin işi).
            if (!bot) {
                chatbotData.is_independent = independentMode ? 1 : 0;
            }

            formDataToSend.append('data', JSON.stringify(chatbotData));

            uploadedFiles.forEach((fileObj) => {
                if (fileObj.file) {
                    formDataToSend.append('training_documents[]', fileObj.file);
                }
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            try {
                const response = await fetch(bot ? '/api/chatbot/updatechatbot.php' : '/api/chatbot/savechatbot.php', {
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

                            await fetch('/api/training/update_training_chunk.php', {
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
    <div className="flex flex-col items-start rounded-2xl border border-white/[0.17] p-6 max-md:p-3">
            <form className="flex w-full flex-col items-start" onSubmit={handleSubmit}>
                <div className="mb-6 grid w-full grid-cols-1 gap-3 md:grid-cols-2">
    {/* KAPAK GÖRSELİ KARTI */}
    <div className={cn(
        "flex flex-1 gap-5 rounded-xl border border-[#24242e] bg-[#121218] p-5 transition-all duration-300",
        showErrors && errors.coverImage && "border-rose-400 shadow-[0_0_10px_rgba(255,77,77,0.2)]",
    )}>
        <div className="flex min-w-[160px] flex-col items-center justify-center">
            <div className="mb-4 flex h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-xl bg-indigo-500/5">
                {coverImage ? (
                    <img src={coverImage} alt="cover preview" className="h-full w-full object-cover" />
                ) : (
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path opacity="0.5" d="M20.3712 43.7501H29.6295C36.1316 43.7501 39.3837 43.7501 41.7191 42.2188C42.727 41.5587 43.595 40.7064 44.2732 39.7105C45.8337 37.4188 45.8337 34.2251 45.8337 27.8418C45.8337 21.4584 45.8337 18.2647 44.2732 15.973C43.595 14.9772 42.727 14.1248 41.7191 13.4647C40.2191 12.4793 38.3399 12.1272 35.4628 12.0022C34.0899 12.0022 32.9087 10.9813 32.6399 9.65843C32.4345 8.68941 31.9009 7.82101 31.1292 7.19999C30.3575 6.57898 29.395 6.24345 28.4045 6.2501H21.5962C19.5378 6.2501 17.7649 7.67718 17.3607 9.65843C17.092 10.9813 15.9107 12.0022 14.5378 12.0022C11.6628 12.1272 9.78366 12.4813 8.28158 13.4647C7.27436 14.125 6.40715 14.9774 5.72949 15.973C4.16699 18.2647 4.16699 21.4563 4.16699 27.8418C4.16699 34.2272 4.16699 37.4168 5.72741 39.7105C6.40241 40.7022 7.26908 41.5543 8.28158 42.2188C10.617 43.7501 13.8691 43.7501 20.3712 43.7501Z" fill="#818CF8" />
                        <path d="M36.5753 19.3165C36.3493 19.3146 36.1251 19.3572 35.9156 19.4419C35.7061 19.5266 35.5153 19.6517 35.3542 19.8102C35.193 19.9686 35.0646 20.1573 34.9764 20.3653C34.8882 20.5734 34.8418 20.7968 34.8398 21.0227C34.8398 21.9644 35.6169 22.7269 36.5753 22.7269H38.8898C39.8482 22.7269 40.6273 21.9623 40.6273 21.0227C40.6254 20.7966 40.579 20.573 40.4906 20.3648C40.4022 20.1566 40.2737 19.9679 40.1123 19.8094C39.9509 19.651 39.7599 19.5259 39.5501 19.4413C39.3404 19.3567 39.116 19.3143 38.8898 19.3165H36.5753Z" fill="#818CF8" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M25.0005 19.3164C20.2088 19.3164 16.3213 23.1331 16.3213 27.8393C16.3213 32.5456 20.2067 36.3622 25.0025 36.3622C29.7942 36.3622 33.6817 32.5477 33.6817 27.8414C33.6817 23.1352 29.7963 19.3164 25.0025 19.3164M25.0025 22.7268C22.1275 22.7268 19.7942 25.0164 19.7942 27.8393C19.7942 30.6622 22.1275 32.9539 25.0025 32.9539C27.8796 32.9539 30.2109 30.6643 30.2109 27.8393C30.2109 25.0164 27.8796 22.7268 25.0025 22.7268Z" fill="#818CF8" />
                    </svg>
                )}
            </div>
            <p className="text-center font-display text-[13px] font-bold uppercase leading-relaxed text-indigo-400">CHATBOT KAPAK <br /> GÖRSELİ EKLE</p>
        </div>
        <div className="flex flex-1 flex-col justify-between">
            <h4 className="mb-3 font-display text-sm font-semibold text-white">Kapak Görseli — Temel Tavsiyeler</h4>
            <ul className="mb-5 flex flex-col gap-1.5">
                <li className="relative pl-3 text-[11px] leading-relaxed text-white/60 before:absolute before:left-0 before:text-indigo-400 before:content-['•']">Görsel kare formatta olmalıdır (ör. 1080x1080 px).</li>
                <li className="relative pl-3 text-[11px] leading-relaxed text-white/60 before:absolute before:left-0 before:text-indigo-400 before:content-['•']">Kapak görseli içeriğin genel temasını yansıtmalı ve ana odak ortada kalmalıdır.</li>
                <li className="relative pl-3 text-[11px] leading-relaxed text-white/60 before:absolute before:left-0 before:text-indigo-400 before:content-['•']">Görseldeki yazılar ve önemli detaylar kenarlara çok yakın olmamalıdır.</li>
                <li className="relative pl-3 text-[11px] leading-relaxed text-white/60 before:absolute before:left-0 before:text-indigo-400 before:content-['•']">Yüksek çözünürlüklü ve bulanık olmayan görseller kullanılmalıdır.</li>
            </ul>
            <label htmlFor="cover-upload" className="flex w-fit cursor-pointer items-center justify-center gap-2 border border-transparent bg-transparent px-4 py-2.5 font-display text-xs font-bold uppercase text-white transition-colors duration-300 [border-image:linear-gradient(to_right,#22D3EE,#818CF8)_1] hover:bg-white/5">
                <RefreshCw className="h-5 w-5" />
                KAPAK GÖRSELİNİ DEĞİŞTİR
            </label>
            <input type="file" id="cover-upload" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'cover')} />
        </div>
    </div>

    {/* PROFİL GÖRSELİ KARTI */}
    <div className={cn(
        "flex flex-1 gap-5 rounded-xl border border-[#24242e] bg-[#121218] p-5 transition-all duration-300",
        showErrors && errors.profileImage && "border-rose-400 shadow-[0_0_10px_rgba(255,77,77,0.2)]",
    )}>
        <div className="flex min-w-[160px] flex-col items-center justify-center">
            <div className="mb-4 flex h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-xl bg-indigo-500/5">
                {profileImage ? (
                    <img src={profileImage} alt="profile preview" className="h-full w-full object-cover" />
                ) : (
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24.9998 18.2285C22.2811 18.2285 20.1477 20.366 20.1477 22.916C20.1477 25.466 22.2811 27.6035 25.0019 27.6035C27.7186 27.6035 29.8519 25.466 29.8519 22.916C29.8519 20.366 27.7186 18.2285 24.9998 18.2285ZM17.0227 22.916C17.0227 18.5618 20.6331 15.1035 25.0019 15.1035C29.3665 15.1035 32.9769 18.5618 32.9769 22.916C32.9769 27.2702 29.3665 30.7285 24.9998 30.7285C20.6331 30.7285 17.0227 27.2702 17.0227 22.916ZM19.6873 35.3181C19.3331 35.0868 19.0831 35.0827 18.979 35.1098C18.6651 35.1959 18.3519 35.2889 18.0394 35.3889L15.9873 36.0452C14.4019 36.5535 13.229 37.7889 12.8331 39.2848L11.9373 43.0681C11.89 43.2678 11.8038 43.4563 11.6836 43.6227C11.5635 43.7891 11.4117 43.9302 11.237 44.0379C10.8842 44.2555 10.4594 44.3241 10.0561 44.2285C9.65271 44.1329 9.30385 43.881 9.08623 43.5282C8.86861 43.1754 8.80006 42.7506 8.89564 42.3473L9.79981 38.5306L9.80606 38.5139C10.4769 35.9306 12.4665 33.891 15.0352 33.0702L17.0852 32.4118C17.4408 32.2993 17.7984 32.1938 18.1581 32.0952C19.404 31.7556 20.5811 32.1681 21.3977 32.7014C22.1644 33.2035 23.4352 33.8243 25.0019 33.8243C26.5644 33.8243 27.8352 33.2035 28.6019 32.7014C29.4186 32.1681 30.5956 31.7556 31.8436 32.0952C32.2019 32.1924 32.5588 32.298 32.9144 32.4118L34.9644 33.0702C37.5331 33.891 39.5227 35.9306 40.1936 38.5139L40.1998 38.5306L41.104 42.3473C41.1996 42.7506 41.131 43.1754 40.9134 43.5282C40.6958 43.881 40.3469 44.1329 39.9436 44.2285C39.5402 44.3241 39.1154 44.2555 38.7626 44.0379C38.4098 43.8203 38.1579 43.4714 38.0623 43.0681L37.1665 39.2848C36.7706 37.7889 35.5977 36.5535 34.0123 36.0452L31.9602 35.3889C31.6477 35.2889 31.3345 35.1959 31.0206 35.1098C30.9165 35.0827 30.6665 35.0868 30.3123 35.3181C29.2498 36.0118 27.3831 36.9493 24.9998 36.9493C22.6165 36.9493 20.7498 36.0118 19.6873 35.3181Z" fill="#818CF8" />
                        <path d="M21.5976 2.60352H28.4018C30.6768 2.60352 32.4809 2.60352 33.933 2.72227C35.4205 2.8431 36.6768 3.09727 37.8268 3.6806C39.6885 4.63028 41.2018 6.14501 42.1497 8.00768C42.7351 9.15352 42.9893 10.4118 43.1101 11.8993C43.2288 13.3514 43.2288 15.1556 43.2288 17.4306V32.5681C43.2288 34.8431 43.2288 36.6473 43.1101 38.0993C42.9893 39.5868 42.7351 40.8431 42.1518 41.9931C41.2026 43.8545 39.6886 45.3678 37.8268 46.316C36.6768 46.9014 35.4205 47.1556 33.933 47.2764C32.4809 47.3952 30.6768 47.3952 28.4018 47.3952H21.5976C19.3226 47.3952 17.5184 47.3952 16.0663 47.2764C14.5788 47.1556 13.3226 46.9014 12.1747 46.3181C10.3125 45.3693 8.79845 43.8553 7.84967 41.9931C7.26426 40.8431 7.01009 39.5868 6.88926 38.0993C6.77051 36.6473 6.77051 34.8431 6.77051 32.5681V17.4306C6.77051 15.1556 6.77051 13.3514 6.88926 11.8993C7.01009 10.4118 7.26426 9.1556 7.84759 8.00768C8.79691 6.14515 10.3117 4.63111 12.1747 3.68268C13.3205 3.09727 14.5788 2.8431 16.0663 2.72227C17.5184 2.60352 19.3226 2.60352 21.5976 2.60352ZM16.3205 5.83685C15.0288 5.94102 14.2268 6.1431 13.5913 6.46602C12.3177 7.1151 11.2821 8.15066 10.633 9.42435C10.3101 10.0598 10.1101 10.8618 10.0038 12.1535C9.89759 13.466 9.89551 15.141 9.89551 17.4993V32.4993C9.89551 34.8598 9.89551 36.5348 10.0038 37.8452C10.108 39.1368 10.108 39.1368 10.0038 37.8452C10.108 39.1368 10.3101 39.9389 10.633 40.5743C11.2821 41.848 12.3177 42.8836 13.5913 43.5327C14.2268 43.8556 15.0288 44.0556 16.3205 44.1618C17.633 44.2681 19.308 44.2702 21.6663 44.2702H28.333C30.6934 44.2702 32.3684 44.2702 33.6788 44.1618C34.9705 44.0577 35.7726 43.8556 36.408 43.5327C37.6817 42.8836 38.7173 41.848 39.3663 40.5743C39.6893 39.9389 39.8893 39.1368 39.9955 37.8452C40.1018 36.5327 40.1038 34.8598 40.1038 32.4993V17.4993C40.1038 15.141 40.1038 13.4639 39.9955 12.1535C39.8913 10.8618 39.6893 10.0598 39.3663 9.42435C38.7173 8.15066 37.6817 7.1151 36.408 6.46602C35.7726 6.1431 34.9705 5.9431 33.6788 5.83685C32.3663 5.7306 30.6913 5.72852 28.333 5.72852H21.6663C19.308 5.72852 17.6309 5.72852 16.3205 5.83685Z" fill="#818CF8" />
                        <path d="M21.3545 9.375C21.3545 8.9606 21.5191 8.56317 21.8121 8.27015C22.1052 7.97712 22.5026 7.8125 22.917 7.8125H27.0837C27.4981 7.8125 27.8955 7.97712 28.1885 8.27015C28.4815 8.56317 28.6462 8.9606 28.6462 9.375C28.6462 9.7894 28.4815 10.1868 28.1885 10.4799C27.8955 10.7729 27.4981 10.9375 27.0837 10.9375H22.917C22.5026 10.9375 22.1052 10.7729 21.8121 10.4799C21.5191 10.1868 21.3545 9.7894 21.3545 9.375Z" fill="#818CF8" />
                    </svg>
                )}
            </div>
            <p className="text-center font-display text-[13px] font-bold uppercase leading-relaxed text-indigo-400">PROFİL GÖRSELİ <br /> EKLE</p>
        </div>
        <div className="flex flex-1 flex-col justify-between">
            <h4 className="mb-3 font-display text-sm font-semibold text-white">Profil Görseli — Temel Tavsiyeler</h4>
            <ul className="mb-5 flex flex-col gap-1.5">
                <li className="relative pl-3 text-[11px] leading-relaxed text-white/60 before:absolute before:left-0 before:text-indigo-400 before:content-['•']">Görsel kare formatta olmalıdır (ör. 1080x1080 px).</li>
                <li className="relative pl-3 text-[11px] leading-relaxed text-white/60 before:absolute before:left-0 before:text-indigo-400 before:content-['•']">Profil görseli kare yüklenir ancak sistemde daire şeklinde kırpılabilir.</li>
                <li className="relative pl-3 text-[11px] leading-relaxed text-white/60 before:absolute before:left-0 before:text-indigo-400 before:content-['•']">Bu nedenle logo, yüz veya simge tam ortada ve net şekilde görünmelidir.</li>
                <li className="relative pl-3 text-[11px] leading-relaxed text-white/60 before:absolute before:left-0 before:text-indigo-400 before:content-['•']">Kenarlara yerleştirilen öğeler kırpma sırasında kaybolabilir.</li>
            </ul>
            <label htmlFor="profile-upload" className="flex w-fit cursor-pointer items-center justify-center gap-2 border border-transparent bg-transparent px-4 py-2.5 font-display text-xs font-bold uppercase text-white transition-colors duration-300 [border-image:linear-gradient(to_right,#22D3EE,#818CF8)_1] hover:bg-white/5">
                <RefreshCw className="h-5 w-5" />
                PROFİL GÖRSELİNİ DEĞİŞTİR
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
                    className={cn(inputClass(showErrors && errors.botName), "normal-case")}
                    maxLength="20"
                />

                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="AÇIKLAMA"
                    className={cn(textareaClass(showErrors && errors.description), "normal-case")}
                    maxLength="300"
                ></textarea>

                <h4 className="mb-6 font-display text-sm font-medium uppercase text-indigo-400 max-md:mb-3">DAVRANIŞ AYARLARI</h4>

                <div className="relative mb-6 w-full text-white transition-all duration-300 max-md:mb-3">
                    <div
                        onClick={() => setOpen(!open)}
                        className={cn(
                            "flex cursor-pointer items-center justify-between rounded-lg border border-transparent bg-white/[0.04] px-3 py-4 transition-all duration-300",
                            showErrors && errors.category && "border-rose-400 bg-rose-400/10",
                        )}
                    >
                        <span className="font-display text-xs font-medium uppercase text-white/95">{selectedCategory ? selectedCategory.kategori_adi_tr : 'KATEGORİ SEÇ'}</span>
                        <div className={cn("flex h-7 w-7 items-center justify-center rounded-full bg-white/30 transition-transform duration-300", open && "rotate-180")}>
                            <ChevronDown className="h-4 w-4 text-white" />
                        </div>
                    </div>

                    {open && (
                        <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-2xl bg-luma-card p-4 sm:grid-cols-3 md:grid-cols-5">
                            {categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "flex cursor-pointer items-center justify-center rounded-lg bg-luma-elevated p-3 text-center font-display text-sm text-white transition-colors duration-200 hover:bg-white/10",
                                        selectedCategory?.id === cat.id && "bg-gradient-btn",
                                    )}
                                >
                                    {cat.kategori_adi_tr}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- DOSYA YÜKLEME VE ÖNİZLEME ALANI (Girişlerin Üstüne Taşındı) --- */}
                <div
                    onDrop={handleGeneralFileDrop}
                    onDragOver={handleGeneralDragOver}
                    onDragLeave={handleGeneralDragLeave}
                    onClick={() => generalFileInputRef.current?.click()}
                    className={cn(
                        "mb-6 flex h-[180px] w-full cursor-pointer flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-indigo-400/30 p-4 transition-all duration-300 max-md:mb-3",
                        isDragging && "scale-[1.02] border-2 border-indigo-400 bg-indigo-500/[0.08]",
                    )}
                >
                    <input
                        type="file"
                        ref={generalFileInputRef}
                        accept=".pdf,.docx,.txt,image/*"
                        className="hidden"
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

                    <Upload className="h-9 w-9 text-indigo-400" />
                    <p className="font-display text-xs font-medium uppercase text-white/95">DOSYALARINIZI BURAYA SÜRÜKLEYİN VE BIRAKIN</p>
                </div>

                {/* Yüklenen Belge Kutusu (Konumu burası, inputun hemen üstü) */}
                {uploadedFiles.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-4">
                        {uploadedFiles.map((f, index) => (
                            <div key={index} className="relative min-w-[120px] rounded-lg border-2 border-indigo-400 p-4">
                                {f.status === 'processing' && <div className="absolute inset-x-0 top-0 rounded-t-md bg-black/70 p-1 text-center text-xs text-white">İşleniyor...</div>}
                                {f.status === 'error' && <div className="absolute inset-x-0 top-0 rounded-t-md bg-rose-500/80 p-1 text-center text-xs text-white">Hata</div>}
                                {f.url && f.type?.startsWith('image/') ? (
                                    <img src={f.url} alt={f.name} className="max-w-full rounded-md" />
                                ) : (
                                    <div className="text-center">
                                        <FileText className="mx-auto h-8 w-8 text-indigo-400" />
                                        <div className="mt-2 text-xs">{f.name}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setUploadedFiles([])}
                            className="rounded-lg bg-rose-500 px-4 text-white transition-colors hover:bg-rose-600"
                        >
                            Dosyaları Temizle
                        </button>
                    </div>
                )}

                <textarea
                    name="stylePrompt"
                    value={formData.stylePrompt}
                    onChange={handleChange}
                    placeholder="STYLE PROMPT*"
                    className={cn(
                        textareaClass(showErrors && errors.stylePrompt),
                        "normal-case transition-all duration-300",
                        promptGenerationStatus === 'processing' && "border-indigo-400",
                    )}
                ></textarea>

                {formData.trainingPrompt && (
                    <div className="mb-4 mt-4 flex items-center justify-between gap-3 rounded-xl border border-dashed border-indigo-400/40 bg-indigo-400/[0.03] px-4 py-3 shadow-[0_2px_15px_rgba(0,0,0,0.1)]">
                        <div className="flex flex-1 items-center gap-2.5">
                            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-indigo-400 text-white">
                                <FileText className="h-[18px] w-[18px]" />
                            </div>
                            <div>
                                <p className="text-[11px] font-extrabold uppercase text-indigo-400">
                                    Eğitim Verisi Birleştirildi
                                </p>
                                <p className="text-[10px] text-white/70">
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
                            className="rounded-md border border-rose-500 bg-rose-500/10 px-3 py-1.5 text-[10px] font-bold uppercase text-rose-500 transition-colors hover:bg-rose-500/20"
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
                    className={cn(textareaClass(showErrors && errors.message), "normal-case")}
                    maxLength="300"
                ></textarea>

                {!independentMode && (
                    <div className="my-5 w-full font-display text-white">
                        <h3 className="mb-2.5 text-lg font-semibold">Satış Fiyatını Belirle</h3>
                        <hr className="mb-5 border-t border-[#2c2833]" />
                        <p className="mb-7 text-[13px] leading-relaxed text-white/60">
                            Yapay zekânızın haftalık satış fiyatını belirleyiniz. Belirlediğiniz ücret, kullanıcıların yapay zekânıza erişim bedeli olarak uygulanır
                            ve haftalık kazanç hesabında esas alınır. Aylık satın alma seçeneğinde, haftalık ücretlerin toplamına göre indirim uygulanır.
                        </p>

                        <div className="flex flex-col items-center gap-5 md:flex-row md:items-start md:justify-between">
                            <div className="w-full flex-1">
                                {/* Haftalık Fiyat */}
                                <div className={cn(
                                    "flex flex-col rounded-xl border border-[#1e1a24] bg-[#0c0c0e] px-5 py-4",
                                    showErrors && errors.weeklyPrice && "border-rose-500",
                                )}>
                                    <label htmlFor="weeklyPrice" className="mb-1 text-sm text-white/90">Belirlediğin satış fiyatı (Bir Haftalık)</label>
                                    <div className="flex items-center justify-between">
                                        <input
                                            id="weeklyPrice"
                                            type="number"
                                            name="weeklyPrice"
                                            value={formData.weeklyPrice}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full bg-transparent font-display text-xl font-medium text-white outline-none placeholder:text-white/30"
                                        />
                                        <span className="ml-2.5 text-xl font-bold text-indigo-400">₺</span>
                                    </div>
                                </div>

                                {/* Aylık Fiyat (Yeni Eklendi) */}
                                <div className={cn(
                                    "mt-12 flex flex-col rounded-xl border border-[#1e1a24] bg-[#0c0c0e] px-5 py-4",
                                    showErrors && (errors.monthlyPrice || (formData.monthlyPrice < formData.weeklyPrice * 3 || formData.monthlyPrice > formData.weeklyPrice * 4)) && "border-rose-500",
                                )}>
                                    <label htmlFor="monthlyPrice" className="mb-1 text-sm text-white/90">Belirlediğin satış fiyatı (Bir Aylık)</label>
                                    <div className="flex items-center justify-between">
                                        <input
                                            id="monthlyPrice"
                                            type="number"
                                            name="monthlyPrice"
                                            value={formData.monthlyPrice}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full bg-transparent font-display text-xl font-medium text-white outline-none placeholder:text-white/30"
                                        />
                                        <span className="ml-2.5 text-xl font-bold text-indigo-400">₺</span>
                                    </div>
                                    {/* Dinamik Uyarı Mesajı */}
                                    {formData.weeklyPrice > 0 && (formData.monthlyPrice < formData.weeklyPrice * 3 || formData.monthlyPrice > formData.weeklyPrice * 4) && (
                                        <small className="mt-2 text-rose-400">
                                            Aylık ücret, haftalık ücretin 3 ile 4 katı arasında olmalıdır.
                                            ({formData.weeklyPrice * 3}₺ - {formData.weeklyPrice * 4}₺)
                                        </small>
                                    )}
                                </div>
                            </div>

                            <div className="flex w-full flex-1 flex-col justify-center gap-3 pt-2.5 md:pl-10">
                                <p className="flex justify-start gap-2.5 whitespace-nowrap text-[15px] text-indigo-400">Haftalık Satıştan Kazancın: <span className="font-medium text-white">{(formData.weeklyPrice * 0.85).toFixed(2)} ₺</span></p>
                                <p className="flex justify-start gap-2.5 whitespace-nowrap text-[15px] text-indigo-400">Aylık Satıştan Kazancın: <span className="font-medium text-white">{(formData.monthlyPrice * 0.80).toFixed(2)} ₺</span></p>
                                {formData.weeklyPrice > 0 && (
                                    <p className="mt-2 text-[13px] text-white/85">
                                        🎁 Alıcılarınız bu fiyatla, 1 haftalık satın almada <b>{calculateMessageAllowance(Number(formData.weeklyPrice))} mesaj hakkı</b>
                                        {formData.monthlyPrice > 0 && (
                                            <>, 1 aylık satın almada <b>{calculateMessageAllowance(Number(formData.monthlyPrice) * 0.95)} mesaj hakkı</b></>
                                        )} kazanacak.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showErrors && Object.keys(errors).length > 0 && (
                    <div className="mb-4 w-full rounded-lg border border-rose-400 bg-rose-400/10 p-4">
                        <h4 className="mb-3 font-display text-sm font-semibold text-rose-400">Lütfen aşağıdaki hataları düzeltin:</h4>
                        <ul className="pl-5">
                            {errors.botName && <li className="mb-1 text-[13px] leading-relaxed text-rose-400">• {errors.botName}</li>}
                            {errors.description && <li className="mb-1 text-[13px] leading-relaxed text-rose-400">• {errors.description}</li>}
                            {errors.category && <li className="mb-1 text-[13px] leading-relaxed text-rose-400">• {errors.category}</li>}
                            {errors.stylePrompt && <li className="mb-1 text-[13px] leading-relaxed text-rose-400">• {errors.stylePrompt}</li>}
                            {errors.message && <li className="mb-1 text-[13px] leading-relaxed text-rose-400">• {errors.message}</li>}
                            {errors.coverImage && <li className="mb-1 text-[13px] leading-relaxed text-rose-400">• {errors.coverImage}</li>}
                            {errors.profileImage && <li className="mb-1 text-[13px] leading-relaxed text-rose-400">• {errors.profileImage}</li>}
                        </ul>
                    </div>
                )}

                <div className="mt-5 flex w-full items-center justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(
                            "flex min-w-[160px] items-center justify-center gap-2.5 rounded-xl border border-white/40 bg-gradient-btn px-3 py-3 font-display text-[15px] font-medium text-white shadow-glow transition-opacity",
                            isSubmitting ? "cursor-not-allowed opacity-70" : "cursor-pointer",
                        )}
                    >
                        {isSubmitting && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        )}
                        <span>
                            {isSubmitting ? submitStatusText : (bot ? "Güncelle" : "Yayınla")}
                        </span>
                    </button>
                </div>
            </form>
        </div>
  )
}

export default ChatbotForm