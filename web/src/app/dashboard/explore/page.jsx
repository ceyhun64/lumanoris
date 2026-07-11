"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { Search, Check, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/shared/ui/empty-state";
import { Button } from "@/shared/ui/button";
import avatarBot from "@/images/avatar-bot.jpg";

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
            if (!data.success) throw new Error(data.message || "Bot API'sinden hata alındı.");

            setApiBots(Array.isArray(data.bots) ? data.bots : []);
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
        return <div className="flex h-full w-full flex-col gap-6 px-4 py-6 text-white md:px-16">Yükleniyor...</div>;
    }

    return (
      <div className="flex h-full w-full flex-col gap-6 px-4 py-6 text-white md:px-16">

        {error && (
          <p className="text-rose-400">Veri yüklenemedi: {error}</p>
        )}

        <div className="flex items-center rounded-xl bg-luma-input transition-shadow duration-300 hover:shadow-[0_0_0_2px_rgba(217,70,239,0.3)]">
          <input
            type="search"
            placeholder="Sohbet botu, uygulama veya kişi ara"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent px-5 py-6 font-display text-[15px] text-white placeholder:text-white/40 focus:outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          />
          <button className="flex items-center justify-center px-5 py-1 transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg" aria-label="Ara">
            <Search className="h-5 w-5 text-fuchsia-400" />
          </button>

          {/* Filtre Butonu Birebir */}
          <div className="relative mr-2" ref={sortMenuRef}>
            <button
              className="flex items-center gap-2 whitespace-nowrap rounded-2xl border border-dashed border-fuchsia-400 bg-transparent px-3 py-1.5 font-sans text-[13px] text-white transition-colors hover:border-fuchsia-300"
              onClick={() => setShowSortMenu((v) => !v)}
            >
              <svg width="14" height="14" viewBox="-4 -4 24 24" fill="none">
                <path d="M0.32 3.328L6.4 9.728V15.618L9.6 13.618V9.728L15.68 3.328V0.32H0.32V3.328ZM0.96 0.96H15.04V3.073L8.96 9.473V13.263L7.04 14.463V9.473L0.96 3.073V0.96Z" fill="#E879F9"/>
              </svg>
              <span>
                {sortOptions.find((o) => o.value === sortType)?.label || "Filtrele"}
              </span>
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-[999] flex w-[220px] flex-col rounded-xl bg-[#1a1a23] py-2 shadow-[0px_10px_30px_rgba(0,0,0,0.5)]">
                {sortOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 cursor-pointer text-[13px] font-display transition-colors hover:bg-fuchsia-500/10",
                      sortType === opt.value ? 'text-fuchsia-400' : 'text-[#e0e0e0]',
                    )}
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

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 max-md:flex max-md:h-12 max-md:flex-nowrap max-md:overflow-x-auto max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(cat.kategori_adi_tr)}
              className={cn(
                "rounded-lg bg-luma-elevated px-3 py-3 text-center font-display text-sm text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1d1b29] max-md:h-12 max-md:min-w-[200px]",
                activeCategory === cat.kategori_adi_tr && "bg-gradient-btn",
              )}
            >
              {cat.kategori_adi_tr}
            </button>
          ))}
        </div>

        <div className="flex w-full flex-col items-start gap-2 pb-24">
          {filteredAndSortedBots.length === 0 && !loading && (
            <EmptyState
              icon={SearchX}
              title="Bu kategoriye/aramaya uygun bot bulunamadı."
              className="w-full"
            />
          )}

          {filteredAndSortedBots.map((bot) => {
            const isSelected = selectedBots.includes(bot.id);

            return (
              <div
                key={bot.id}
                onClick={() => handleCardClick(bot)}
                className="flex w-full cursor-pointer items-start justify-between gap-6 rounded-lg border border-transparent bg-luma-elevated p-2 pb-3 transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-400/25 hover:bg-gradient-to-br hover:from-[#13121c] hover:to-[#1a1925] hover:shadow-[0_10px_25px_rgba(217,70,239,0.12),0_4px_12px_rgba(139,92,246,0.15)] max-md:flex-col"
              >
                <div className="flex items-start gap-4 max-md:flex-col">
                  <div className="relative flex items-center justify-center">
                    <img
                      src={bot.profil_fotografi || avatarBot.src}
                      alt={bot.isim}
                      className="aspect-square h-[120px] w-[120px] rounded-md object-cover"
                    />
                    {isFromList && (
                      <div
                        className={cn(
                          "absolute bottom-2 right-2 z-[2] flex h-5 w-5 items-center justify-center rounded border-2 border-fuchsia-400 bg-white text-fuchsia-400",
                          isSelected && "bg-fuchsia-400 text-white",
                        )}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-4">
                    <h4 className="font-display text-base font-medium capitalize text-white">{bot.isim}</h4>
                    <p className="font-display text-sm capitalize text-white">{bot.aciklama}</p>
                  </div>
                </div>
                <span className="flex items-center justify-center whitespace-nowrap rounded-md bg-white/10 px-3 font-display text-sm text-white">
                  {(bot.toplam_chats || 0).toLocaleString()} Toplam Sohbet
                </span>
              </div>
            );
          })}
        </div>

        {isFromList && selectedBots.length > 0 && (
          <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-transparent bg-luma-elevated px-6 py-4 shadow-modal">
            <p className="text-sm text-white">{selectedBots.length} bot seçildi</p>
            <Button
              onClick={() => {
                addBotsToList(listName, selectedBots);
                router.push("/dashboard/list");
              }}
              className="h-auto px-5 py-2.5"
            >
              Kaydet ve Listeye Ekle
            </Button>
          </div>
        )}
      </div>
    );
}
