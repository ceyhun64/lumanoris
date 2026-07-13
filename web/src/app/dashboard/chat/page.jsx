"use client";
import MessageInput from "@/features/chat/MessageInput";
import ProfileCard from "@/entities/user/ui/ProfileCard";
import WithdrawalModal from "@/features/wallet/WithdrawalModal";
import BuyModal from "@/features/purchasing/BuyModal";
import React, { useState, useRef, useEffect, useCallback } from "react";
import avatarImg from "@/images/avatar-bot.jpg";
import DialogNotebookModal from "@/features/notes/DialogNotebookModal";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Lock } from "lucide-react";

export default function Chat() {
  const [bot, setBot] = useState(null);
  const [botId, setBotId] = useState(0);
  const [comments, setComments] = useState(null);
  const [userId, setUserId] = useState();
  const [prompt, setPrompt] = useState("");
  const [conversation, setConversation] = useState();
  const [conversationId, setConversationId] = useState(-1);
  const [chatAdFrequency, setChatAdFrequency] = useState(10);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [logoClicked, setLogoClicked] = useState(false);
  const [isDialogModalOpen, setIsDialogModalOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState({ input: "", output: "" });
  const [hasSubscription, setHasSubscription] = useState(false);
  const [checkingSub, setCheckingSub] = useState(true);
  const [fullTrainingPrompt, setFullTrainingPrompt] = useState("");
  // Sohbet Luma Coini: mesaj hakkı tükendiğinde mesaj kutusunun yerini alan
  // "Sınır Aşıldı" bandı.
  const [limitReached, setLimitReached] = useState(false);
  const [showLimitBuyModal, setShowLimitBuyModal] = useState(false);

  const checkSubscription = useCallback(async (uId, bId) => {
      if (!uId || !bId) return;
      try {
          const res = await fetch(`/api/wallet/getsubscription.php?user_id=${uId}&chatbot_id=${bId}`);
          const data = await res.json();
          setHasSubscription(data.has_active_sub);
      } catch (err) {
          console.error("Abonelik kontrol hatası:", err);
      } finally {
          setCheckingSub(false);
      }
  }, []);

  useEffect(() => {
      if (userId && botId) {
          checkSubscription(userId, botId);
      }
  }, [userId, botId, checkSubscription]);

  const conversationIdRef = useRef(conversationId);
  const botIdRef = useRef(botId);

  const router = useRouter();

  function timeAgo(dateString) {
    const diff = Date.now() - new Date(dateString).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} saniye önce`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} dakika önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    return `${days} gün önce`;
  }

  const formatImage = (img) => {
    if (!img) return "";
    return img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`;
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]); // sadece Base64 kısmı
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const openDialogModal = (index) => {
    const currentBotMsg = messages[index]?.text || "";
    // Bot mesajından geriye doğru giderek ilk 'sent' (kullanıcı) mesajını buluyoruz
    const lastUserMsg = messages
      .slice(0, index)
      .reverse()
      .find((m) => m.type === "sent")?.text || "";

    setActiveDialog({
      input: lastUserMsg,
      output: currentBotMsg
    });
    setIsDialogModalOpen(true);
  };

  const loadFullTrainingPrompt = async (id) => {
    let currentOffset = 0;
    let accumulatedPrompt = "";
    let hasMore = true;
    const CHUNK_LIMIT = 10000; // PHP'deki limit ile aynı olmalı

    try {
        while (hasMore) {
            const response = await fetch(`/api/training/get_training_chunks.php?botId=${id}&offset=${currentOffset}`);
            const data = await response.json();

            if (data.success) {
                accumulatedPrompt += data.chunk;
                currentOffset += CHUNK_LIMIT; // 10.000 birim ilerle
                hasMore = data.hasMore;
                
                // Debug için log ekleyelim
            } else {
                hasMore = false;
            }
        }
        setFullTrainingPrompt(accumulatedPrompt);
    } catch (error) {
        console.error("Eğitim verisi yüklenirken hata:", error);
    }
};

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

  useEffect(() => {
    checkSession();

    fetch("/api/content/getadcounts.php")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setChatAdFrequency(Number(data.chat_reklam_sikligi));
      })
      .catch((error) => {
        console.error("Fetch error:", error);
      });

    const handleLogoClick = (event) => {
      setLogoClicked(event.detail.clicked);
    };

    window.addEventListener("logoClicked", handleLogoClick);

    return () => {
      window.removeEventListener("logoClicked", handleLogoClick);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    let botIdd = 0;
    const params = new URLSearchParams(window.location.search);
    botIdd = params.get("botId") || 0;
    setBotId(botIdd);
    const initialPrompt = params.get("prompt") || "";
    const conversationIdd = params.get("convId") || 0;
    setConversationId(conversationIdd);
    setPrompt(initialPrompt);

    fetch(`/api/chatbot/getchatbot.php?id=${botIdd}&user_id=${userId}`)
      .then((res) => res.text())
      .then(async (tdata) => {
        let data = JSON.parse(tdata);
        const botData = data.chatbot;
        const commentsData = data.comments;

        if (commentsData && commentsData.list) {
          const mapped = commentsData.list.map((item) => ({
            text: item.comment,
            author: item.kullanici_adi,
            date: timeAgo(item.commented_at), // helper fonksiyon
          }));
          setComments(mapped);
        }
        if (botData) {
          setBot(botData);
        }
      });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    if (!bot) return;

    const handleConversationData = async (data) => {
        setConversation(data);

        if (data?.id == 0 && prompt.trim() !== "") {
          const words = prompt.trim().split(/\s+/);
          let convName = words.slice(0, 5).join(" ");
          if (words.length > 5) {
            convName += " ...";
          }
          const payload = {
            chatbot_id: botId,
            user_id: userId,
            conversation_name: convName,
          };
          try {
            const res = await fetch("/api/chat/addconversation.php", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                data: JSON.stringify(payload),
              }),
            });
            const result = await res.json();
            const newConversation = {
              id: Number(result.id), // backend’den dönen id
              conversation_name: convName, // frontend’de oluşturduğun isim
            };

            setConversation(newConversation);
            setConversationId(result.id);
            const firstPrompt = {
              text: prompt,
              convId: newConversation.id,
            };
            handleSendMessage(firstPrompt);
          } catch (err) {
            console.error("Yeni sohbet eklenirken hata:", err);
          }
        }
    };

    // URL'de convId yoksa (kullanıcı geçmişten belirli bir sohbete
    // girmediyse), sayfa her açıldığında/yenilendiğinde son sohbeti
    // otomatik devam ettirmek yerine her zaman yeni ve temiz bir sohbet
    // başlatılır.
    if (conversationId < 1) {
      handleConversationData({ id: 0, conversation_name: "Yeni Sohbet" });
      return;
    }

    const convFetchUrl = `/api/chat/getconversation.php?chatbot_id=${botId}&user_id=${userId}&convId=${conversationId}`;

    fetch(convFetchUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("HTTP error " + response.status);
        }
        return response.json();
      })
      .then(handleConversationData)
      .catch((error) => console.error("Hata:", error));
  }, [bot]);

  useEffect(() => {
    // bot bilgisinin de geldiğinden emin oluyoruz (başlangıç mesajı için)
    if (!conversation || !userId || !bot) return;
    

    // Eğer zaten mesaj varsa ve bu var olan bir sohbetse tekrar yükleme
    if (messages.length > 0 && conversationIdRef.current > 0) {
        return; 
    }

    const loadHistory = async () => {
      try {
        // Sadece kullanıcı URL üzerinden (geçmiş sohbetler listesinden)
        // belirli bir sohbeti açtıysa eski mesajlar geri yüklenir. Aksi
        // halde (sayfa yeni açıldı/yenilendi) her zaman temiz bir sohbetle
        // başlanır.
        const shouldRestoreHistory = conversationId >= 1;
        const historyResult = shouldRestoreHistory
          ? await (
              await fetch(`/api/chat/getchat.php?chatbot_id=${bot.id}&user_id=${userId}`)
            ).json()
          : null;
        const historyData = Array.isArray(historyResult?.messages) ? historyResult.messages : [];
        const hasHistory = historyData.length > 0;

        if (hasHistory) {
          // 1. Eğer geçmişte mesajlar varsa onları yükle
          setMessages(
            historyData.map((m) => ({
              type: m.sent_by === "user" ? "sent" : "received",
              text: m.message,
            })),
          );
        } else {
          // 2. EĞER GEÇMİŞ BOŞSA (YENİ SOHBET) VE BOTUN BAŞLANGIÇ MESAJI VARSA
          if (bot.sohbet_basi_mesaj && bot.sohbet_basi_mesaj.trim() !== "") {
            
            
            // Botun ilk mesajını ekrana bas
            const initialMsg = {
              type: "received",
              text: bot.sohbet_basi_mesaj,
            };
            setMessages([initialMsg]);

            // Bu mesajı veritabanına da kaydet ki sayfa yenilenince uçmasın
            try {
              const botPayload = {
                chatbot_id: bot.id,
                user_id: userId,
                sent_by: "bot",
                message: bot.sohbet_basi_mesaj,
              };

              fetch("/api/chat/addchat.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ data: JSON.stringify(botPayload) }),
              });
            } catch (dbErr) {
              console.error("Bot başlangıç mesajı kaydedilemedi:", dbErr);
            }
          }
        }
      } catch (err) {
        console.error("Geçmiş yüklenirken hata:", err);
      }
    };

    loadHistory();
  }, [conversation, bot]); // bot'u da bağımlılığa ekledik

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    botIdRef.current = botId;
    if (botId > 0) {
      loadFullTrainingPrompt(botId);
    }
  }, [botId]);

  /*const handleResetChat = () => {
    setMessages([]);
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  };*/

  const handleResetChat = async () => {
    setMessages([]);
    const newConvId = conversation.id + 1;
    const bot_id = conversation.chatbot_id;
    const payload = {
      chatbot_id: bot_id,
      user_id: userId,
      conversation_name: "Yeni Sohbet",
    };
    try {
      const res = await fetch("/api/chat/addconversation.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          data: JSON.stringify(payload),
        }),
      });
      const result = await res.json();
      const newConversation = {
        id: Number(result.id), // backend’den dönen id
        conversation_name: "Yeni Sohbet", // frontend’de oluşturduğun isim
      };

      setConversation(newConversation);
      setConversationId(result.id);
    } catch (err) {
      console.error("Yeni sohbet eklenirken hata:", err);
    }
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
  };

  const handleSendMessage = async (data) => {
  /*if (!hasSubscription) {
        alert("Bu chatbot ile konuşmak için aktif bir aboneliğiniz bulunmuyor.");
        return;
    }*/
  if (!data.text.trim() && !data.fileName && !data.audioUrl) return;

  // Mesaj hakkı kontrolü (Sohbet Luma Coini): önce bu bota özel satın alma
  // bonusu, yoksa günlük ortak coin havuzu. Hak yoksa Gemini'ye gidilmez.
  try {
    const allowanceRes = await fetch("/api/message/consumemessage.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        data: JSON.stringify({ user_id: userId, chatbot_id: botId }),
      }),
    });
    const allowanceResult = await allowanceRes.json();
    if (!allowanceResult.allowed) {
      setLimitReached(true);
      return;
    }
  } catch (err) {
    console.error("Mesaj hakkı kontrolü hatası:", err);
    return;
  }

  // Fonksiyon içinde kullanacağımız yerel değişkenler
  let currentConvId = (data.convId && data.convId > 0) ? data.convId : conversationId;
  let isNewConversation = false;
  let newConvData = null;

  // 1. EĞER YENİ SOHBETSE ÖNCE LOCAL OLARAK OLUŞTUR
  if (currentConvId <= 0) {
    const words = data.text.trim().split(/\s+/);
    let convName = words.slice(0, 5).join(" ");
    if (words.length > 5) convName += " ...";
    if (!convName) convName = "Yeni Sohbet";

    const payload = {
      chatbot_id: botId,
      user_id: userId,
      conversation_name: convName,
    };

    try {
      const res = await fetch("/api/chat/addconversation.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: JSON.stringify(payload) }),
      });
      const result = await res.json();

      if (result.id) {
        currentConvId = Number(result.id);
        isNewConversation = true; // Yeni olduğunu işaretle
        newConvData = { id: currentConvId, conversation_name: convName };
        // DİKKAT: setConversation'ı burada çağırmıyoruz, sona saklıyoruz!
      } else {
        throw new Error("Conversation oluşturulamadı.");
      }
    } catch (err) {
      console.error("Conversation oluşturma hatası:", err);
      return;
    }
  }

  // 2. Kullanıcı mesajını arayüze ekle
  setMessages((prev) => [
    ...prev,
    {
      type: "sent",
      text: data.text || "",
      fileName: data.fileName || "",
      audioUrl: data.audioUrl || "",
    },
  ]);

  // 3. Kullanıcı mesajını DB'ye kaydet
  const userPayload = {
    chatbot_id: botId,
    user_id: userId,
    sent_by: "user",
    message: data.text,
  };

  try {
    fetch("/api/chat/addchat.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: JSON.stringify(userPayload) }),
    });
  } catch (error) {
    console.error("Kullanıcı mesajı DB hatası:", error);
  }

  // Gemini akışını başlat
  let parts = [{ text: data.text }];
  if (data.file) {
    try {
      const base64Data = await fileToBase64(data.file);
      parts.push({
        inline_data: { mime_type: data.file.type, data: base64Data },
      });
    } catch (err) {
      console.error("Dosya hatası:", err);
    }
  }

  try {
    const placeholderId = Date.now();
    setMessages((prev) => [...prev, { id: placeholderId, type: "received", text: "" }]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const systemInstruction = `GÖREV: Aşağıdaki [BİLGİ KAYNAĞI] kısmına %100 sadık kalarak cevap ver.
    Bilgi kaynağı dışına çıkma. [KİŞİLİK/STİL] direktiflerini uygula.

    [BİLGİ KAYNAĞI]:
    ${fullTrainingPrompt || "Bilgi kaynağı yok, kullanıcının sana sorduğu sorulara cevap ver."}

    [KİŞİLİK/STİL]:
    ${bot?.style_prompt}`;

    // Gemini API anahtarı artık sunucuda kalıyor — istemci ona hiç dokunmuyor.
    const geminiRes = await fetch("/api/chat/generatereply.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: controller.signal,
      body: new URLSearchParams({
        data: JSON.stringify({ system_instruction: systemInstruction, message: data.text }),
      }),
    });

    const reader = geminiRes.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.replace("data: ", "").trim();
            const gData = JSON.parse(jsonStr);
            const textChunk = gData.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (textChunk) {
              fullText += textChunk;
              setMessages((prev) =>
                prev.map((msg) => (msg.id === placeholderId ? { ...msg, text: fullText } : msg))
              );
            }
          } catch (e) {}
        }
      }
    }

    // 4. Akış bittikten sonra BOT cevabını DB'ye kaydet
    if (fullText) {
      await fetch("/api/chat/addchat.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          data: JSON.stringify({
            chatbot_id: botId,
            user_id: userId,
            sent_by: "bot",
            message: fullText,
          }),
        }),
      });
    }

    // 5. EN ÖNEMLİ KISIM: Her şey bittikten sonra conversation state'ini güncelle
    // Bu sayede useEffect içindeki loadHistory tetiklendiğinde DB'de veriler hazır olacak
    if (isNewConversation) {
      setConversationId(currentConvId);
      setConversation(newConvData);
    }

  } catch (err) {
    console.error("Hata:", err);
    if (err.name === 'AbortError') {
        setMessages((prev) => prev.map((msg) => 
            msg.id === placeholderId ? { ...msg, text: "Üzgünüm, cevap çok gecikti. Lütfen tekrar deneyin." } : msg
        ));
    }
    else
    {
      setMessages((prev) => [
      ...prev,
      { type: "received", text: "Bir hata oluştu, lütfen tekrar deneyin." },
    ]);
    }
  }
};

  return (
    <div className="relative flex h-[calc(100vh-84.5px)] w-full flex-col justify-between overflow-auto px-4 pb-[150px] pt-6 text-white md:px-16">
      <div className="flex h-full min-h-0 flex-col justify-between">
        {bot && <ProfileCard bot={bot} comments={comments} />}

        <div className={cn("flex items-center justify-center mt-12", messages.length === 0 ? "flex-1" : "hidden")}>
          <h2 className="bg-gradient-to-br from-fuchsia-400 to-violet-400 bg-clip-text font-display text-2xl font-bold text-transparent md:text-4xl">
            Merhaba
          </h2>
        </div>
        <div className={cn("relative flex w-full flex-col", messages.length === 0 && "flex-none")}>
          {messages.length > 0 && (
            <div className="mx-auto mb-2 mt-5 rounded-full border-[3px] border-transparent bg-luma-card px-5 py-1 text-center font-display text-xs font-bold text-white">
              Bugün
            </div>
          )}
          {messages.length > 0 && (
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 pb-24">
              {messages.map((msg, index) => (
                <React.Fragment key={index}>
                  <div className={cn(
                    "max-w-[70%] break-words text-sm leading-relaxed",
                    msg.type === "received"
                      ? "flex animate-[fadeInUp_0.4s_ease-out] items-start gap-3 py-3"
                      : "flex flex-col items-end self-end",
                  )}>
                    {msg.type === "received" ? (
                      <>
                        <div className="shrink-0">
                          <img
                            src={formatImage(bot?.profil_fotografi)}
                            alt="avatar"
                            className="h-[38px] w-[38px] rounded-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <p className="font-display text-base font-semibold capitalize text-white/55">{bot?.isim}</p>
                          <div className="font-display text-base font-semibold text-white">
                            {msg.text ? (
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            ) : (
                              <div className="flex gap-1 py-2">
                                <span className="h-2 w-2 animate-bounce rounded-full bg-white/40 [animation-delay:-0.32s]" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-white/40 [animation-delay:-0.16s]" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" />
                              </div>
                            )}
                          </div>
                          <button
                            className="mt-1.5 flex w-max items-center justify-center gap-1.5 rounded-md bg-luma-input px-2.5 py-0.5 transition-all duration-200 hover:-translate-y-px hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => openDialogModal(index)}
                          >
                            <svg
                              width="10"
                              height="9"
                              viewBox="0 0 10 9"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M0.31861 6.34404L0.455756 6.69768C0.778898 7.53102 1.32791 8.25537 2.04373 8.79244C2.22566 8.92873 2.44173 8.99912 2.66079 8.99912C2.78492 8.99912 2.90991 8.97651 3.03021 8.93065C3.36295 8.80353 3.60333 8.51921 3.67329 8.17047L3.77119 7.68352C4.94495 7.73663 6.12873 7.63574 7.25108 7.39024C7.81823 7.26483 8.27233 6.84826 8.43699 6.29924C8.63685 5.61074 8.73817 4.90559 8.73817 4.203C8.73817 4.04303 8.73305 3.88327 8.7226 3.72372C8.70681 3.48292 8.49843 3.29991 8.25804 3.31633C8.01745 3.33211 7.83508 3.54008 7.85065 3.78089C7.85982 3.92124 7.86452 4.06222 7.86452 4.203C7.86452 4.82304 7.77493 5.4465 7.59896 6.05183C7.52644 6.29413 7.32083 6.48012 7.06339 6.53686C5.94338 6.78236 4.76088 6.87045 3.5803 6.79857C3.28105 6.7783 3.02105 6.98477 2.96239 7.27336L2.81671 7.99834C2.80178 8.07236 2.74888 8.10286 2.71859 8.11437C2.6883 8.12611 2.62837 8.13848 2.5678 8.09347C1.98316 7.65473 1.53439 7.06283 1.27012 6.38157L1.13894 6.04564C0.78445 4.83733 0.785302 3.55991 1.14086 2.35416C1.21338 2.11186 1.419 1.92587 1.67559 1.86913C2.69748 1.64752 3.74582 1.55367 4.79629 1.58801C5.04328 1.59655 5.2393 1.40693 5.2474 1.16591C5.2555 0.924882 5.06653 0.722894 4.82529 0.714791C3.70571 0.676822 2.58315 0.778354 1.48874 1.01575C0.921592 1.14116 0.467489 1.55773 0.303466 2.10504C-0.100301 3.47417 -0.101153 4.92201 0.300906 6.29285C0.304318 6.30415 0.314129 6.33274 0.31861 6.34404Z"
                                fill="#AAAAAA"
                              />
                              <path
                                d="M8.68011 0.384387C8.53785 0.241694 8.36124 0.132487 8.16928 0.0682872C7.69491 -0.089551 7.1796 0.0305323 6.82659 0.383964L4.99163 2.21872C4.76468 2.44566 4.61154 2.7319 4.54883 3.04608L4.38886 3.84593C4.34236 4.07736 4.41445 4.31539 4.58125 4.4824C4.71499 4.61592 4.89394 4.68866 5.07865 4.68866C5.12472 4.68866 5.17122 4.68418 5.2175 4.67479L6.01735 4.51482C6.33217 4.4519 6.6182 4.29876 6.84493 4.07203L8.67969 2.23706C9.03269 1.88427 9.15363 1.36981 8.99537 0.894377C8.93138 0.702619 8.82217 0.526015 8.68011 0.384387ZM8.06199 1.61914L6.22723 3.45432C6.12293 3.55862 5.9909 3.62922 5.84586 3.65823L5.29535 3.76829L5.40541 3.21735C5.43442 3.07274 5.50481 2.94093 5.60932 2.83641L7.4445 1.00145C7.52768 0.918263 7.63796 0.873899 7.75164 0.873899C7.79878 0.873899 7.84634 0.881578 7.89263 0.897146C7.95533 0.918049 8.01548 0.954947 8.06241 1.00208C8.10869 1.04837 8.14559 1.1083 8.16649 1.17059C8.21961 1.32992 8.17952 1.50183 8.06199 1.61914Z"
                                fill="#AAAAAA"
                              />
                            </svg>
                            <span className="font-display text-[8px] font-semibold capitalize text-white/65">Diyalog Defterine Ekle</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {msg.fileName && (
                          <div className="mb-1.5 inline-block w-max rounded-xl bg-[#111111] px-5 py-2.5 font-display text-xs font-normal capitalize text-white">
                            {msg.fileName}
                          </div>
                        )}
                        {msg.text && (
                          <div className="rounded-xl bg-[#2d2d2d] px-5 py-2.5 font-display text-sm font-semibold text-white">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Reklam ekleme */}
                  {(index + 1) % chatAdFrequency === 0 && (
                    <div className="flex justify-center py-2">
                      <img
                        src="https://placehold.co/468x60?text=Bu+bir+reklam+alanıdır."
                        alt="ad"
                        className="rounded-lg"
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}

              {/* Scroll target */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Fixed input at bottom — günlük mesaj hakkı tükendiğinde, mesaj
          kutusunun yerini "Sınır Aşıldı" bandı alır (artık ayrı bir modal
          değil, sayfa akışının içinde kalıcı bir uyarı). */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[8] px-4 py-4 transition-all duration-300 md:px-16",
          logoClicked ? "md:ml-[90px]" : "md:ml-[280px]",
        )}
      >
        {limitReached ? (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-fuchsia-400/15 bg-luma-elevated px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/25 to-violet-500/15">
                <Lock className="h-4 w-4 text-fuchsia-300" />
              </div>
              <p className="text-[13px] leading-snug text-white/80">
                Günlük mesajlaşma limitine ulaştınız.
                <br className="hidden sm:block" />
                Chatbotu satın alarak daha fazla mesaj limitine erişebilirsiniz.
              </p>
            </div>
            <Button
              onClick={() => setShowLimitBuyModal(true)}
              className="h-auto shrink-0 px-5 py-2.5 text-[13px]"
            >
              Satın Al
            </Button>
          </div>
        ) : (
          <MessageInput
            onSend={handleSendMessage}
            onResetChat={handleResetChat}
          />
        )}
      </div>

      <DialogNotebookModal
        userId={userId}
        botId={conversationId}
        inputMessage={activeDialog.input}
        outputMessage={activeDialog.output}
        isOpen={isDialogModalOpen}
        onClose={() => setIsDialogModalOpen(false)}
        onPublish={(title) => {
        }}
      />

      <BuyModal
        isOpen={showLimitBuyModal}
        onClose={() => setShowLimitBuyModal(false)}
        botData={bot}
        userId={userId}
      />
    </div>
  );
}
