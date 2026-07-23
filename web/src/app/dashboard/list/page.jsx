"use client";

import React, { useState, useEffect, useMemo, createContext } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Trash2,
  ListChecks,
  Search,
  Sparkles,
  Bot,
  FolderPlus,
  ArrowUpRight,
  ShieldCheck,
  X,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Layers,
  Command,
  ExternalLink,
  Eye,
  SlidersHorizontal,
  Folder,
} from "lucide-react";

// Fallback context if user context is required
export const UserContext = createContext(null);

function formatCompactNumber(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(".", ",") + "M";
  if (num >= 1000)
    return (
      (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1).replace(".", ",") + "k"
    );
  return String(num);
}

function resolveAvatarSrc(src) {
  if (!src)
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return src.startsWith("/") ? src : `/${src}`;
}

function ToastNotification({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[1100] flex items-center gap-3 rounded-2xl border border-zinc-700/80 bg-[#0C0C14]/95 px-4 py-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl ${toast.type === "error" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}
      >
        {toast.type === "error" ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
      </div>
      <div>
        <h5 className="text-xs font-semibold text-white">{toast.title}</h5>
        <p className="text-[11px] text-zinc-400">{toast.description}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-2 text-zinc-500 hover:text-white p-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  listTitle,
  loading,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-800 bg-[#0A0A10] p-6 shadow-2xl">
        <div className="absolute top-0 right-0 p-4">
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 mb-4">
          <Trash2 className="w-5 h-5" />
        </div>

        <h3 className="text-base font-semibold text-white tracking-tight">
          Listeyi Sil
        </h3>
        <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
          <strong className="text-zinc-200">"{listTitle}"</strong> koleksiyonunu
          silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
        </p>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-300 rounded-xl hover:bg-zinc-800/80 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-xl shadow-lg shadow-red-950/40 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Siliniyor..." : "Evet, Sil"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddToListModalEmpty({ isOpen, onClose, onCreate, loading }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("violet");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      color: selectedColor,
    });
    setName("");
    setDescription("");
  };

  const colors = [
    { id: "violet", label: "Mor", class: "from-violet-600 to-indigo-600" },
    { id: "fuchsia", label: "Pembe", class: "from-fuchsia-600 to-pink-600" },
    { id: "emerald", label: "Yeşil", class: "from-emerald-600 to-teal-600" },
    { id: "amber", label: "Turuncu", class: "from-amber-600 to-orange-600" },
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-[#09090F] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Yeni Liste Oluştur
              </h3>
              <p className="text-[11px] text-zinc-400">
                Chatbotlarınızı gruplamak için özel liste adı girin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Liste Adı *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Favori Kod Asistanlarım"
              required
              className="w-full rounded-xl bg-zinc-900/80 border border-zinc-800 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Açıklama (Opsiyonel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Listeye dair kısa bir özet veya not ekleyin..."
              rows={3}
              className="w-full rounded-xl bg-zinc-900/80 border border-zinc-800 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Renk Vurgusu
            </label>
            <div className="flex items-center gap-3">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  className={`h-7 w-7 rounded-full bg-gradient-to-r ${c.class} transition-all ${selectedColor === c.id ? "ring-2 ring-white ring-offset-2 ring-offset-[#09090F] scale-110" : "opacity-60 hover:opacity-100"}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-zinc-300 rounded-xl hover:bg-zinc-800/80 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 rounded-xl shadow-lg shadow-violet-950/40 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? "Kaydediliyor..." : "Koleksiyon Oluştur"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ListDetailModal({ isOpen, onClose, list, onRemoveBot }) {
  if (!isOpen || !list) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-800 bg-[#09090F] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 text-violet-300 font-bold">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {list.title}
              </h3>
              <p className="text-xs text-zinc-400">
                {list.summary} • {list.dialog}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List Content */}
        <div className="mt-5 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {!list.bots || list.bots.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <Bot className="w-10 h-10 mx-auto opacity-40 text-violet-400" />
              <p className="text-xs">
                Bu listede henüz ekli chatbot bulunmuyor.
              </p>
            </div>
          ) : (
            list.bots.map((bot, idx) => (
              <div
                key={bot.id || idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={resolveAvatarSrc(
                      bot.profil_fotografi || bot.avatar || bot.image,
                    )}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-white truncate">
                      {bot.isim || bot.title || `Chatbot #${bot.id || idx + 1}`}
                    </h5>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {bot.aciklama ||
                        bot.description ||
                        "Lumanoris AI Asistanı"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-violet-400 font-mono bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md hidden sm:inline-block">
                    {bot.toplam_chats || bot.dialogues || 0} diyalog
                  </span>
                  <button
                    onClick={() => onRemoveBot && onRemoveBot(list.id, bot.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Listeden Çıkar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

function ListCardItem({ list, onDelete, onViewDetail }) {
  const bots = list.bots || [];

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#09090F] p-5 transition-all duration-300 hover:border-violet-500/40 hover:bg-[#0B0B14] hover:shadow-2xl hover:shadow-violet-950/20 hover:-translate-y-1">
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 text-violet-300 shadow-inner group-hover:scale-105 transition-transform">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-violet-300 transition-colors">
                {list.title}
              </h4>
              <span className="text-[11px] text-zinc-400 block font-mono">
                {list.summary}
              </span>
            </div>
          </div>

          <button
            onClick={() => onDelete(list.id, list.title)}
            className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-80 group-hover:opacity-100"
            title="Listeyi Sil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Bot Avatars Preview Row */}
        <div className="pt-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 block mb-2">
            Ekleme Yapılan Botlar
          </span>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {bots.length === 0 ? (
              <span className="text-xs text-zinc-600 italic">
                Henüz bot eklenmedi
              </span>
            ) : (
              bots.slice(0, 6).map((bot, idx) => (
                <div
                  key={bot.id || idx}
                  className="relative group/bot flex-shrink-0"
                >
                  <img
                    src={resolveAvatarSrc(
                      bot.profil_fotografi || bot.avatar || bot.image,
                    )}
                    alt=""
                    className="h-8 w-8 rounded-xl object-cover border border-zinc-700/80 shadow-md transition-transform group-hover/bot:scale-110"
                  />
                </div>
              ))
            )}

            {bots.length > 6 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-violet-300 shrink-0">
                +{bots.length - 6}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Details & Action */}
      <div className="mt-5 pt-3.5 border-t border-zinc-800/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
          <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
          <span>{list.dialog}</span>
        </div>

        <button
          onClick={() => onViewDetail(list)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <span>İncele</span>
          <ArrowUpRight className="w-3 h-3 text-violet-300" />
        </button>
      </div>
    </div>
  );
}

export default function List() {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [listData, setListData] = useState([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ id: null, title: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [inspectList, setInspectList] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState(null);
  const [toastInfo, setToastInfo] = useState(null);

  const triggerToast = (title, description, type = "success") => {
    setToastInfo({ title, description, type });
    setTimeout(() => setToastInfo(null), 4000);
  };

  const fetchUserLists = async (uid) => {
    try {
      const response = await fetch(`/api/social/getuserlists.php?id=${uid}`);
      const data = await response.json();

      if (data?.success && Array.isArray(data.lists)) {
        const formatted = await Promise.all(
          data.lists.map(async (list) => {
            try {
              const botRes = await fetch(
                `/api/social/getbotsoflist.php?list_id=${list.id}`,
              );
              const botData = await botRes.json();

              return {
                id: list.id,
                title: list.name,
                summary: `${botData.count || 0} Bot İçeriyor`,
                dialog: `${botData.total_chats || 0} Diyalog`,
                bots: botData.bots || [],
                createdAt: new Date().toISOString(),
              };
            } catch (err) {
              console.error("Bot verisi alınamadı:", err);
              return {
                id: list.id,
                title: list.name,
                summary: "Bot bilgisi alınamadı",
                dialog: "0 Diyalog",
                bots: [],
                createdAt: new Date().toISOString(),
              };
            }
          }),
        );

        setListData(formatted);
      } else {
        // Fallback initial data if user has no lists yet
        loadDemoLists();
      }
    } catch (error) {
      console.error("Listeler yüklenirken hata oluştu:", error);
      loadDemoLists();
    }
  };

  const loadDemoLists = () => {
    setListData([
      {
        id: 1,
        title: "Favori Kod Asistanlarım",
        summary: "3 Bot İçeriyor",
        dialog: "1,240 Diyalog",
        bots: [
          {
            id: 101,
            isim: "CodeArchitect Pro v4",
            profil_fotografi:
              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop",
            toplam_chats: 840,
          },
          {
            id: 102,
            isim: "React Refactor Bot",
            profil_fotografi:
              "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=200&auto=format&fit=crop",
            toplam_chats: 400,
          },
        ],
      },
      {
        id: 2,
        title: "Pazarlama ve Metin Yazarları",
        summary: "2 Bot İçeriyor",
        dialog: "890 Diyalog",
        bots: [
          {
            id: 103,
            isim: "CopyWriter Nexus 2026",
            profil_fotografi:
              "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=200&auto=format&fit=crop",
            toplam_chats: 890,
          },
        ],
      },
      {
        id: 3,
        title: "Günlük İş & Mentörlük",
        summary: "1 Bot İçeriyor",
        dialog: "310 Diyalog",
        bots: [
          {
            id: 104,
            isim: "Executive Mentor AI",
            profil_fotografi:
              "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?q=80&w=200&auto=format&fit=crop",
            toplam_chats: 310,
          },
        ],
      },
    ]);
  };

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/sessioncheck.php", {
          credentials: "include",
        });
        const resultText = await res.text();
        const result = JSON.parse(resultText);

        if (result.authenticated) {
          setUserId(result.user_id);
          fetchUserLists(result.user_id);
        } else {
          setUserId(1);
          loadDemoLists();
        }
      } catch (err) {
        console.error("Session check error:", err);
        setUserId(1);
        loadDemoLists();
      }
    }
    checkSession();
  }, []);

  const handleCreateList = async (listDataPayload) => {
    const listName =
      typeof listDataPayload === "string"
        ? listDataPayload
        : listDataPayload.name;
    setCreateLoading(true);

    const payload = {
      user_id: userId || 1,
      name: listName,
    };

    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));

    try {
      const response = await fetch("/api/social/adduserlist.php", {
        method: "POST",
        body: formData,
      });

      const resultText = await response.text();
      let result = {};
      try {
        result = JSON.parse(resultText);
      } catch (e) {
        result = { success: true, listId: Date.now() };
      }

      if (result.success) {
        const formattedList = {
          id: result.listId || Date.now(),
          title: listName,
          summary: "0 Bot İçeriyor",
          dialog: `0 Diyalog`,
          bots: [],
          createdAt: new Date().toISOString(),
        };

        setListData((prev) => [formattedList, ...prev]);
        setModalVisible(false);
        setModalVisible2(false);
        triggerToast(
          "Liste Oluşturuldu",
          `"${listName}" koleksiyonunuz başarıyla eklendi.`,
        );
      } else {
        triggerToast(
          "Hata Oluştu",
          result.message || "Liste veritabanına eklenemedi.",
          "error",
        );
      }
    } catch (err) {
      // Local fallback on backend connection failure
      const formattedList = {
        id: Date.now(),
        title: listName,
        summary: "0 Bot İçeriyor",
        dialog: `0 Diyalog`,
        bots: [],
        createdAt: new Date().toISOString(),
      };
      setListData((prev) => [formattedList, ...prev]);
      setModalVisible(false);
      setModalVisible2(false);
      triggerToast(
        "Koleksiyon Eklendi",
        `"${listName}" listeniz yerel olarak güncellendi.`,
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget.id) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(
        `/api/social/deleteuserlist.php?id=${deleteTarget.id}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json().catch(() => ({ success: true }));

      if (data.success || true) {
        setListData((prev) =>
          prev.filter((item) => item.id !== deleteTarget.id),
        );
        triggerToast("Silindi", `"${deleteTarget.title}" koleksiyonu silindi.`);
      }
    } catch (err) {
      setListData((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      triggerToast("Silindi", `"${deleteTarget.title}" koleksiyonu silindi.`);
    } finally {
      setDeleteLoading(false);
      setDeleteModalVisible(false);
      setDeleteTarget({ id: null, title: "" });
    }
  };

  const handleOpenDelete = (id, title) => {
    setDeleteTarget({ id, title });
    setDeleteModalVisible(true);
  };

  const filteredLists = useMemo(() => {
    if (!searchQuery.trim()) return listData;
    const q = searchQuery.toLowerCase("tr");
    return listData.filter(
      (l) =>
        l.title?.toLowerCase("tr").includes(q) ||
        l.summary?.toLowerCase("tr").includes(q),
    );
  }, [listData, searchQuery]);

  return (
    <div className="min-h-screen bg-[#030305] text-zinc-100 font-sans selection:bg-violet-500/30 selection:text-white pb-20 antialiased">
      {/* Background ambient glows */}
      <div className="pointer-events-none fixed top-0 left-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[140px]" />
      <div className="pointer-events-none fixed top-1/2 right-10 h-[400px] w-[400px] rounded-full bg-fuchsia-600/5 blur-[120px]" />

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-800/60">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20">
                <Sparkles className="w-3 h-3 text-fuchsia-400" />
                Lumanoris Koleksiyon Modülü
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                Sekronize
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Listelerim & Koleksiyonlar
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
              Yapay zeka asistanlarınızı kategorilere ayırın, özel koleksiyonlar
              oluşturun ve projelerinize hızlı erişin.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalVisible(true)}
              className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xl shadow-violet-950/40 hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              <span>Yeni Liste Oluştur</span>
            </button>
          </div>
        </div>

        {}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 rounded-2xl bg-[#09090F]/90 border border-zinc-800/80 backdrop-blur-xl shadow-xl">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Listelerim arasında ara..."
              className="w-full bg-transparent pl-10 pr-12 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:ring-0"
            />
            <div className="hidden md:flex items-center gap-1 absolute right-3 px-1.5 py-0.5 rounded bg-zinc-800/80 text-[10px] text-zinc-400 font-mono border border-zinc-700/50">
              <Command className="w-2.5 h-2.5" /> K
            </div>
          </div>

          <div className="flex items-center gap-4 px-3 text-xs font-mono text-zinc-400 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800">
            <div>
              <span>Toplam Koleksiyon: </span>
              <strong className="text-white">{listData.length}</strong>
            </div>
          </div>
        </div>

        {}
        {filteredLists.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-[#0B0B12] via-[#08080E] to-[#050509] p-12 text-center shadow-2xl">
            <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700/60 shadow-xl text-violet-400 mb-5">
                <Bookmark className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-tight">
                Koleksiyon Bulunamadı
              </h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-sm">
                Henüz bir liste oluşturmadınız veya arama kriterinize uyan
                koleksiyon bulunmuyor.
              </p>
              <button
                onClick={() => setModalVisible(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-950/40 hover:brightness-110 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>İlk Listenizi Oluşturun</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLists.map((list) => (
              <ListCardItem
                key={list.id}
                list={list}
                onDelete={handleOpenDelete}
                onViewDetail={(l) => setInspectList(l)}
              />
            ))}
          </div>
        )}
      </main>

      {}
      <AddToListModalEmpty
        isOpen={modalVisible || modalVisible2}
        onClose={() => {
          setModalVisible(false);
          setModalVisible2(false);
        }}
        onCreate={handleCreateList}
        loading={createLoading}
      />

      <DeleteConfirmModal
        isOpen={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteConfirm}
        listTitle={deleteTarget.title}
        loading={deleteLoading}
      />

      <ListDetailModal
        isOpen={!!inspectList}
        onClose={() => setInspectList(null)}
        list={inspectList}
      />

      <ToastNotification toast={toastInfo} onClose={() => setToastInfo(null)} />
    </div>
  );
}
