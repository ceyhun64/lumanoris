"use client";
import MessageInput from "@/features/chat/MessageInput";
import ProfileCard from "@/entities/user/ui/ProfileCard";
import WithdrawalModal from "@/features/wallet/WithdrawalModal";
import BuyModal from "@/features/purchasing/BuyModal";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { resolveAvatarSrc } from "@/shared/lib/image";
import DialogNotebookModal from "@/features/notes/DialogNotebookModal";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Lock, NotebookPen, RotateCcw } from "lucide-react";

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
    if (!img) return resolveAvatarSrc(null).src;
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
        // Gerçek geçmişi artık HER ZAMAN çekiyoruz — sadece "kullanıcı
        // belirli bir sohbeti mi açtı" değil, "botun karşılama mesajı bu
        // kullanıcı için daha önce hiç kaydedilmiş mi" sorusuna da cevap
        // vermemiz gerekiyor. Eskiden convId yoksa bu kontrol hiç
        // yapılmıyordu, bu yüzden convId'siz her sayfa yüklemesinde botun
        // karşılama mesajı DB'ye yeni, tekrar eden bir satır olarak
        // ekleniyordu.
        const historyResult = await (
          await fetch(`/api/chat/getchat.php?chatbot_id=${bot.id}&user_id=${userId}`)
        ).json();
        const historyData = Array.isArray(historyResult?.messages) ? historyResult.messages : [];
        const hasHistory = historyData.length > 0;
        const shouldRestoreHistory = conversationId >= 1;

        if (hasHistory && shouldRestoreHistory) {
          // Kullanıcı Geçmişim üzerinden belirli bir sohbeti açtı — tüm
          // geçmişi göster.
          setMessages(
            historyData.map((m) => ({
              type: m.sent_by === "user" ? "sent" : "received",
              text: m.message,
            })),
          );
        } else if (hasHistory) {
          // convId yok (bot'a yeni tıklandı) ama bu bot+kullanıcı için
          // geçmiş zaten var — "temiz" görünüm için yalnızca botun daha
          // önce kaydedilmiş karşılama mesajını ekranda göster, DB'ye
          // tekrar YAZMA.
          const firstBotMsg = historyData.find((m) => m.sent_by !== "user");
          setMessages(firstBotMsg ? [{ type: "received", text: firstBotMsg.message }] : []);
        } else if (bot.sohbet_basi_mesaj && bot.sohbet_basi_mesaj.trim() !== "") {
          // Bu bot+kullanıcı için hiç geçmiş yok — karşılama mesajını ilk
          // ve tek kez ekle.
          const initialMsg = {
            type: "received",
            text: bot.sohbet_basi_mesaj,
          };
          setMessages([initialMsg]);

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

  await generateReply(data.text);

  if (isNewConversation) {
    setConversationId(currentConvId);
    setConversation(newConvData);
  }
};

// Bot cevabını üretip akışını ekrana basan kısım, orijinal kullanıcı
// mesajını tekrar göndermeden/mesaj hakkını tekrar tüketmeden "Tekrar
// Dene" ile yeniden çağrılabilsin diye handleSendMessage'dan ayrıldı.
// placeholderId/timeoutId artık try'ın DIŞINDA tanımlı — önceki halinde
// try içinde const olarak tanımlanıp catch bloğunda kullanılıyordu, bu da
// bir hata oluştuğunda (AbortError dahil) "placeholderId is not defined"
// ReferenceError'ı ile catch'in kendisinin patlamasına ve sahte
// "yazıyor..." animasyonunun sonsuza kadar ekranda kalmasına yol açıyordu.
const generateReply = async (userText) => {
  const placeholderId = Date.now();
  let timeoutId;
  setMessages((prev) => [...prev, { id: placeholderId, type: "received", text: "" }]);

  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 15000);

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
        data: JSON.stringify({ system_instruction: systemInstruction, message: userText }),
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

    clearTimeout(timeoutId);

    if (fullText) {
      // Akış bittikten sonra BOT cevabını DB'ye kaydet
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
      return;
    }

    // Akış hata fırlatmadan tamamlandı ama Gemini'den hiç içerik dönmedi
    // (ör. servise erişilemedi) — sahte "yazıyor..." animasyonunu sonsuza
    // kadar ekranda bırakmak yerine açık bir hata + yeniden dene göster.
    setMessages((prev) => prev.map((msg) =>
      msg.id === placeholderId
        ? { ...msg, text: "Şu anda cevap veremiyorum.", error: true, retryText: userText }
        : msg
    ));
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("Hata:", err);
    const errorText = err.name === "AbortError"
      ? "Cevap çok gecikti. Lütfen tekrar deneyin."
      : "Bir hata oluştu. Lütfen tekrar deneyin.";
    setMessages((prev) => prev.map((msg) =>
      msg.id === placeholderId ? { ...msg, text: errorText, error: true, retryText: userText } : msg
    ));
  }
};

const handleRetryReply = (retryText) => {
  generateReply(retryText);
};

  return (
    <div className="relative flex h-[calc(100vh-84.5px)] w-full flex-col px-4 text-white md:px-16">
      {bot && <ProfileCard bot={bot} comments={comments} />}

      {/* Sohbetin kendisi artık ekranın tamamını dolduruyor — üstteki
          başlık ile ilk mesaj arasında eskiden `justify-between`in
          zorladığı boş alan kalmıyor. */}
      <div className="flex flex-1 flex-col overflow-y-auto pb-[150px] pt-5">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <img
              src={formatImage(bot?.profil_fotografi)}
              alt=""
              className="h-16 w-16 rounded-full object-cover ring-1 ring-fuchsia-400/20"
            />
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
              {bot?.isim ? `${bot.isim} ile sohbete başla` : "Sohbete başla"}
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-white/45">
              Aşağıya bir mesaj yazarak sohbete başlayabilirsin.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="mx-auto mb-2 w-fit rounded-full bg-luma-card px-5 py-1 text-center text-xs font-semibold text-white/60">
              Bugün
            </div>
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
                        <p className="font-display text-[13px] font-semibold capitalize text-white/55">{bot?.isim}</p>
                        <div className={cn("font-sans text-[15px] font-normal leading-relaxed", msg.error ? "text-rose-300" : "text-white")}>
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
                        {msg.error ? (
                          <button
                            className="mt-1.5 flex w-max items-center justify-center gap-1.5 rounded-md bg-rose-500/10 px-2.5 py-1 text-rose-300 transition-all duration-200 hover:-translate-y-px hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => handleRetryReply(msg.retryText)}
                          >
                            <RotateCcw className="h-3 w-3" strokeWidth={2} />
                            <span className="text-[11px] font-medium">Tekrar Dene</span>
                          </button>
                        ) : (
                          <button
                            className="mt-1.5 flex w-max items-center justify-center gap-1.5 rounded-md bg-luma-input px-2.5 py-1 text-white/55 transition-all duration-200 hover:-translate-y-px hover:bg-white/10 hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => openDialogModal(index)}
                          >
                            <NotebookPen className="h-3 w-3" strokeWidth={2} />
                            <span className="text-[11px] font-medium">Diyalog Defterine Ekle</span>
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {msg.fileName && (
                        <div className="mb-1.5 inline-block w-max rounded-xl bg-luma-card px-5 py-2.5 text-xs font-medium text-white/70">
                          {msg.fileName}
                        </div>
                      )}
                      {msg.text && (
                        <div className="rounded-2xl rounded-tr-sm bg-gradient-to-br from-fuchsia-600/90 to-violet-600/90 px-5 py-2.5 font-sans text-[15px] font-normal leading-relaxed text-white">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Reklam ekleme */}
                {(index + 1) % chatAdFrequency === 0 && (
                  <div className="flex justify-center py-2">
                    <div className="flex h-[60px] w-full max-w-[468px] items-center justify-center rounded-lg border border-white/[0.06] bg-luma-card text-[11px] text-white/25">
                      Reklam Alanı
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* Scroll target */}
            <div ref={messagesEndRef} />
          </div>
        )}
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
