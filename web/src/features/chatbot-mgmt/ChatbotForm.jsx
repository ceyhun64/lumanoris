"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import sampleImage from "@/images/sample-bot-page.png";

import { cn } from "@/lib/utils";
import { toast } from "@/shared/hooks/use-toast";
import { Button } from "@/shared/ui/button";
import DeleteConfirmModal from "@/shared/ui/DeleteConfirmModal";
import {
    MIN_WEEKLY_PRICE,
    MAX_WEEKLY_PRICE,
    SELLER_COMMISSION_WEEKLY,
    SELLER_COMMISSION_MONTHLY,
    deriveMonthlyPrice,
    calculateMessageAllowance,
    validatePrice,
} from "@/shared/lib/pricing";
import { RefreshCw, Upload, ChevronDown, FileText, Tag, AlertCircle } from "lucide-react";

const inputClass = (hasError) => cn(
    "mb-6 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 font-sans text-body text-white placeholder:text-white/35 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 focus:border-fuchsia-400/30 focus:ring-fuchsia-400/20 max-md:mb-3",
    hasError && "border-rose-400/50 bg-rose-400/[0.06]",
);
const textareaClass = (hasError) => cn(
    "mb-6 min-h-[160px] w-full resize-y rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 font-sans text-body leading-relaxed text-white placeholder:text-white/35 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 focus:border-fuchsia-400/30 focus:ring-fuchsia-400/20 max-md:mb-3",
    hasError && "border-rose-400/50 bg-rose-400/[0.06]",
);

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
    const ocrWorkerRef = useRef(null);
    const [pdfJs, setPdfJs] = useState(null);
    const [trainingContent, setTrainingContent] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatusText, setSubmitStatusText] = useState('');
    const [originalTrainingPrompt, setOriginalTrainingPrompt] = useState('');
    const [clearTrainingConfirmOpen, setClearTrainingConfirmOpen] = useState(false);
    const [monthlyPriceTouched, setMonthlyPriceTouched] = useState(false);

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
            // Var olan bir bot düzenleniyor — kayıtlı aylık fiyat zaten
            // belirlenmiş sayılır, haftalık fiyat sonradan değişirse
            // handleChange'in otomatik türetmesiyle sessizce ezilmemeli.
            setMonthlyPriceTouched(true);
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
                    ocrWorkerRef.current = worker;
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
                // Read from the ref, not the `ocrWorker` state captured by this
                // effect's closure — that closure only ever sees the initial
                // `null` (deps are `[]`), so terminate() never ran.
                if (ocrWorkerRef.current) ocrWorkerRef.current.terminate();
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
                    content = `[PDF İşleme Hatası: ${data.message || data.error || 'Bilinmeyen hata'}]`;
                    extractionSuccess = false;
                }
                }
            } catch (e) {
                toast({ variant: "destructive", title: "Dosya işlenemedi", description: `${file.name}: ${e.message}` });
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
                toast({ variant: "destructive", title: "Desteklenmeyen dosya türü", description: "Yalnızca .pdf dosyaları veya resimler desteklenmektedir." });
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
                        toast({
                            variant: "destructive",
                            title: "Karakter sınırını aştınız",
                            description: `Eğitim verisi toplamda ${MAX_TRAINING_CHARS.toLocaleString()} karakteri geçemez. Şu anki: ${currentLength.toLocaleString()}, eklenmeye çalışılan: ${extractedText.length.toLocaleString()}.`,
                        });
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
                if (name === 'monthlyPrice') setMonthlyPriceTouched(true);
                // Sayı olmayan her şeyi temizle
                let cleanValue = value.replace(/[^\d]/g, "");

                // Baştaki sıfırları temizle (Örn: "01" -> "1", "00" -> "0")
                if (cleanValue !== "") {
                    cleanValue = Number(cleanValue).toString();
                } else {
                    cleanValue = "0"; // Tamamen silinirse 0 kalsın
                }

                setFormData(prev => {
                    const next = { ...prev, [name]: cleanValue };
                    // Kullanıcı haftalık fiyatı değiştiriyor ve aylık fiyatı
                    // henüz elle düzenlemediyse, önerilen aylık değeri de
                    // aynı anda güncelle. Bunu ayrı bir effect yerine burada
                    // yapmak, "programatik set" ile "kullanıcı girdisi"
                    // arasındaki bir useEffect yarışını önlüyor (ikisi de
                    // aynı state'e yazarsa sonuncusu kazanır sorunu).
                    if (name === 'weeklyPrice' && !monthlyPriceTouched) {
                        next.monthlyPrice = String(deriveMonthlyPrice(cleanValue));
                    }
                    return next;
                });
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

            if (!independentMode) {
                const weeklyError = validatePrice(formData.weeklyPrice, 'Haftalık', MAX_WEEKLY_PRICE);
                if (weeklyError) newErrors.weeklyPrice = weeklyError;

                const monthlyError = validatePrice(formData.monthlyPrice, 'Aylık', MAX_WEEKLY_PRICE * 4);
                if (monthlyError) newErrors.monthlyPrice = monthlyError;
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
                    toast({ variant: "destructive", title: "Beklenmeyen sunucu yanıtı", description: "Lütfen tekrar deneyin." });
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
                    toast({ variant: "success", title: bot ? "Başarıyla güncellendi!" : "Başarıyla yayınlandı!" });
                    router.push('/dashboard/chatbots');
                    } else {
                    toast({ variant: "destructive", title: "Hata oluştu", description: result.message || "Bilinmeyen hata" });
                    setIsSubmitting(false);
                    }
            } catch (error) {
                console.error("İstek gönderilirken hata oluştu:", error);
                if (error.name === 'AbortError') {
                    toast({ variant: "destructive", title: "İstek zaman aşımına uğradı", description: "Görseller çok büyük olabilir, lütfen daha küçük görsellerle tekrar deneyin." });
                } else {
                    toast({ variant: "destructive", title: "Bağlantı hatası", description: "Sunucuyla bağlantı kurulamadı." });
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
    <div className="flex flex-col items-start rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 max-md:p-4 md:p-8">
            <form className="flex w-full flex-col items-start" onSubmit={handleSubmit}>
                <div className="mb-6 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
    {/* KAPAK GÖRSELİ KARTI */}
    <div className={cn(
        "flex flex-1 gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all duration-200 hover:border-fuchsia-400/15",
        showErrors && errors.coverImage && "border-rose-400/50 bg-rose-400/[0.05]",
    )}>
        <div className="flex min-w-[160px] flex-col items-center justify-center">
            <div className="mb-4 flex h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-xl bg-fuchsia-500/5">
                {coverImage ? (
                    <img src={coverImage} alt="cover preview" className="h-full w-full object-cover" />
                ) : (
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path opacity="0.5" d="M20.3712 43.7501H29.6295C36.1316 43.7501 39.3837 43.7501 41.7191 42.2188C42.727 41.5587 43.595 40.7064 44.2732 39.7105C45.8337 37.4188 45.8337 34.2251 45.8337 27.8418C45.8337 21.4584 45.8337 18.2647 44.2732 15.973C43.595 14.9772 42.727 14.1248 41.7191 13.4647C40.2191 12.4793 38.3399 12.1272 35.4628 12.0022C34.0899 12.0022 32.9087 10.9813 32.6399 9.65843C32.4345 8.68941 31.9009 7.82101 31.1292 7.19999C30.3575 6.57898 29.395 6.24345 28.4045 6.2501H21.5962C19.5378 6.2501 17.7649 7.67718 17.3607 9.65843C17.092 10.9813 15.9107 12.0022 14.5378 12.0022C11.6628 12.1272 9.78366 12.4813 8.28158 13.4647C7.27436 14.125 6.40715 14.9774 5.72949 15.973C4.16699 18.2647 4.16699 21.4563 4.16699 27.8418C4.16699 34.2272 4.16699 37.4168 5.72741 39.7105C6.40241 40.7022 7.26908 41.5543 8.28158 42.2188C10.617 43.7501 13.8691 43.7501 20.3712 43.7501Z" fill="#E879F9" />
                        <path d="M36.5753 19.3165C36.3493 19.3146 36.1251 19.3572 35.9156 19.4419C35.7061 19.5266 35.5153 19.6517 35.3542 19.8102C35.193 19.9686 35.0646 20.1573 34.9764 20.3653C34.8882 20.5734 34.8418 20.7968 34.8398 21.0227C34.8398 21.9644 35.6169 22.7269 36.5753 22.7269H38.8898C39.8482 22.7269 40.6273 21.9623 40.6273 21.0227C40.6254 20.7966 40.579 20.573 40.4906 20.3648C40.4022 20.1566 40.2737 19.9679 40.1123 19.8094C39.9509 19.651 39.7599 19.5259 39.5501 19.4413C39.3404 19.3567 39.116 19.3143 38.8898 19.3165H36.5753Z" fill="#E879F9" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M25.0005 19.3164C20.2088 19.3164 16.3213 23.1331 16.3213 27.8393C16.3213 32.5456 20.2067 36.3622 25.0025 36.3622C29.7942 36.3622 33.6817 32.5477 33.6817 27.8414C33.6817 23.1352 29.7963 19.3164 25.0025 19.3164M25.0025 22.7268C22.1275 22.7268 19.7942 25.0164 19.7942 27.8393C19.7942 30.6622 22.1275 32.9539 25.0025 32.9539C27.8796 32.9539 30.2109 30.6643 30.2109 27.8393C30.2109 25.0164 27.8796 22.7268 25.0025 22.7268Z" fill="#E879F9" />
                    </svg>
                )}
            </div>
            <p className="text-center font-display text-label font-semibold leading-relaxed text-fuchsia-300/90">Chatbot Kapak <br /> Görseli Ekle</p>
        </div>
        <div className="flex flex-1 flex-col justify-between">
            <h4 className="mb-3 font-display text-sm font-semibold text-white">Kapak Görseli — Temel Tavsiyeler</h4>
            <ul className="mb-5 flex flex-col gap-1.5">
                <li className="relative pl-3 text-caption leading-relaxed text-white/60 before:absolute before:left-0 before:text-fuchsia-400 before:content-['•']">Görsel kare formatta olmalıdır (ör. 1080x1080 px).</li>
                <li className="relative pl-3 text-caption leading-relaxed text-white/60 before:absolute before:left-0 before:text-fuchsia-400 before:content-['•']">Kapak görseli içeriğin genel temasını yansıtmalı ve ana odak ortada kalmalıdır.</li>
                <li className="relative pl-3 text-caption leading-relaxed text-white/60 before:absolute before:left-0 before:text-fuchsia-400 before:content-['•']">Görseldeki yazılar ve önemli detaylar kenarlara çok yakın olmamalıdır.</li>
                <li className="relative pl-3 text-caption leading-relaxed text-white/60 before:absolute before:left-0 before:text-fuchsia-400 before:content-['•']">Yüksek çözünürlüklü ve bulanık olmayan görseller kullanılmalıdır.</li>
            </ul>
            <label htmlFor="cover-upload" className="flex w-fit cursor-pointer items-center justify-center gap-2 rounded-lg border border-fuchsia-400/25 bg-fuchsia-400/[0.06] px-4 py-2.5 font-display text-label font-semibold text-fuchsia-300 transition-all duration-200 hover:border-fuchsia-400/45 hover:bg-fuchsia-400/[0.1]">
                <RefreshCw className="h-4 w-4" />
                Kapak Görselini Değiştir
            </label>
            <input type="file" id="cover-upload" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'cover')} />
        </div>
    </div>

    {/* PROFİL GÖRSELİ KARTI */}
    <div className={cn(
        "flex flex-1 gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all duration-200 hover:border-fuchsia-400/15",
        showErrors && errors.profileImage && "border-rose-400/50 bg-rose-400/[0.05]",
    )}>
        <div className="flex min-w-[160px] flex-col items-center justify-center">
            <div className="mb-4 flex h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-xl bg-fuchsia-500/5">
                {profileImage ? (
                    <img src={profileImage} alt="profile preview" className="h-full w-full object-cover" />
                ) : (
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24.9998 18.2285C22.2811 18.2285 20.1477 20.366 20.1477 22.916C20.1477 25.466 22.2811 27.6035 25.0019 27.6035C27.7186 27.6035 29.8519 25.466 29.8519 22.916C29.8519 20.366 27.7186 18.2285 24.9998 18.2285ZM17.0227 22.916C17.0227 18.5618 20.6331 15.1035 25.0019 15.1035C29.3665 15.1035 32.9769 18.5618 32.9769 22.916C32.9769 27.2702 29.3665 30.7285 24.9998 30.7285C20.6331 30.7285 17.0227 27.2702 17.0227 22.916ZM19.6873 35.3181C19.3331 35.0868 19.0831 35.0827 18.979 35.1098C18.6651 35.1959 18.3519 35.2889 18.0394 35.3889L15.9873 36.0452C14.4019 36.5535 13.229 37.7889 12.8331 39.2848L11.9373 43.0681C11.89 43.2678 11.8038 43.4563 11.6836 43.6227C11.5635 43.7891 11.4117 43.9302 11.237 44.0379C10.8842 44.2555 10.4594 44.3241 10.0561 44.2285C9.65271 44.1329 9.30385 43.881 9.08623 43.5282C8.86861 43.1754 8.80006 42.7506 8.89564 42.3473L9.79981 38.5306L9.80606 38.5139C10.4769 35.9306 12.4665 33.891 15.0352 33.0702L17.0852 32.4118C17.4408 32.2993 17.7984 32.1938 18.1581 32.0952C19.404 31.7556 20.5811 32.1681 21.3977 32.7014C22.1644 33.2035 23.4352 33.8243 25.0019 33.8243C26.5644 33.8243 27.8352 33.2035 28.6019 32.7014C29.4186 32.1681 30.5956 31.7556 31.8436 32.0952C32.2019 32.1924 32.5588 32.298 32.9144 32.4118L34.9644 33.0702C37.5331 33.891 39.5227 35.9306 40.1936 38.5139L40.1998 38.5306L41.104 42.3473C41.1996 42.7506 41.131 43.1754 40.9134 43.5282C40.6958 43.881 40.3469 44.1329 39.9436 44.2285C39.5402 44.3241 39.1154 44.2555 38.7626 44.0379C38.4098 43.8203 38.1579 43.4714 38.0623 43.0681L37.1665 39.2848C36.7706 37.7889 35.5977 36.5535 34.0123 36.0452L31.9602 35.3889C31.6477 35.2889 31.3345 35.1959 31.0206 35.1098C30.9165 35.0827 30.6665 35.0868 30.3123 35.3181C29.2498 36.0118 27.3831 36.9493 24.9998 36.9493C22.6165 36.9493 20.7498 36.0118 19.6873 35.3181Z" fill="#E879F9" />
                        <path d="M21.5976 2.60352H28.4018C30.6768 2.60352 32.4809 2.60352 33.933 2.72227C35.4205 2.8431 36.6768 3.09727 37.8268 3.6806C39.6885 4.63028 41.2018 6.14501 42.1497 8.00768C42.7351 9.15352 42.9893 10.4118 43.1101 11.8993C43.2288 13.3514 43.2288 15.1556 43.2288 17.4306V32.5681C43.2288 34.8431 43.2288 36.6473 43.1101 38.0993C42.9893 39.5868 42.7351 40.8431 42.1518 41.9931C41.2026 43.8545 39.6886 45.3678 37.8268 46.316C36.6768 46.9014 35.4205 47.1556 33.933 47.2764C32.4809 47.3952 30.6768 47.3952 28.4018 47.3952H21.5976C19.3226 47.3952 17.5184 47.3952 16.0663 47.2764C14.5788 47.1556 13.3226 46.9014 12.1747 46.3181C10.3125 45.3693 8.79845 43.8553 7.84967 41.9931C7.26426 40.8431 7.01009 39.5868 6.88926 38.0993C6.77051 36.6473 6.77051 34.8431 6.77051 32.5681V17.4306C6.77051 15.1556 6.77051 13.3514 6.88926 11.8993C7.01009 10.4118 7.26426 9.1556 7.84759 8.00768C8.79691 6.14515 10.3117 4.63111 12.1747 3.68268C13.3205 3.09727 14.5788 2.8431 16.0663 2.72227C17.5184 2.60352 19.3226 2.60352 21.5976 2.60352ZM16.3205 5.83685C15.0288 5.94102 14.2268 6.1431 13.5913 6.46602C12.3177 7.1151 11.2821 8.15066 10.633 9.42435C10.3101 10.0598 10.1101 10.8618 10.0038 12.1535C9.89759 13.466 9.89551 15.141 9.89551 17.4993V32.4993C9.89551 34.8598 9.89551 36.5348 10.0038 37.8452C10.108 39.1368 10.108 39.1368 10.0038 37.8452C10.108 39.1368 10.3101 39.9389 10.633 40.5743C11.2821 41.848 12.3177 42.8836 13.5913 43.5327C14.2268 43.8556 15.0288 44.0556 16.3205 44.1618C17.633 44.2681 19.308 44.2702 21.6663 44.2702H28.333C30.6934 44.2702 32.3684 44.2702 33.6788 44.1618C34.9705 44.0577 35.7726 43.8556 36.408 43.5327C37.6817 42.8836 38.7173 41.848 39.3663 40.5743C39.6893 39.9389 39.8893 39.1368 39.9955 37.8452C40.1018 36.5327 40.1038 34.8598 40.1038 32.4993V17.4993C40.1038 15.141 40.1038 13.4639 39.9955 12.1535C39.8913 10.8618 39.6893 10.0598 39.3663 9.42435C38.7173 8.15066 37.6817 7.1151 36.408 6.46602C35.7726 6.1431 34.9705 5.9431 33.6788 5.83685C32.3663 5.7306 30.6913 5.72852 28.333 5.72852H21.6663C19.308 5.72852 17.6309 5.72852 16.3205 5.83685Z" fill="#E879F9" />
                        <path d="M21.3545 9.375C21.3545 8.9606 21.5191 8.56317 21.8121 8.27015C22.1052 7.97712 22.5026 7.8125 22.917 7.8125H27.0837C27.4981 7.8125 27.8955 7.97712 28.1885 8.27015C28.4815 8.56317 28.6462 8.9606 28.6462 9.375C28.6462 9.7894 28.4815 10.1868 28.1885 10.4799C27.8955 10.7729 27.4981 10.9375 27.0837 10.9375H22.917C22.5026 10.9375 22.1052 10.7729 21.8121 10.4799C21.5191 10.1868 21.3545 9.7894 21.3545 9.375Z" fill="#E879F9" />
                    </svg>
                )}
            </div>
            <p className="text-center font-display text-label font-semibold leading-relaxed text-fuchsia-300/90">Profil Görseli <br /> Ekle</p>
        </div>
        <div className="flex flex-1 flex-col justify-between">
            <h4 className="mb-3 font-display text-sm font-semibold text-white">Profil Görseli — Temel Tavsiyeler</h4>
            <ul className="mb-5 flex flex-col gap-1.5">
                <li className="relative pl-3 text-caption leading-relaxed text-white/60 before:absolute before:left-0 before:text-fuchsia-400 before:content-['•']">Görsel kare formatta olmalıdır (ör. 1080x1080 px).</li>
                <li className="relative pl-3 text-caption leading-relaxed text-white/60 before:absolute before:left-0 before:text-fuchsia-400 before:content-['•']">Profil görseli kare yüklenir ancak sistemde daire şeklinde kırpılabilir.</li>
                <li className="relative pl-3 text-caption leading-relaxed text-white/60 before:absolute before:left-0 before:text-fuchsia-400 before:content-['•']">Bu nedenle logo, yüz veya simge tam ortada ve net şekilde görünmelidir.</li>
                <li className="relative pl-3 text-caption leading-relaxed text-white/60 before:absolute before:left-0 before:text-fuchsia-400 before:content-['•']">Kenarlara yerleştirilen öğeler kırpma sırasında kaybolabilir.</li>
            </ul>
            <label htmlFor="profile-upload" className="flex w-fit cursor-pointer items-center justify-center gap-2 rounded-lg border border-fuchsia-400/25 bg-fuchsia-400/[0.06] px-4 py-2.5 font-display text-label font-semibold text-fuchsia-300 transition-all duration-200 hover:border-fuchsia-400/45 hover:bg-fuchsia-400/[0.1]">
                <RefreshCw className="h-4 w-4" />
                Profil Görselini Değiştir
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
                    placeholder="Bot İsmi"
                    className={inputClass(showErrors && errors.botName)}
                    maxLength="20"
                />

                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Açıklama"
                    className={textareaClass(showErrors && errors.description)}
                    maxLength="300"
                ></textarea>

                <h4 className="mb-5 flex items-center gap-2 font-display text-caption font-semibold uppercase tracking-[0.12em] text-fuchsia-400/70 max-md:mb-3">Davranış Ayarları</h4>

                <div className="relative mb-6 w-full text-white transition-all duration-200 max-md:mb-3">
                    <div
                        onClick={() => setOpen(!open)}
                        className={cn(
                            "flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 transition-all duration-200 hover:border-fuchsia-400/20",
                            showErrors && errors.category && "border-rose-400/50 bg-rose-400/[0.06]",
                        )}
                    >
                        <span className="flex items-center gap-2 font-sans text-body text-white/90">
                            <Tag className="h-4 w-4 text-fuchsia-400/70" />
                            {selectedCategory ? selectedCategory.kategori_adi_tr : 'Kategori Seç'}
                        </span>
                        <div className={cn("flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] transition-transform duration-300", open && "rotate-180")}>
                            <ChevronDown className="h-3.5 w-3.5 text-white/70" />
                        </div>
                    </div>

                    {open && (
                        <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:grid-cols-3 md:grid-cols-5">
                            {categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "flex cursor-pointer items-center justify-center rounded-lg bg-white/[0.04] p-3 text-center font-display text-sm text-white/85 transition-colors duration-200 hover:bg-white/[0.08]",
                                        selectedCategory?.id === cat.id && "bg-gradient-btn text-white",
                                    )}
                                >
                                    {cat.kategori_adi_tr}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <textarea
                    name="stylePrompt"
                    value={formData.stylePrompt}
                    onChange={handleChange}
                    placeholder="Style Prompt*"
                    className={cn(
                        textareaClass(showErrors && errors.stylePrompt),
                        promptGenerationStatus === 'processing' && "border-fuchsia-400/50",
                    )}
                ></textarea>

                {formData.trainingPrompt && (
                    <div className="mb-4 mt-4 flex items-center justify-between gap-3 rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/[0.04] px-4 py-3">
                        <div className="flex flex-1 items-center gap-2.5">
                            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500/25 to-fuchsia-500/10">
                                <FileText className="h-[18px] w-[18px] text-fuchsia-300" />
                            </div>
                            <div>
                                <p className="text-label font-semibold text-fuchsia-300">
                                    Eğitim Verisi Birleştirildi
                                </p>
                                <p className="text-caption text-white/60">
                                    Toplam: <strong className="text-white/80">{formData.trainingPrompt.length.toLocaleString()}</strong> karakter
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setClearTrainingConfirmOpen(true)}
                            className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-label font-medium text-rose-400 transition-colors hover:bg-rose-500/20"
                        >
                            Sıfırla
                        </button>
                    </div>
                )}

                {/* --- DOSYA YÜKLEME VE ÖNİZLEME ALANI --- */}
                <div
                    onDrop={handleGeneralFileDrop}
                    onDragOver={handleGeneralDragOver}
                    onDragLeave={handleGeneralDragLeave}
                    onClick={() => generalFileInputRef.current?.click()}
                    className={cn(
                        "mb-6 flex h-[170px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.015] p-4 transition-all duration-200 hover:border-fuchsia-400/30 hover:bg-fuchsia-500/[0.03] max-md:mb-3",
                        isDragging && "scale-[1.01] border-fuchsia-400/60 bg-fuchsia-500/[0.08]",
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

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/10">
                        <Upload className="h-5 w-5 text-fuchsia-400" />
                    </div>
                    <p className="font-display text-body-sm font-medium text-white/80">Dosyalarını buraya sürükle ve bırak</p>
                    <p className="text-caption text-white/35">PDF veya görsel — otomatik olarak eğitim verisine eklenir</p>
                </div>

                {/* Yüklenen Belge Kutusu (Konumu burası, inputun hemen üstü) */}
                {uploadedFiles.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-3">
                        {uploadedFiles.map((f, index) => (
                            <div key={index} className="relative min-w-[120px] rounded-xl border border-fuchsia-400/25 bg-white/[0.03] p-4">
                                {f.status === 'processing' && <div className="absolute inset-x-0 top-0 rounded-t-md bg-black/70 p-1 text-center text-xs text-white">İşleniyor...</div>}
                                {f.status === 'error' && <div className="absolute inset-x-0 top-0 rounded-t-md bg-rose-500/80 p-1 text-center text-xs text-white">Hata</div>}
                                {f.url && f.type?.startsWith('image/') ? (
                                    <img src={f.url} alt={f.name} className="max-w-full rounded-md" />
                                ) : (
                                    <div className="text-center">
                                        <FileText className="mx-auto h-8 w-8 text-fuchsia-400" />
                                        <div className="mt-2 text-xs text-white/70">{f.name}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setUploadedFiles([])}
                            className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 text-body-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/20"
                        >
                            Dosyaları Temizle
                        </button>
                    </div>
                )}

                <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Sohbet Başı Mesajı"
                    className={textareaClass(showErrors && errors.message)}
                    maxLength="300"
                ></textarea>

                {!independentMode && (
                    <div className="my-5 w-full font-display text-white">
                        <h3 className="mb-1.5 text-caption font-semibold uppercase tracking-[0.12em] text-fuchsia-400/70">Fiyatlandırma</h3>
                        <p className="mb-6 max-w-2xl text-body-sm leading-relaxed text-white/55">
                            Yapay zekânızın haftalık ve aylık satış fiyatını belirleyiniz. Belirlediğiniz ücretler, kullanıcıların yapay zekânıza erişim bedeli olarak uygulanır
                            ve kazanç hesabında esas alınır. Aylık fiyat için haftalık fiyatın 4 katının %10 indirimlisi önerilir, ancak dilediğiniz gibi düzenleyebilirsiniz.
                        </p>

                        <div className="flex flex-col items-start gap-5 md:flex-row">
                            <div className="flex w-full flex-1 flex-col gap-3">
                                <div className={cn(
                                    "flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-4 transition-all duration-200 focus-within:border-fuchsia-400/30",
                                    showErrors && errors.weeklyPrice && "border-rose-400/50 bg-rose-400/[0.06]",
                                )}>
                                    <label htmlFor="weeklyPrice" className="mb-1 text-body-sm text-white/60">Belirlediğin satış fiyatı (Bir Haftalık)</label>
                                    <div className="flex items-center justify-between">
                                        <input
                                            id="weeklyPrice"
                                            type="number"
                                            name="weeklyPrice"
                                            value={formData.weeklyPrice}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full bg-transparent font-display text-xl font-bold text-white outline-none placeholder:text-white/30"
                                        />
                                        <span className="ml-2.5 text-xl font-bold text-fuchsia-400">₺</span>
                                    </div>
                                </div>
                                <p className="text-caption text-white/40">
                                    İzin verilen aralık: {MIN_WEEKLY_PRICE}₺ – {MAX_WEEKLY_PRICE.toLocaleString('tr-TR')}₺
                                </p>

                                <div className={cn(
                                    "flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-4 transition-all duration-200 focus-within:border-fuchsia-400/30",
                                    showErrors && errors.monthlyPrice && "border-rose-400/50 bg-rose-400/[0.06]",
                                )}>
                                    <label htmlFor="monthlyPrice" className="mb-1 text-body-sm text-white/60">Belirlediğin satış fiyatı (Bir Aylık)</label>
                                    <div className="flex items-center justify-between">
                                        <input
                                            id="monthlyPrice"
                                            type="number"
                                            name="monthlyPrice"
                                            value={formData.monthlyPrice}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full bg-transparent font-display text-xl font-bold text-white outline-none placeholder:text-white/30"
                                        />
                                        <span className="ml-2.5 text-xl font-bold text-fuchsia-400">₺</span>
                                    </div>
                                </div>
                                <p className="text-caption text-white/40">
                                    İzin verilen aralık: {MIN_WEEKLY_PRICE}₺ – {(MAX_WEEKLY_PRICE * 4).toLocaleString('tr-TR')}₺
                                </p>
                            </div>

                            <div className="relative w-full flex-1 overflow-hidden rounded-2xl border border-fuchsia-400/15 bg-gradient-to-br from-[#1a1030] via-[#150d28] to-[#0d0a1c] p-5">
                                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-600/[0.08] blur-[70px]" />
                                <p className="relative flex items-center justify-between text-body-sm text-white/60">
                                    Haftalık satıştan kazancın
                                    <span className="font-display text-lg font-bold text-white">{(formData.weeklyPrice * SELLER_COMMISSION_WEEKLY).toFixed(2)} ₺</span>
                                </p>
                                <p className="relative mt-3 flex items-center justify-between text-body-sm text-white/60">
                                    Aylık satıştan kazancın
                                    <span className="font-display text-lg font-bold text-white">{(formData.monthlyPrice * SELLER_COMMISSION_MONTHLY).toFixed(2)} ₺</span>
                                </p>
                                {formData.weeklyPrice > 0 && (
                                    <p className="relative mt-4 border-t border-white/[0.06] pt-4 text-body-sm leading-relaxed text-white/70">
                                        Alıcıların bu fiyatla, 1 haftalık satın almada <b className="text-fuchsia-300">{calculateMessageAllowance(Number(formData.weeklyPrice))} mesaj hakkı</b>
                                        {formData.monthlyPrice > 0 && (
                                            <>, 1 aylık satın almada <b className="text-fuchsia-300">{calculateMessageAllowance(Number(formData.monthlyPrice) * 0.95)} mesaj hakkı</b></>
                                        )} kazanacak.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showErrors && Object.keys(errors).length > 0 && (
                    <div className="mb-4 flex w-full items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-400/[0.06] p-4">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                        <div>
                            <h4 className="mb-2 font-display text-body-sm font-semibold text-rose-400">Lütfen aşağıdaki hataları düzeltin</h4>
                            <ul className="flex flex-col gap-1">
                                {errors.botName && <li className="text-body-sm leading-relaxed text-rose-300/90">• {errors.botName}</li>}
                                {errors.description && <li className="text-body-sm leading-relaxed text-rose-300/90">• {errors.description}</li>}
                                {errors.category && <li className="text-body-sm leading-relaxed text-rose-300/90">• {errors.category}</li>}
                                {errors.stylePrompt && <li className="text-body-sm leading-relaxed text-rose-300/90">• {errors.stylePrompt}</li>}
                                {errors.message && <li className="text-body-sm leading-relaxed text-rose-300/90">• {errors.message}</li>}
                                {errors.coverImage && <li className="text-body-sm leading-relaxed text-rose-300/90">• {errors.coverImage}</li>}
                                {errors.profileImage && <li className="text-body-sm leading-relaxed text-rose-300/90">• {errors.profileImage}</li>}
                                {errors.weeklyPrice && <li className="text-body-sm leading-relaxed text-rose-300/90">• {errors.weeklyPrice}</li>}
                                {errors.monthlyPrice && <li className="text-body-sm leading-relaxed text-rose-300/90">• {errors.monthlyPrice}</li>}
                            </ul>
                        </div>
                    </div>
                )}

                <div className="mt-5 flex w-full items-center justify-end">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-auto min-w-[160px] gap-2.5 py-3 text-body-lg"
                    >
                        {isSubmitting && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-white" />
                        )}
                        <span>
                            {isSubmitting ? submitStatusText : (bot ? "Güncelle" : "Yayınla")}
                        </span>
                    </Button>
                </div>
            </form>

            <DeleteConfirmModal
                isOpen={clearTrainingConfirmOpen}
                onClose={() => setClearTrainingConfirmOpen(false)}
                onConfirm={() => {
                    setFormData(prev => ({ ...prev, trainingPrompt: '' }));
                    setUploadedFiles([]);
                    setClearTrainingConfirmOpen(false);
                }}
                title="Eğitim verisi temizlensin mi?"
                description="Tüm eğitim verisi temizlensin mi?"
                confirmLabel="Temizle"
            />
        </div>
  )
}

export default ChatbotForm