"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';

export default function Explore() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState("Tümü");
    const [selectedBots, setSelectedBots] = useState([]);
    const [isFromList, setIsFromList] = useState(false);
    const [listName, setListName] = useState("");
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 
    
    const [categories, setCategories] = useState([{ id: 0, kategori_adi_tr: "Tümü" }]); 
    const [apiBots, setApiBots] = useState([]); 
    const [searchTerm, setSearchTerm] = useState(""); // Bu state şimdi hem URL'den okunacak hem de filtrelemede kullanılacak

    const [sortType, setSortType] = useState("populer");
    const [showSortMenu, setShowSortMenu] = useState(false);
    const sortMenuRef = useRef(null);

    const sortOptions = [
        { label: "Önerilen", value: "populer", info: true },
        { label: "En düşük fiyat", value: "fiyat-asc" },
        { label: "En yüksek fiyat", value: "fiyat-desc" },
        { label: "En favoriler", value: "favori" },
        { label: "En çok listeye eklenen", value: "liste" },
        { label: "En yeniler", value: "yeni" },
        { label: "En çok diyalog", value: "diyalog" },
        { label: "En çok değerlendirilen", value: "deger" },
    ];

    // --- Kategori Çekme (Aynı) ---
    const fetchCategories = useCallback(async () => {
        try {
            const response = await fetch("/api/content/getcategories.php"); 
            if (!response.ok) throw new Error(`Kategori HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (data.success === false) throw new Error(data.message || "Kategori API'sinden hata alındı.");

            const allCategories = [{ id: 0, kategori_adi_tr: "Tümü" }, ...data];
            setCategories(allCategories);
            
        } catch (e) {
            console.warn("Kategoriler yüklenemedi. Sadece 'Tümü' gösterilecek.", e);
        }
    }, []);

    // --- Bot Çekme (SADECE İLK RENDER'DA ÇALIŞACAK) ---
    const fetchAllBots = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // ARAMA PARAMETRESİ OLMAYAN/BOŞ ARAMA İÇİN ÇEKİYORUZ
            const response = await fetch(`/api/chatbot/getchatbots.php?search=`); 
            
            if (!response.ok) throw new Error(`Bot HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (data.success === false) throw new Error(data.message || "Bot API'sinden hata alındı.");

            setApiBots(data); 
            setSelectedBots([]); 

        } catch (e) {
            console.error("Botlar çekilirken hata oluştu:", e);
            setError(e.message);
            setApiBots([]); 
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Lokal Storage İşlemleri (Aynı) ---
    const getUserLists = () => {
        if (typeof window !== "undefined") {
            const lists = localStorage.getItem('userLists');
            return lists ? JSON.parse(lists) : [];
        }
        return [];
    };

    const addBotsToList = (listName, botIds) => {
        const lists = getUserLists();
        const selectedBotData = botIds.map(id => apiBots.find(bot => bot.id === id)).filter(Boolean);
        
        const existingListIndex = lists.findIndex(list => list.name === listName);
        
        if (existingListIndex >= 0) {
            lists[existingListIndex].bots = [...lists[existingListIndex].bots, ...selectedBotData];
        } else {
            lists.push({
                name: listName,
                bots: selectedBotData,
                createdAt: new Date().toISOString()
            });
        }
        
        localStorage.setItem('userLists', JSON.stringify(lists));
        console.log(`"${listName}" listesine ${selectedBotData.length} bot eklendi`);
    };

    // --- URL PARAMETRELERİNİ OKUMA VE STATE'E YÜKLEME (BURADA DEĞİŞİKLİK VAR) ---
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const from = params.get("from");
            const name = params.get("name");
            const urlSearchTerm = params.get("search") || ""; // URL'den gelen search terimini oku

            setIsFromList(from === "list");
            setListName(name || '');
            
            // 1. URL'den gelen değeri searchTerm state'ine set et
            setSearchTerm(urlSearchTerm); 
            // 2. Input'un değerini de bu state'e bağladığımız için input da güncellenecek.
        }
    }, []);
    
    // İlk yüklemede sadece kategorileri çek.
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
      const handleClickOutside = (event) => {
          // Eğer menü açıksa VE tıklanan yer (event.target) menü (sortMenuRef) dışındaysa
          if (showSortMenu && sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
              setShowSortMenu(false);
          }
      };

      // Dinleyiciyi ekle
      document.addEventListener("mousedown", handleClickOutside);
      
      // Bileşen kapandığında dinleyiciyi temizle (Memory leak önlemek için)
      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
      };
  }, [showSortMenu]);

    // Botlar sadece ilk yüklemede çekilir — arama/filtreleme tamamen client-side
    // (filteredAndSortedBots) yapıldığı için searchTerm değiştiğinde tekrar fetch
    // etmek gereksizdi ve her tuş vuruşunda "loading" ekranını tetikleyip arama
    // kutusunu unmount ederek input'un fokusunu/imlecini kaybettiriyordu.
    useEffect(() => {
        fetchAllBots();
    }, [fetchAllBots]);


    // *** KATEGORİ, ARAMA VE SIRALAMA İLE İSTEMCİ TARAFINDA İŞLEMLER ***
  const filteredAndSortedBots = apiBots
    .filter(bot => {
        let matchesCategory = true;
        let matchesSearch = true;

        // 1. Kategori Filtreleme
        if (activeCategory !== "Tümü") {
            const selectedCategory = categories.find(cat => cat.kategori_adi_tr === activeCategory);
            if (selectedCategory) {
                matchesCategory = Number(bot.kategori_id) === Number(selectedCategory.id);
            } else {
                matchesCategory = false; 
            }
        }

        // 2. Arama Filtreleme
        if (searchTerm !== "") {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            matchesSearch = bot.isim.toLowerCase().includes(lowerCaseSearchTerm);
        }
        
        return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
        // 3. Sıralama Mantığı
        switch (sortType) {
            case "populer": // Önerilen: Chat ve Like sayısına göre karma bir puanlama
                const scoreA = (Number(a.toplam_chats) * 2) + Number(a.toplam_likes);
                const scoreB = (Number(b.toplam_chats) * 2) + Number(b.toplam_likes);
                return scoreB - scoreA;

            case "fiyat-asc": // En düşük fiyat
                return Number(a.ucret_haftalik) - Number(b.ucret_haftalik);

            case "fiyat-desc": // En yüksek fiyat
                return Number(b.ucret_haftalik) - Number(a.ucret_haftalik);

            case "favori": // En favoriler (Follows)
                return Number(b.toplam_follows) - Number(a.toplam_follows);

            case "liste": // En çok listeye eklenen
                return Number(b.toplam_lists) - Number(a.toplam_lists);

            case "yeni": // En yeniler
                return new Date(b.yayimlanma_tarih) - new Date(a.yayimlanma_tarih);

            case "diyalog": // En çok diyalog
                return Number(b.toplam_chats) - Number(a.toplam_chats);

            case "deger": // En çok değerlendirilen (Like + Dislike toplamı)
                const ratingsA = Number(a.toplam_likes) + Number(a.toplam_dislikes);
                const ratingsB = Number(b.toplam_likes) + Number(b.toplam_dislikes);
                return ratingsB - ratingsA;

            default:
                return 0;
        }
    });

    const toggleBotSelection = (botId) => {
        setSelectedBots((prev) =>
            prev.includes(botId) ? prev.filter(id => id !== botId) : [...prev, botId]
        );
    };

    const handleCardClick = (bot) => {
        if (isFromList) {
            toggleBotSelection(bot.id);
        } else {
            router.push(`/dashboard/chat?botId=${bot.id}`);
        }
    };
    
    if (loading) {
        return <div className="explore-wrapper">Yükleniyor...</div>;
    }

    if (error) {
        return <div className="explore-wrapper"><p style={{color: 'red'}}>Veri yüklenemedi: {error}</p></div>;
    }

    return (
      <div className="explore-wrapper">

        <div className="input-ctr">
          <input
            type="search"
            placeholder="Sohbet botu, uygulama veya kişi ara"
            value={searchTerm}
            // ARTIK onChange SADECE STATE'İ GÜNCELLEYECEK, BU DA ALTTOPRAĞI FİLTİLEME İÇİN TETİKLEYECEK
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button>
            {/* SVG KODU */}
            <svg
              width="24"
              height="25"
              viewBox="0 0 24 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 17.5625C14.3137 17.5625 17 14.8762 17 11.5625C17 8.24879 14.3137 5.5625 11 5.5625C7.68629 5.5625 5 8.24879 5 11.5625C5 14.8762 7.68629 17.5625 11 17.5625Z"
                fill="#FA9FFC"
                fillOpacity="0.12"
                stroke="#FF66C4"
                strokeWidth="1.2"
              />
              <path
                d="M20 20.5625L17 17.5625"
                stroke="#FF66C4"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Filtre Butonu Birebir */}
          <div className="relative" ref={sortMenuRef}>
            <button
              className="flex items-center gap-2 bg-transparent border border-dashed border-indigo-400 px-3 py-1.5 rounded-2xl text-white whitespace-nowrap hover:border-indigo-300 transition-colors text-[13px] font-sans cursor-pointer"
              onClick={() => setShowSortMenu((v) => !v)}
            >
              <svg width="14" height="14" viewBox="-4 -4 24 24" fill="none">
                <path d="M0.32 3.328L6.4 9.728V15.618L9.6 13.618V9.728L15.68 3.328V0.32H0.32V3.328ZM0.96 0.96H15.04V3.073L8.96 9.473V13.263L7.04 14.463V9.473L0.96 3.073V0.96Z" fill="#FF66C4"/>
              </svg>
              <span>
                {sortOptions.find((o) => o.value === sortType)?.label || "Filtrele"}
              </span>
            </button>
            {showSortMenu && (
              <div className="absolute top-[calc(100%+10px)] right-0 w-[220px] bg-[#1a1a23] rounded-xl py-2 shadow-[0px_10px_30px_rgba(0,0,0,0.5)] z-[999] flex flex-col">
                {sortOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer text-[13px] font-display hover:bg-indigo-500/10 transition-colors ${sortType === opt.value ? 'text-indigo-400' : 'text-[#e0e0e0]'}`}
                    onClick={() => {
                      setSortType(opt.value);
                      setShowSortMenu(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {opt.info && (
                      <span className="flex items-center opacity-60" title="Sizin için önerilenler">
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <circle cx="5.5" cy="5.5" r="4.5" fill="white" fillOpacity="0.3" />
                          <path d="M5.5 3a.55.55 0 1 1 0 1.1A.55.55 0 0 1 5.5 3Zm-.25 1.7h.5V8h-.5V4.7Z" fill="white" />
                        </svg>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* <div className="input-ctr">
                <input
                    type="search"
                    placeholder="Sohbet botu, uygulama veya kişi ara"
                    value={searchTerm}
                    // ARTIK onChange SADECE STATE'İ GÜNCELLEYECEK, BU DA ALTTOPRAĞI FİLTRELEME İÇİN TETİKLEYECEK
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
                <button>
                    <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 17.5625C14.3137 17.5625 17 14.8762 17 11.5625C17 8.24879 14.3137 5.5625 11 5.5625C7.68629 5.5625 5 8.24879 5 11.5625C5 14.8762 7.68629 17.5625 11 17.5625Z" fill="#FA9FFC" fillOpacity="0.12" stroke="#FF66C4" strokeWidth="1.2" />
                        <path d="M20 20.5625L17 17.5625" stroke="#FF66C4" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                </button>
            </div> */}

        <div className="category-buttons">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              className={`category-button ${
                activeCategory === cat.kategori_adi_tr ? "active" : ""
              }`}
              onClick={() => setActiveCategory(cat.kategori_adi_tr)}
            >
              {cat.kategori_adi_tr}
            </button>
          ))}
        </div>

        <div className="bot-list">
          {filteredAndSortedBots.length === 0 && !loading && (
            <p>Bu kategoriye/aramaya uygun bot bulunamadı.</p>
          )}

          {filteredAndSortedBots.map((bot) => {
            const isSelected = selectedBots.includes(bot.id);
            const botDescription =
              bot.aciklama ||
              `Kategori ID: ${bot.kategori_id} | Yayın Tarihi: ${bot.yayimlanma_tarih}`;

            return (
              <div
                className={`bot-card ${isFromList ? "selectable" : ""}`}
                key={bot.id}
                onClick={() => handleCardClick(bot)}
              >
                {/* ... KART İÇERİĞİ ... */}
                <div className="shadow">
                  {/* SVG Kodu */}
                  <svg
                    width="201"
                    height="133"
                    viewBox="0 0 201 133"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g filter="url(#filter0_f_7772_10081)">
                      <ellipse
                        cx="15.5"
                        cy="61.7625"
                        rx="66.5"
                        ry="39.2"
                        fill="url(#paint0_linear_7772_10081)"
                      />
                    </g>
                    <defs>
                      <filter
                        id="filter0_f_7772_10081"
                        x="-169.698"
                        y="-96.1351"
                        width="370.395"
                        height="315.796"
                        filterUnits="userSpaceOnUse"
                        color-interpolation-filters="sRGB"
                      >
                        <feFlood
                          flood-opacity="0"
                          result="BackgroundImageFix"
                        />
                        <feBlend
                          mode="normal"
                          in="SourceGraphic"
                          in2="BackgroundImageFix"
                          result="shape"
                        />
                        <feGaussianBlur
                          stdDeviation="59.3488"
                          result="effect1_foregroundBlur_7772_10081"
                        />
                      </filter>
                      <linearGradient
                        id="paint0_linear_7772_10081"
                        x1="-51"
                        y1="61.7625"
                        x2="82"
                        y2="61.7625"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0.211538" stop-color="#4699FF" />
                        <stop offset="0.793269" stop-color="#FF66C4" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="bot-card-left">
                  <div className="icon">
                    <img
                      src={bot.profil_fotografi || "fallback_icon_url"}
                      alt={bot.isim}
                      className="bot-image"
                    />
                    {isFromList && (
                      <div
                        className={`checkbox ${isSelected ? "checked" : ""}`}
                      >
                        {isSelected && <span className="checkmark">✓</span>}
                      </div>
                    )}
                  </div>
                  <div className="bot-info">
                    <h4 className="bot-title">{bot.isim}</h4>
                    <p className="bot-description">{bot.aciklama}</p>
                  </div>
                </div>
                <span className="user-count">
                  {(bot.toplam_chats || 0).toLocaleString()} Toplam Sohbet
                </span>
              </div>
            );
          })}
        </div>

        {isFromList && selectedBots.length > 0 && (
          <div className="save-popup">
            <p>{selectedBots.length} bot seçildi</p>
            <button
              className="save-button"
              onClick={() => {
                addBotsToList(listName, selectedBots);
                router.push("/dashboard/list");
              }}
            >
              Kaydet ve Listeye Ekle
            </button>
          </div>
        )}
      </div>
    );
}