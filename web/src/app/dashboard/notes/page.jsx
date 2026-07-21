'use client';
import { useEffect, useState } from 'react';
import { resolveAvatarSrc } from "@/shared/lib/image";
import CategoryFilter from '@/widgets/CategoryFilter';
import { useRouter } from 'next/navigation';
import DialogueModal from '@/features/notes/DialogueModal';
import ShareModal from '@/features/sharing/ShareModal';
import ReportModal from '@/features/moderation/ReportModal';
import AddToListModal from '@/features/lists/AddToListModal';
import NotesEmpty from '@/features/notes/NotesEmpty';
import DeleteConfirmModal from '@/shared/ui/DeleteConfirmModal';
import { ChevronDown, Check, MoreVertical, Share2, Trash2, EyeOff, Flag } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/shared/ui/dropdown-menu';
import { Card } from '@/shared/ui/card';
import { cn } from '@/lib/utils';
import { toast } from '@/shared/hooks/use-toast';
import { PageLayout, PageHeader, CardGrid } from '@/shared/ui/page-layout';

export default function DialoguePage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filtered, setFiltered] = useState('Tümü');
    const [tab, setTab] = useState("all");
    const [selectedChatbotId, setSelectedChatbotId] = useState(null);
    const [selectedHistory, selectHistory] = useState([]);
    const [hiddenBotIds, setHiddenBotIds] = useState([]);
    const [userId, setUserId] = useState(null);
    const [categories, setCategories] = useState([]);

    const [histories, setHistories] = useState([]);

    const filteredCards = (() => {
        // 1. Önce gizlenen botları ve sekmeleri (SYSTEM/mine) filtrele
        let sourceCards = histories.filter(h => !hiddenBotIds.includes(h.conversation_chatbot_id));

        if (tab === "all") {
            /*sourceCards = sourceCards.filter(h => h.owner_kullanici_adi === "SYSTEM");*/
        } else if (tab === "mine") {
            sourceCards = sourceCards.filter(h => h.user_id === userId);
        }

        // 2. Kategori Filtresi (ID bazlı)
        // Seçili kategorinin objesini buluyoruz
        const selectedCatObj = categories.find(c => c.kategori_adi_tr === filtered);
        
        const finalFiltered = (filtered === 'Tümü' || !selectedCatObj)
            ? sourceCards
            : sourceCards.filter(card => card.chatbot_kategori_id == selectedCatObj.id);

        // 3. Map işlemi
        return finalFiltered.map(historyItem => ({
            ...historyItem,
            title: historyItem.name || 'Yeni Diyalog',
            description: historyItem.input_message + '... ' + (historyItem.output_message || 'Yanıt bekleniyor...'),
            tag: historyItem.chatbot_isim,
            id: historyItem.id
        }));
    })();

    const [shareOpen, setShareOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [showFeedbackBadge, setShowFeedbackBadge] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteTargetIndex, setDeleteTargetIndex] = useState(null);
    const [hideBotConfirmTarget, setHideBotConfirmTarget] = useState(null);

    const handleCloseModal = () => setIsModalOpen(false);

    useEffect(() => {
            async function checkSession() {
                    try {
                        const res = await fetch("/api/auth/sessioncheck.php", {
                        credentials: "include", // cookie'yi gönder
                        });
                        const resultText = await res.text();
                        const result = JSON.parse(resultText);
        
                        if (result.authenticated) {
                        setUserId(result.user_id);
                        } else {
                        // router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
                        }
                    } catch (err) {
                        console.error("Session check error:", err);
                        // router.push("/login"); // Giriş kontrolü geçici olarak devre dışı - proje sonunda düzeltilecek
                    }
                }
                checkSession();
    
            
            fetch('/api/content/getcategories.php')
            .then(async res => {
                try {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        const allCats = [{ id: 'all', kategori_adi_tr: 'Tümü' }, ...data];
                        setCategories(allCats);
                    }
                } catch (e) { console.error(e); }
            });
            
        },[]);
    
    useEffect(() => {
        if(!userId) return;

        fetch(`/api/social/gethide.php?user_id=${userId}`)
        .then(async res => {
            try
            {
                const data = await res.json();
                // gethide.php returns {success, hidden: [chatbotId, ...]} —
                // a flat id array under a wrapper key, not bare objects.
                if(Array.isArray(data?.hidden))
                {
                    setHiddenBotIds(data.hidden.map(Number));
                }
            }
            catch (e) { console.error("Hide list error:", e); }
        });

        fetch('/api/note/getdialogues.php')
        .then(async res => {
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                if(Array.isArray(data?.dialogues)) {
                    setHistories(data.dialogues); // Histories state'ini güncelle
                }
            } catch (e) { console.error(e); }
        });
    },[userId]);

    const handleHideBot = (e, targetChatbotId) => {
        e.stopPropagation();
        setHideBotConfirmTarget(targetChatbotId);
    };

    const confirmHideBot = async () => {
        const targetChatbotId = hideBotConfirmTarget;
        setHideBotConfirmTarget(null);

        // 1. API İstek Hazırlığı
        const payload = {
            user_id: userId,
            chatbot_id: targetChatbotId
        };

        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));

        try {
            const response = await fetch('/api/social/addhide.php', {
                method: 'POST',
                body: formData
            });
            
            const resultText = await response.text();
            const result = JSON.parse(resultText);

            if (result.success) {
                // 2. State Güncelleme (Kartları Uçurma)
                // Histories içindeki her bir item'ın chatbot_id'sine bakıyoruz
                setHiddenBotIds(prev => [...prev, targetChatbotId]);
                
                setHistories(prev => prev.filter(h => h.conversation_chatbot_id !== targetChatbotId));
                
                setShowFeedbackBadge(true);
                setMenuOpenIndex(null); // Menüyü kapat
                
                setTimeout(() => setShowFeedbackBadge(false), 2000);
            } else {
                toast({ variant: "destructive", title: "Bir hata oluştu", description: result.message });
            }
        } catch (error) {
            console.error("Hata:", error);
            toast({ variant: "destructive", title: "Sunucuyla bağlantı kurulamadı." });
        }
    };

    const handleDelete = (indexToRemove) => {
        const cardToRemove = filteredCards[indexToRemove];
        const historyId = cardToRemove.id; // Diyalog ID'si

        // histories state'inden silme işlemi
        setHistories(prev => prev.filter(h => h.id !== historyId));

        setDeleteModalVisible(false);
        setDeleteTargetIndex(null);
    };

    const sortOptions = [
        { label: "Tüm Paylaşılanlar", value: "all" }, // Yeni tanım
        { label: "Paylaştıklarım", value: "mine" }, // userId ile eşleşenler
    ];
    
    return (
        <>
            <PageLayout className="relative">
                <PageHeader
                    className="z-10"
                    eyebrow="Arşiv"
                    title="Diyalog Defteri"
                    action={(
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-5 py-3 text-[13px] font-medium text-fuchsia-200 transition-colors hover:bg-fuchsia-500/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                    {sortOptions.find(o => o.value === tab)?.label || "Filtrele"}
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[190px]">
                                {sortOptions.map(opt => (
                                    <DropdownMenuItem
                                        key={opt.value}
                                        onClick={() => setTab(opt.value)}
                                        className={cn('justify-between', tab === opt.value && 'text-fuchsia-300')}
                                    >
                                        {opt.label}
                                        {tab === opt.value && <Check className="h-3.5 w-3.5" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                />

                {(categories.length > 0) && (
                    <CategoryFilter
                        categories={categories} // Direkt obje dizisini gönder
                        onSelect={(catName) => setFiltered(catName)} // Gelen veri string: "Aşk"
                        selected={filtered} // Gönderilen veri string: "Tümü" veya "Aşk"
                    />
                )}

                {filteredCards.length == 0 && <NotesEmpty />}

                {filteredCards.length > 0 && (
                                <CardGrid className="mt-6">
                                    {filteredCards.map((card, index) => (
                                        <Card
                                            interactive
                                            role="button"
                                            tabIndex={0}
                                            className="flex cursor-pointer flex-col gap-2.5 p-3 animate-[fadeInUp_0.4s_ease-out_forwards]"
                                            key={card.id}
                                            onClick={(e) => { selectHistory(card); setIsModalOpen(true) }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    selectHistory(card); setIsModalOpen(true);
                                                }
                                            }}
                                        >
                                            <div className="relative max-h-[250px] overflow-hidden rounded-xl bg-luma-input p-3.5 text-[11px] leading-relaxed after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:h-4/5 after:w-full after:rounded-xl after:bg-[linear-gradient(to_top,#111120,transparent)] after:content-['']">
                                                <span className="font-sans text-[12.5px] font-semibold text-white/85">{card.title}</span>
                                                <p className="mt-1 text-[11.5px] text-white/55">{card.description}</p>
                                            </div>
                                            <div className="flex items-center justify-between px-0.5">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <img src={card.chatbot_profil_fotografi || resolveAvatarSrc(null).src} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-fuchsia-400/20" />
                                                    <div className="flex min-w-0 flex-col gap-0.5">
                                                        <span className="truncate text-[11.5px] font-medium text-white/85">{card.name}</span>
                                                        <span className="truncate text-[10px] text-white/40">{card.chatbot_isim} · {card.owner_kullanici_adi}</span>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/40 transition-all hover:bg-fuchsia-500/10 hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            onClick={(e) => e.stopPropagation()}
                                                            aria-label="Diğer seçenekler"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                        {tab === "mine" ? (
                                                            <>
                                                                <DropdownMenuItem onClick={() => setShareOpen(true)}>
                                                                    <Share2 className="h-4 w-4" /> Paylaş
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-rose-400 focus:text-rose-400"
                                                                    onClick={() => { setDeleteTargetIndex(index); setDeleteModalVisible(true); }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" /> Sil
                                                                </DropdownMenuItem>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <DropdownMenuItem onClick={() => { setSelectedChatbotId(card.conversation_chatbot_id); setShareOpen(true); }}>
                                                                    <Share2 className="h-4 w-4" /> Paylaş
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={(e) => handleHideBot(e, card.conversation_chatbot_id)}>
                                                                    <EyeOff className="h-4 w-4" /> Bu Profili Önermeyin
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-rose-400 focus:text-rose-400"
                                                                    onClick={() => setReportOpen(true)}
                                                                >
                                                                    <Flag className="h-4 w-4" /> Bildir
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </Card>
                                    ))}
                                </CardGrid>
                            )}

                    <DialogueModal isOpen={isModalOpen} onClose={handleCloseModal} selectedHistory={selectedHistory} />
                    <ShareModal isOpen={shareOpen} urlId={selectedChatbotId} onClose={() => {setShareOpen(false); setSelectedChatbotId(null);}} />
                    <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
                    <AddToListModal isOpen={modalVisible} onClose={() => setModalVisible(false)} lists={[]} />
                    <DeleteConfirmModal
                        isOpen={deleteModalVisible}
                        onClose={() => setDeleteModalVisible(false)}
                        onConfirm={() => {
                            handleDelete(deleteTargetIndex);
                            setDeleteModalVisible(false);
                            setDeleteTargetIndex(null);
                        }}
                    />
                    <DeleteConfirmModal
                        isOpen={hideBotConfirmTarget !== null}
                        onClose={() => setHideBotConfirmTarget(null)}
                        onConfirm={confirmHideBot}
                        title="Bu profili gizle"
                        description="Bu botu bir daha size önermeyeceğiz. Onaylıyor musunuz?"
                        confirmLabel="Onayla"
                    />

                    {showFeedbackBadge && (
                        <div className="fixed bottom-6 right-6 px-3 py-1.5 rounded-lg bg-fuchsia-400 text-white text-[13px] font-medium pointer-events-none z-[999999] animate-[fadeInOut_2s_ease_forwards]">
                            Uyarınız alındı
                        </div>
                    )}

            </PageLayout>
        </>
    );
}