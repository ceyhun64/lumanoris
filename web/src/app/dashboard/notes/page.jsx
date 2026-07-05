'use client';
import { useEffect, useRef, useState } from 'react';
import Masonry from 'react-masonry-css';
import avatar from "@/images/avatar-bot.jpg";
import CategoryFilter from '@/widgets/CategoryFilter';
import { useRouter } from 'next/navigation';
import DialogueModal from '@/features/notes/DialogueModal';
import ShareModal from '@/features/sharing/ShareModal';
import ReportModal from '@/features/moderation/ReportModal';
import AddToListModal from '@/features/lists/AddToListModal';
import NotesEmpty from '@/features/notes/NotesEmpty';
import DeleteConfirmModal from '@/shared/ui/DeleteConfirmModal';

export default function DialoguePage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filtered, setFiltered] = useState('Tümü');
    const [tab, setTab] = useState("all");
    const [showSortMenu, setShowSortMenu] = useState(false);
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

    const breakpoints = { default: 5, 1200: 4, 900: 3, 600: 2, 350: 1 };
    const [menuOpenIndex, setMenuOpenIndex] = useState(null);
    const menuRefs = useRef([]);

    const [shareOpen, setShareOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [showFeedbackBadge, setShowFeedbackBadge] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteTargetIndex, setDeleteTargetIndex] = useState(null);

    const handleCloseModal = () => setIsModalOpen(false);
    const toggleMenu = (index) => setMenuOpenIndex(prev => (prev === index ? null : index));
    
    useEffect(() => {
            async function checkSession() {
                    try {
                        const res = await fetch("/api/auth/sessioncheck.php", {
                        credentials: "include", // cookie'yi gönder
                        });
                        const resultText = await res.text();
                        console.log(resultText);
                        const result = JSON.parse(resultText);
        
                        if (result.authenticated) {
                        setUserId(result.user_id);
                        } else {
                        router.push("/login");
                        }
                    } catch (err) {
                        console.error("Session check error:", err);
                        router.push("/login");
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
            console.log("Dialogues:",text);
            try {
                const data = JSON.parse(text);
                if(Array.isArray(data)) {
                    setHistories(data); // Histories state'ini güncelle
                }
            } catch (e) { console.error(e); }
        });
    },[userId]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                menuOpenIndex !== null &&
                menuRefs.current[menuOpenIndex] &&
                !menuRefs.current[menuOpenIndex].contains(event.target)
            ) {
                setMenuOpenIndex(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpenIndex]);

    const handleHideBot = async (e, targetChatbotId) => {
        e.stopPropagation();
        
        const isConfirmed = window.confirm("Bu botu bir daha size önermeyeceğiz. Onaylıyor musunuz?");
        if (!isConfirmed) return;

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
                alert("Bir hata oluştu: " + result.message);
            }
        } catch (error) {
            console.error("Hata:", error);
            alert("Sunucuyla bağlantı kurulamadı.");
        }
    };

    const handleDelete = (indexToRemove) => {
        const cardToRemove = filteredCards[indexToRemove];
        const historyId = cardToRemove.id; // Diyalog ID'si

        // histories state'inden silme işlemi
        setHistories(prev => prev.filter(h => h.id !== historyId));

        setDeleteModalVisible(false);
        setDeleteTargetIndex(null);
        setMenuOpenIndex(null);
    };

    const sortOptions = [
        { label: "Tüm Paylaşılanlar", value: "all" }, // Yeni tanım
        { label: "Paylaştıklarım", value: "mine" }, // userId ile eşleşenler
    ];
    
    return (
        <>
            <div className="flex flex-col w-full h-full px-16 py-6 text-white relative max-[1100px]:px-4 max-[1100px]:py-8">
                <div className="flex justify-between items-center mb-10 z-10">
                    <h2 className="text-4xl max-[1100px]:text-base font-semibold font-display leading-[56px] max-[1100px]:leading-6 text-transparent bg-clip-text bg-[linear-gradient(323deg,#FF66C4_9.6%,#4699FF_108.66%)]">
                        Diyalog Defteri
                    </h2>

                    <div className="relative">
                        <button
                            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-dashed border-[#FF66C4] bg-[#100F17] text-white text-[15px] font-sans cursor-pointer hover:border-[#FF66C4] transition-colors"
                            onClick={() => setShowSortMenu((v) => !v)}
                        >
                            <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.03 0L16 1.07812L8 10L0 1.07812L0.965 0L8 7.83854L15.03 0Z" fill="#FF66C4" />
                            </svg>
                            <span>{sortOptions.find(o => o.value === tab)?.label || "Filtrele"}</span>
                        </button>
                        {showSortMenu && (
                            <div className="absolute right-0 top-[110%] z-[99] w-[170px] flex flex-col gap-2 px-5 py-3 rounded-lg bg-[#161630] shadow-[-6px_2px_14px_rgba(0,0,0,0.25)]">
                                {sortOptions.map(opt => (
                                    <div
                                        key={opt.value}
                                        className={`flex items-center cursor-pointer text-[13px] font-sans transition-colors duration-150 py-1 ${tab === opt.value ? 'text-indigo-400' : 'text-white hover:text-indigo-400'}`}
                                        onClick={() => {
                                            setTab(opt.value);
                                            setShowSortMenu(false);
                                        }}
                                    >
                                        <span>{opt.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {(categories.length > 0) && (
                    // Sayfa sarmalayıcısı px-16 (mobilde px-4) uyguluyor; CategoryFilter kendi
                    // px-6'sını zaten ekliyor, bu yüzden diğer sayfalarla aynı boyutta
                    // görünmesi için üst dolguyu burada iptal ediyoruz.
                    <div className="-mx-16 max-[1100px]:-mx-4">
                        <CategoryFilter
                            categories={categories} // Direkt obje dizisini gönder
                            onSelect={(catName) => setFiltered(catName)} // Gelen veri string: "Aşk"
                            selected={filtered} // Gönderilen veri string: "Tümü" veya "Aşk"
                        />
                    </div>
                )}

                {filteredCards.length == 0 && <NotesEmpty />}

                {filteredCards.length > 0 && (
                                <Masonry
                                    breakpointCols={breakpoints}
                                    className="my-masonry-grid"
                                    columnClassName="my-masonry-grid_column"
                                >
                                    {filteredCards.map((card, index) => (
                                        <div
                                            className="relative rounded-lg border border-white/[0.13] bg-luma-elevated p-2 mb-2 flex flex-col gap-2 cursor-pointer transition-all duration-200 hover:scale-[1.015] hover:shadow-[0_4px_20px_rgba(99,102,241,0.2)] animate-[fadeInUp_0.4s_ease-out_forwards]"
                                            key={card.id}
                                            onClick={(e) => { selectHistory(card); setIsModalOpen(true) }}
                                        >
                                            <div className="relative bg-[#1a1a2e] rounded-lg p-3 text-[11px] leading-relaxed mb-0 max-h-[250px] overflow-hidden after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-4/5 after:rounded-lg after:bg-[linear-gradient(to_top,#0B0B0F,transparent)] after:pointer-events-none">
                                                <span className="text-white/80 font-sans font-medium text-[12px]">{card.conversation_chatbot_id} - {card.title}</span>
                                                <p className="text-white/55 mt-1 text-[11px]">{card.description}</p>
                                            </div>
                                            <div className="flex justify-between items-center px-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <img src={card.chatbot_profil_fotografi} alt="" className="w-6 h-6 rounded-full border border-white/[0.12] object-cover shrink-0" />
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <span className="text-white text-[11px] font-normal truncate">{card.name}</span>
                                                        <span className="text-[#8C8C8C] text-[9px] truncate">{card.chatbot_isim} ({card.owner_kullanici_adi})</span>
                                                    </div>
                                                </div>
                                                <div className="relative shrink-0" ref={(el) => (menuRefs.current[index] = el)}>
                                                    <button className="flex items-center justify-center w-7 h-7 rounded-lg text-white/40 hover:text-white/80 hover:bg-indigo-500/10 transition-all" onClick={(e) => { e.stopPropagation(); toggleMenu(index); }}>
                                                        <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor">
                                                            <path d="M9 12.4a1.4 1.4 0 1 1 0 2.8A1.4 1.4 0 0 1 9 12.4ZM9 7.5a1.4 1.4 0 1 1 0 2.8A1.4 1.4 0 0 1 9 7.5ZM9 2.6a1.4 1.4 0 1 1 0 2.8A1.4 1.4 0 0 1 9 2.6Z" />
                                                        </svg>
                                                    </button>
                                                    {menuOpenIndex === index && (
                                                        <div className="absolute bottom-8 right-0 z-[99999] min-w-[200px] rounded-xl border border-indigo-400/12 bg-[#0E0E22] shadow-[0_8px_32px_rgba(0,0,0,0.55)] overflow-hidden py-1" onClick={(e) => e.stopPropagation()}>
                                                            <ul className="list-none flex flex-col">
                                                                {tab === "mine" ? (<>
                                                                    <li className="flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] text-white/75 hover:bg-indigo-500/10 hover:text-white cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); setShareOpen(true) }}>
                                                                        <span className="w-5 flex justify-center items-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 25" fill="none"><path opacity="0.3" d="M18 6.5C18.5523 6.5 19 6.05228 19 5.5C19 4.94772 18.5523 4.5 18 4.5C17.4477 4.5 17 4.94772 17 5.5C17 6.05228 17.4477 6.5 18 6.5Z" fill="#FF99D6" /><path d="M18 16.58C17.24 16.58 16.56 16.88 16.04 17.35L8.91 13.2C8.96 12.97 9 12.74 9 12.5C9 12.26 8.96 12.03 8.91 11.8L15.96 7.69C16.5 8.19 17.21 8.5 18 8.5C19.66 8.5 21 7.16 21 5.5C21 3.84 19.66 2.5 18 2.5C16.34 2.5 15 3.84 15 5.5C15 5.74 15.04 5.97 15.09 6.2L8.04 10.31C7.5 9.81 6.79 9.5 6 9.5C4.34 9.5 3 10.84 3 12.5C3 14.16 4.34 15.5 6 15.5C6.79 15.5 7.5 15.19 8.04 14.69L15.16 18.85C15.11 19.06 15.08 19.28 15.08 19.5C15.08 21.11 16.39 22.42 18 22.42C19.61 22.42 20.92 21.11 20.92 19.5C20.92 17.89 19.61 16.58 18 16.58Z" fill="#FF99D6" /></svg></span>
                                                                        Paylaş
                                                                    </li>
                                                                    <div className="h-px bg-indigo-400/10 mx-2" />
                                                                    <li className="flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); setDeleteTargetIndex(index); setDeleteModalVisible(true); }}>
                                                                        <span className="w-5 flex justify-center items-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                                                                        Sil
                                                                    </li>
                                                                </>) : (
                                                                    <>
                                                                    <li className="flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] text-white/75 hover:bg-indigo-500/10 hover:text-white cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedChatbotId(card.conversation_chatbot_id); setShareOpen(true) }}>
                                                                        <span className="w-5 flex justify-center items-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 25" fill="none"><path d="M18 16.58C17.24 16.58 16.56 16.88 16.04 17.35L8.91 13.2C8.96 12.97 9 12.74 9 12.5C9 12.26 8.96 12.03 8.91 11.8L15.96 7.69C16.5 8.19 17.21 8.5 18 8.5C19.66 8.5 21 7.16 21 5.5C21 3.84 19.66 2.5 18 2.5C16.34 2.5 15 3.84 15 5.5C15 5.74 15.04 5.97 15.09 6.2L8.04 10.31C7.5 9.81 6.79 9.5 6 9.5C4.34 9.5 3 10.84 3 12.5C3 14.16 4.34 15.5 6 15.5C6.79 15.5 7.5 15.19 8.04 14.69L15.16 18.85C15.11 19.06 15.08 19.28 15.08 19.5C15.08 21.11 16.39 22.42 18 22.42C19.61 22.42 20.92 21.11 20.92 19.5C20.92 17.89 19.61 16.58 18 16.58Z" fill="#FF99D6" /></svg></span>
                                                                        Paylaş
                                                                    </li>
                                                                    <div className="h-px bg-indigo-400/10 mx-2" />
                                                                    <li className="flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] text-white/75 hover:bg-indigo-500/10 hover:text-white cursor-pointer transition-colors" onClick={(e) => handleHideBot(e, card.conversation_chatbot_id)}>
                                                                        <span className="w-5 flex justify-center items-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 25" fill="none"><path opacity="0.2" d="M20.25 5.75V19.25C20.25 19.6478 20.092 20.0294 19.8107 20.3107C19.5294 20.592 19.1478 20.75 18.75 20.75H5.25C4.85218 20.75 4.47064 20.592 4.18934 20.3107C3.90804 20.0294 3.75 19.6478 3.75 19.25V5.75C3.75 5.35218 3.90804 4.97064 4.18934 4.68934C4.47064 4.40804 4.85218 4.25 5.25 4.25H18.75C19.1478 4.25 19.5294 4.40804 19.8107 4.68934C20.092 4.97064 20.25 5.35218 20.25 5.75Z" fill="#FF99D6" /><path d="M21 12.5C21 12.6989 20.921 12.8897 20.7803 13.0303C20.6397 13.171 20.4489 13.25 20.25 13.25H3.75C3.55109 13.25 3.36032 13.171 3.21967 13.0303C3.07902 12.8897 3 12.6989 3 12.5C3 12.3011 3.07902 12.1103 3.21967 11.9697C3.36032 11.829 3.55109 11.75 3.75 11.75H20.25C20.4489 11.75 20.6397 11.829 20.7803 11.9697C20.921 12.1103 21 12.3011 21 12.5Z" fill="#FF99D6" /></svg></span>
                                                                        Bu Profili Önermeyin
                                                                    </li>
                                                                    <li className="flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); setReportOpen(true); }}>
                                                                        <span className="w-5 flex justify-center items-center opacity-70"><svg width="18" height="18" viewBox="0 0 24 25" fill="none"><path opacity="0.3" d="M9.1 5.5L5 9.6V15.4L9.1 19.5H14.9L19 15.4V9.6L14.9 5.5H9.1ZM12 17.5C11.45 17.5 11 17.05 11 16.5C11 15.95 11.45 15.5 12 15.5C12.55 15.5 13 15.95 13 16.5C13 17.05 12.55 17.5 12 17.5ZM13 14.5H11V7.5H13V14.5Z" fill="#FF99D6" /><path d="M15.73 3.5H8.27L3 8.77V16.23L8.27 21.5H15.73L21 16.23V8.77L15.73 3.5ZM19 15.4L14.9 19.5H9.1L5 15.4V9.6L9.1 5.5H14.9L19 9.6V15.4Z" fill="#FF99D6" /></svg></span>
                                                                        Bildir
                                                                    </li>
                                                                    </>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </Masonry>
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

                    {showFeedbackBadge && (
                        <div className="fixed bottom-6 right-6 px-3 py-1.5 rounded-lg bg-indigo-400 text-white text-[13px] font-medium pointer-events-none z-[999999] animate-[fadeInOut_2s_ease_forwards]">
                            Uyarınız alındı
                        </div>
                    )}
                
            </div>
        </>
    );
}