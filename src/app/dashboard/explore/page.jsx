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
            const response = await fetch("/api/getcategories.php"); 
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
            const response = await fetch(`/api/getchatbots.php?search=`); 
            
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

    // İlk yüklemede tüm botları çek (veya searchTerm değiştiğinde)
    useEffect(() => {
        // Eğer searchTerm state'i güncellendiyse (URL'den geldiği için veya kullanıcı yazdığı için),
        // sadece o anki searchTerm değerine göre filtreleme yapacak.
        fetchAllBots(); // **HEM İLK YÜKLEMEDE HEM DE SEARCHTERM DEĞİŞTİĞİNDE ÇALIŞACAK**
    }, [fetchAllBots, searchTerm]); // Buraya searchTerm'i ekleyerek, searchTerm değiştiğinde tüm botları tekrar çekeriz.


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

    // *** KATEGORİ VE ARAMA İLE İSTEMCİ TARAFINDA FİLTRELEME ***
    const filteredBots = apiBots.filter(bot => {
        let matchesCategory = true;
        let matchesSearch = true;

        // 1. Kategori Filtreleme
        if (activeCategory !== "Tümü") {
            const selectedCategory = categories.find(cat => cat.kategori_adi_tr === activeCategory);
            if (selectedCategory) {
                matchesCategory = bot.kategori_id === selectedCategory.id;
            } else {
                matchesCategory = false; 
            }
        }

        // 2. Arama Filtreleme (searchTerm state'ini kullanıyoruz)
        if (searchTerm !== "") {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            matchesSearch = bot.isim.toLowerCase().includes(lowerCaseSearchTerm);
        }
        
        // Hem kategori hem de arama kriterleri EŞLEŞMELİ
        return matchesCategory && matchesSearch;
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
          <div className="market-filter-select" ref={sortMenuRef}>
            <button
              className="market-filter-btn"
              onClick={() => setShowSortMenu((v) => !v)}
            >
              <svg width="16" height="16" viewBox="-4 -4 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.32 3.328L6.4 9.728V15.618L9.6 13.618V9.728L15.68 3.328V0.32H0.32V3.328ZM0.96 0.96H15.04V3.073L8.96 9.473V13.263L7.04 14.463V9.473L0.96 3.073V0.96Z" fill="#FF66C4"/>
              </svg>



              <span>
                {sortOptions.find((o) => o.value === sortType)?.label ||
                  "Filtrele"}
              </span>
            </button>
            {showSortMenu && (
              <div className="market-filter-dropdown">
                {sortOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`filter-option${
                      sortType === opt.value ? " active" : ""
                    }`}
                    onClick={() => {
                      setSortType(opt.value);
                      setShowSortMenu(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {opt.info && (
                      <span className="info-dot" title="Sizin için önerilenler">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 11 11"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clip-path="url(#clip0_8050_5936)">
                            <path
                              opacity="0.3"
                              d="M5.49999 0.917969C8.03182 0.917969 10.0842 2.97039 10.0842 5.50222C10.0842 8.03359 8.03182 10.086 5.49999 10.086C2.96816 10.086 0.916657 8.03359 0.916657 5.50222C0.916198 2.97039 2.96816 0.917969 5.49999 0.917969Z"
                              fill="white"
                            />
                            <path
                              d="M5.50047 2.98068C5.42378 2.97858 5.34744 2.99187 5.27598 3.01978C5.20451 3.04769 5.13937 3.08965 5.0844 3.14317C5.02944 3.19669 4.98576 3.26069 4.95595 3.33139C4.92615 3.40209 4.91083 3.47804 4.91089 3.55476C4.91095 3.63148 4.9264 3.70741 4.95631 3.77806C4.98623 3.84871 5.03001 3.91264 5.08506 3.96607C5.14011 4.01951 5.20532 4.06136 5.27683 4.08916C5.34834 4.11695 5.4247 4.13012 5.50139 4.12789C5.65071 4.1235 5.79243 4.06104 5.89643 3.95381C6.00043 3.84657 6.05851 3.70301 6.05833 3.55362C6.05815 3.40424 5.99973 3.26081 5.89547 3.15382C5.79121 3.04684 5.64934 2.98472 5.50001 2.98068H5.50047ZM5.49818 4.69898C5.38586 4.69913 5.2775 4.74052 5.19369 4.8153C5.10987 4.89007 5.05643 4.99302 5.04351 5.1046L5.04031 5.15777L5.04214 7.67952L5.04489 7.73314C5.05781 7.84492 5.1114 7.94804 5.19545 8.02286C5.2795 8.09768 5.38813 8.13896 5.50065 8.13885C5.61318 8.13873 5.72173 8.09723 5.80562 8.02225C5.88952 7.94726 5.9429 7.84403 5.9556 7.73223L5.95835 7.6786L5.95651 5.15731L5.95331 5.10369C5.94006 4.9922 5.88635 4.88945 5.80237 4.81494C5.7184 4.74042 5.60999 4.69932 5.49772 4.69944L5.49818 4.69898Z"
                              fill="white"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_8050_5936">
                              <rect width="11" height="11" fill="white" />
                            </clipPath>
                          </defs>
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
                  {bot.toplam_chats.toLocaleString()} Toplam Sohbet
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