'use client';
import { useEffect, useRef, useState } from 'react';
import Masonry from 'react-masonry-css';
import avatar from "../../../images/avatar-bot.jpg";
import CategoryFilter from '@/app/components/CategoryFilter/CategoryFilter';
import { useRouter } from 'next/navigation';
import DialogueModal from '@/app/components/DialogueModal';
import ShareModal from '@/app/components/ShareModal/ShareModal';
import ReportModal from '@/app/components/ReportModal/ReportModal';
import AddToListModal from '@/app/components/AddToListModal/AddToListModal';
import NotesEmpty from '@/app/components/NotesEmpty/NotesEmpty';
import DeleteConfirmModal from '@/app/components/DeleteConfirmModal';

// cards ve myCards sabitlerini kaldırdım/yorum satırına aldım
/* 
const cards = [ ... ]; // Kaldırıldı
const myCards = [ ... ]; // Kaldırıldı
*/

/* const myCards =[]
const cards =[]; */

export default function DialoguePage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filtered, setFiltered] = useState('Tümü');
    // const [allCards, setAllCards] = useState(cards); // Kaldırıldı
    // const [myCardsState, setMyCardsState] = useState(myCards); // Kaldırıldı
    const [tab, setTab] = useState("all"); // 'all' artık "Paylaşılanlar" (botla olanlar) ve 'mine' ise "Paylaştıklarım" (user_id ile eşleşenler) olacak
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [selectedChatbotId, setSelectedChatbotId] = useState(null);
    const [selectedHistory, selectHistory] = useState([]);
    const [hiddenBotIds, setHiddenBotIds] = useState([]);
    const [userId, setUserId] = useState(null);
    const [categories, setCategories] = useState([]);

    const [histories, setHistories] = useState([]); // Sadece histories state'i kalacak

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
    // const [histories, setHistories] = useState([]); // State tanımı yukarı taşındı

    const handleCloseModal = () => setIsModalOpen(false);

    const toggleMenu = (index) => setMenuOpenIndex(prev => (prev === index ? null : index));

    useEffect(() => {
        async function checkSession() {
                try {
                    const res = await fetch("/api/sessioncheck.php", {
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

        
        fetch('/api/getcategories.php')
        .then(async res => {
            try {
                const data = await res.json();
                if (Array.isArray(data)) {
                    // "Tümü" seçeneğini manuel ekleyip objeleri saklıyoruz
                    const allCats = [{ id: 'all', kategori_adi_tr: 'Tümü' }, ...data];
                    setCategories(allCats);
                }
            } catch (e) { console.error(e); }
        });
        /*.then(async res => {
            const text = await res.text();
            console.log(text);
            try {
                const data = JSON.parse(text);
                if (Array.isArray(data)) {
                    // Obje dizisini, sadece isimlerden oluşan string dizisine çeviriyoruz
                    const stringCategories = data.map(item => 
                        typeof item === 'object' ? item.kategori_adi_tr : item
                    );
                    
                    // Başına "Tümü" ekleyip kaydediyoruz
                    setCategories(["Tümü", ...stringCategories]);
                    // console.log(categories); // Dikkat: State güncellemesi asenkrondur, burada eski değeri görebilirsin
                }
            } catch (e) { console.error(e); }
        });*/
    },[]);

    useEffect(() => {
        if(!userId) return;

        fetch(`/api/gethide.php?user_id=${userId}`)
        .then(async res => {
            try
            {
                const data = await res.json();
                if(Array.isArray(data))
                {
                    const ids = data.map(item => item.chatbot_id);
                    setHiddenBotIds(ids);
                }
            }
            catch (e) { console.error("Hide list error:", e); }
        });

        fetch('/api/getdialogues.php')
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
            const response = await fetch('/api/addhide.php', {
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

    /*const handleHideBot = (e, index) => {
        e.stopPropagation();
        const cardToRemove = filteredCards[index];
        const historyId = cardToRemove.id; // Diyalog ID'si

        // histories state'inden silme işlemi
        setHistories(prev => prev.filter(h => h.id !== historyId));

        setShowFeedbackBadge(true);
        setMenuOpenIndex(null);
        setTimeout(() => setShowFeedbackBadge(false), 2000);
    };*/

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

    // ... (return kısmı benzer kalacak, sadece kart içeriği map'lenen veriye göre değişti)

    return (
        <div className="dialogue-wrapper">
            <div className="dialogue-header">
                <h2>Diyalog Defteri</h2>

                <div className="notes-filter-select">
                    <button
                        className="notes-filter-btn"
                        onClick={() => setShowSortMenu((v) => !v)} // BURASI!
                    >

                        <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.03 0L16 1.07812L8 10L0 1.07812L0.965 0L8 7.83854L15.03 0Z" fill="#FF66C4" />
                        </svg>
                        <span>{sortOptions.find(o => o.value === tab)?.label || "Filtrele"}</span>
                    </button>
                    {showSortMenu && (
                        <div className="market-filter-dropdown">
                            {sortOptions.map(opt => (
                                <div
                                    key={opt.value}
                                    className={`filter-option${tab === opt.value ? " active" : ""}`}
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
                <CategoryFilter
                    categories={categories} // Direkt obje dizisini gönder
                    onSelect={(catName) => setFiltered(catName)} // Gelen veri string: "Aşk"
                    selected={filtered} // Gönderilen veri string: "Tümü" veya "Aşk"
                />
            )}

            {filteredCards.length == 0 &&
                <NotesEmpty />}

            {filteredCards.length > 0 && (
                <Masonry
                    breakpointCols={breakpoints}
                    className="my-masonry-grid"
                    columnClassName="my-masonry-grid_column"
                >
                    {filteredCards.map((card, index) => (
                        <div
                            className="dialogue-card"
                            key={card.id}

                            onClick={(e) => { selectHistory(card); setIsModalOpen(true) }}
                            style={{ cursor: 'pointer' }}
                        >

                            <div className="card-content">
                                {/* Başlık olarak card.title (name/id) ve description olarak mesaj içeriği */}
                                <span className="card-title">{card.conversation_chatbot_id} - {card.title}</span> 
                                <p>{card.description}</p>
                            </div>
                            <div className="card-footer">
                                <div className="left">
                                    <div className="icon">
                                        <img src={card.chatbot_profil_fotografi} alt="" />
                                    </div>
                                    <div className='left-item'>
                                        <span className="card-title">{card.name}</span>
                                        <span className="card-sub">{card.chatbot_isim} ({card.owner_kullanici_adi})</span> {/* Tag olarak chatbot_isim gösterildi */}
                                    </div>
                                </div>
                                <div className="menu-wrapper" ref={(el) => (menuRefs.current[index] = el)}>
                                    <div className="menu-icon" onClick={(e) => { e.stopPropagation(); toggleMenu(index); }}>
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9.02286 12.367C9.39152 12.367 9.74508 12.5135 10.0058 12.7742C10.2664 13.0348 10.4129 13.3884 10.4129 13.7571C10.4129 14.1257 10.2664 14.4793 10.0058 14.74C9.74508 15.0007 9.39152 15.1471 9.02286 15.1471C8.65419 15.1471 8.30063 15.0007 8.03995 14.74C7.77926 14.4793 7.63281 14.1257 7.63281 13.7571C7.63281 13.3884 7.77926 13.0348 8.03995 12.7742C8.30063 12.5135 8.65419 12.367 9.02286 12.367ZM9.02286 7.50187C9.39152 7.50187 9.74508 7.64832 10.0058 7.909C10.2664 8.16969 10.4129 8.52325 10.4129 8.89191C10.4129 9.26057 10.2664 9.61413 10.0058 9.87482C9.74508 10.1355 9.39152 10.282 9.02286 10.282C8.65419 10.282 8.30063 10.1355 8.03995 9.87482C7.77926 9.61413 7.63281 9.26057 7.63281 8.89191C7.63281 8.52325 7.77926 8.16969 8.03995 7.909C8.30063 7.64832 8.65419 7.50187 9.02286 7.50187ZM9.02286 2.63672C9.39152 2.63672 9.74508 2.78317 10.0058 3.04385C10.2664 3.30454 10.4129 3.6581 10.4129 4.02676C10.4129 4.39542 10.2664 4.74899 10.0058 5.00967C9.74508 5.27035 9.39152 5.4168 9.02286 5.4168C8.65419 5.4168 8.30063 5.27035 8.03995 5.00967C7.77926 4.74899 7.63281 4.39542 7.63281 4.02676C7.63281 3.6581 7.77926 3.30454 8.03995 3.04385C8.30063 2.78317 8.65419 2.63672 9.02286 2.63672Z" fill="#8C8C8C" />
                                        </svg>
                                    </div>
                                    {menuOpenIndex === index && (
                                        <div className="popup-menu">
                                            <ul>
                                                {/* Bu menü öğelerinin (Listeye Kaydet, Paylaş, Bildir) işlemleri yeni data yapısına göre ayarlanmalı.
                                                   Özellikle "Paylaş" ve "Sil" (Bu Profili Önermeyin / Sil) işlemleri. */}
                                                {tab === "mine" ? (<>
                                                    {/* Paylaş */}
                                                    <li onClick={(e) => { e.stopPropagation(); setShareOpen(true) }}><span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path opacity="0.3" d="M18 6.5C18.5523 6.5 19 6.05228 19 5.5C19 4.94772 18.5523 4.5 18 4.5C17.4477 4.5 17 4.94772 17 5.5C17 6.05228 17.4477 6.5 18 6.5Z" fill="#FF99D6" />
                                                        <path opacity="0.3" d="M6 13.5C6.55228 13.5 7 13.0523 7 12.5C7 11.9477 6.55228 11.5 6 11.5C5.44772 11.5 5 11.9477 5 12.5C5 13.0523 5.44772 13.5 6 13.5Z" fill="#FF99D6" />
                                                        <path opacity="0.3" d="M18 20.5195C18.5523 20.5195 19 20.0718 19 19.5195C19 18.9672 18.5523 18.5195 18 18.5195C17.4477 18.5195 17 18.9672 17 19.5195C17 20.0718 17.4477 20.5195 18 20.5195Z" fill="#FF99D6" />
                                                        <path d="M18 16.58C17.24 16.58 16.56 16.88 16.04 17.35L8.91 13.2C8.96 12.97 9 12.74 9 12.5C9 12.26 8.96 12.03 8.91 11.8L15.96 7.69C16.5 8.19 17.21 8.5 18 8.5C19.66 8.5 21 7.16 21 5.5C21 3.84 19.66 2.5 18 2.5C16.34 2.5 15 3.84 15 5.5C15 5.74 15.04 5.97 15.09 6.2L8.04 10.31C7.5 9.81 6.79 9.5 6 9.5C4.34 9.5 3 10.84 3 12.5C3 14.16 4.34 15.5 6 15.5C6.79 15.5 7.5 15.19 8.04 14.69L15.16 18.85C15.11 19.06 15.08 19.28 15.08 19.5C15.08 21.11 16.39 22.42 18 22.42C19.61 22.42 20.92 21.11 20.92 19.5C20.92 17.89 19.61 16.58 18 16.58ZM18 4.5C18.55 4.5 19 4.95 19 5.5C19 6.05 18.55 6.5 18 6.5C17.45 6.5 17 6.05 17 5.5C17 4.95 17.45 4.5 18 4.5ZM6 13.5C5.45 13.5 5 13.05 5 12.5C5 11.95 5.45 11.5 6 11.5C6.55 11.5 7 11.95 7 12.5C7 13.05 6.55 13.5 6 13.5ZM18 20.52C17.45 20.52 17 20.07 17 19.52C17 18.97 17.45 18.52 18 18.52C18.55 18.52 19 18.97 19 19.52C19 20.07 18.55 20.52 18 20.52Z" fill="#FF99D6" />
                                                    </svg>
                                                    </span> Paylaş</li>
                                                    <hr />
                                                    <li onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteTargetIndex(index);
                                                        setDeleteModalVisible(true);
                                                    }}>
                                                        <span>
                                                            <svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M5 9.875C5 9.58 5 9.4325 5.09125 9.34125C5.1825 9.25 5.33 9.25 5.625 9.25H24.375C24.67 9.25 24.8175 9.25 24.9088 9.34125C25 9.4325 25 9.58 25 9.875V10.19C25 10.3025 25 10.36 24.9825 10.41C24.9674 10.4531 24.9431 10.4923 24.9113 10.525C24.8738 10.5625 24.8237 10.5875 24.7225 10.6388C23.9088 11.045 23.5025 11.2488 23.2063 11.5538C22.9532 11.8144 22.7599 12.1271 22.64 12.47C22.5 12.87 22.5 13.325 22.5 14.235V20.5C22.5 22.8575 22.5 24.035 21.7675 24.7675C21.035 25.5 19.8575 25.5 17.5 25.5H12.5C10.1425 25.5 8.965 25.5 8.2325 24.7675C7.5 24.035 7.5 22.8575 7.5 20.5V14.235C7.5 13.325 7.5 12.87 7.36 12.47C7.24007 12.1271 7.04683 11.8144 6.79375 11.5538C6.4975 11.2488 6.09125 11.045 5.2775 10.6388C5.20933 10.6103 5.14572 10.572 5.08875 10.525C5.05689 10.4923 5.03257 10.4531 5.0175 10.41C5 10.36 5 10.3025 5 10.19V9.875Z" fill="#FFE4E4" />
                                                                <path d="M12.585 5.9627C12.7275 5.8302 13.0412 5.7127 13.4787 5.62895C13.9808 5.5398 14.49 5.5002 15 5.5002C15.55 5.5002 16.085 5.5452 16.5212 5.62895C16.9575 5.7127 17.2712 5.8302 17.415 5.96395" stroke="#DB1F35" strokeLinecap="round" />
                                                                <path d="M18.75 14.875C18.75 14.5298 18.4702 14.25 18.125 14.25C17.7798 14.25 17.5 14.5298 17.5 14.875V21.125C17.5 21.4702 17.7798 21.75 18.125 21.75C18.4702 21.75 18.75 21.4702 18.75 21.125V14.875Z" fill="#DB1F35" />
                                                                <path d="M12.5 14.875C12.5 14.5298 12.2202 14.25 11.875 14.25C11.5298 14.25 11.25 14.5298 11.25 14.875V21.125C11.25 21.4702 11.5298 21.75 11.875 21.75C12.2202 21.75 12.5 21.4702 12.5 21.125V14.875Z" fill="#DB1F35" />
                                                            </svg>
                                                        </span>
                                                        Sil
                                                    </li>
                                                </>) : (

                                                    <>
                                                    {/* Paylaş */}
                                                    <li onClick={(e) => { e.stopPropagation(); setSelectedChatbotId(card.conversation_chatbot_id); setShareOpen(true) }}><span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path opacity="0.3" d="M18 6.5C18.5523 6.5 19 6.05228 19 5.5C19 4.94772 18.5523 4.5 18 4.5C17.4477 4.5 17 4.94772 17 5.5C17 6.05228 17.4477 6.5 18 6.5Z" fill="#FF99D6" />
                                                            <path opacity="0.3" d="M6 13.5C6.55228 13.5 7 13.0523 7 12.5C7 11.9477 6.55228 11.5 6 11.5C5.44772 11.5 5 11.9477 5 12.5C5 13.0523 5.44772 13.5 6 13.5Z" fill="#FF99D6" />
                                                            <path opacity="0.3" d="M18 20.5195C18.5523 20.5195 19 20.0718 19 19.5195C19 18.9672 18.5523 18.5195 18 18.5195C17.4477 18.5195 17 18.9672 17 19.5195C17 20.0718 17.4477 20.5195 18 20.5195Z" fill="#FF99D6" />
                                                            <path d="M18 16.58C17.24 16.58 16.56 16.88 16.04 17.35L8.91 13.2C8.96 12.97 9 12.74 9 12.5C9 12.26 8.96 12.03 8.91 11.8L15.96 7.69C16.5 8.19 17.21 8.5 18 8.5C19.66 8.5 21 7.16 21 5.5C21 3.84 19.66 2.5 18 2.5C16.34 2.5 15 3.84 15 5.5C15 5.74 15.04 5.97 15.09 6.2L8.04 10.31C7.5 9.81 6.79 9.5 6 9.5C4.34 9.5 3 10.84 3 12.5C3 14.16 4.34 15.5 6 15.5C6.79 15.5 7.5 15.19 8.04 14.69L15.16 18.85C15.11 19.06 15.08 19.28 15.08 19.5C15.08 21.11 16.39 22.42 18 22.42C19.61 22.42 20.92 21.11 20.92 19.5C20.92 17.89 19.61 16.58 18 16.58ZM18 4.5C18.55 4.5 19 4.95 19 5.5C19 6.05 18.55 6.5 18 6.5C17.45 6.5 17 6.05 17 5.5C17 4.95 17.45 4.5 18 4.5ZM6 13.5C5.45 13.5 5 13.05 5 12.5C5 11.95 5.45 11.5 6 11.5C6.55 11.5 7 11.95 7 12.5C7 13.05 6.55 13.5 6 13.5ZM18 20.52C17.45 20.52 17 20.07 17 19.52C17 18.97 17.45 18.52 18 18.52C18.55 18.52 19 18.97 19 19.52C19 20.07 18.55 20.52 18 20.52Z" fill="#FF99D6" />
                                                        </svg>
                                                        </span> Paylaş</li>
                                                        <hr />
                                                        <li onClick={(e) => handleHideBot(e, card.conversation_chatbot_id)}>
                                                            <span>
                                                                <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path opacity="0.2" d="M20.25 5.75V19.25C20.25 19.6478 20.092 20.0294 19.8107 20.3107C19.5294 20.592 19.1478 20.75 18.75 20.75H5.25C4.85218 20.75 4.47064 20.592 4.18934 20.3107C3.90804 20.0294 3.75 19.6478 3.75 19.25V5.75C3.75 5.35218 3.90804 4.97064 4.18934 4.68934C4.47064 4.40804 4.85218 4.25 5.25 4.25H18.75C19.1478 4.25 19.5294 4.40804 19.8107 4.68934C20.092 4.97064 20.25 5.35218 20.25 5.75Z" fill="#FF99D6" />
                                                                    <path d="M21 12.5C21 12.6989 20.921 12.8897 20.7803 13.0303C20.6397 13.171 20.4489 13.25 20.25 13.25H3.75C3.55109 13.25 3.36032 13.171 3.21967 13.0303C3.07902 12.8897 3 12.6989 3 12.5C3 12.3011 3.07902 12.1103 3.21967 11.9697C3.36032 11.829 3.55109 11.75 3.75 11.75H20.25C20.4489 11.75 20.6397 11.829 20.7803 11.9697C20.921 12.1103 21 12.3011 21 12.5Z" fill="#FF99D6" />
                                                                </svg>
                                                            </span>
                                                            Bu Profili Önermeyin</li>
                                                        <li onClick={(e) => { e.stopPropagation(); setReportOpen(true); console.log(2) }} ><span><svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path opacity="0.3" d="M9.1 5.5L5 9.6V15.4L9.1 19.5H14.9L19 15.4V9.6L14.9 5.5H9.1ZM12 17.5C11.45 17.5 11 17.05 11 16.5C11 15.95 11.45 15.5 12 15.5C12.55 15.5 13 15.95 13 16.5C13 17.05 12.55 17.5 12 17.5ZM13 14.5H11V7.5H13V14.5Z" fill="#FF99D6" />
                                                            <path d="M15.73 3.5H8.27L3 8.77V16.23L8.27 21.5H15.73L21 16.23V8.77L15.73 3.5ZM19 15.4L14.9 19.5H9.1L5 15.4V9.6L9.1 5.5H14.9L19 9.6V15.4Z" fill="#FF99D6" />
                                                            <path d="M12 17.5C12.5523 17.5 13 17.0523 13 16.5C13 15.9477 12.5523 15.5 12 15.5C11.4477 15.5 11 15.9477 11 16.5C11 17.0523 11.4477 17.5 12 17.5Z" fill="#FF99D6" />
                                                            <path d="M11 7.5H13V14.5H11V7.5Z" fill="#FF99D6" />
                                                        </svg>
                                                        </span> Bildir</li>
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

            <DialogueModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                selectedHistory={selectedHistory}
                // Eğer modal içeriğini histories'e göre ayarlayacaksanız, buraya history item'ı geçmeniz gerekebilir.
            />

            <ShareModal isOpen={shareOpen} urlId={selectedChatbotId} onClose={() => {setShareOpen(false); setSelectedChatbotId(null);}} />
            <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
            <AddToListModal
                isOpen={modalVisible}
                onClose={() => setModalVisible(false)}
                lists={[]}
            />

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
                <div className="profile-feedback-badge">
                    Uyarınız alındı
                </div>
            )}

        </div>
    );
}