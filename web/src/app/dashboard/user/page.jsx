"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Bot, UserRound } from "lucide-react";

/**
 * Başka bir kullanıcının herkese açık profili — /dashboard/user/?id=<id>
 *
 * Neden dinamik segment (`[id]`) DEĞİL: next.config.mjs'te NEXT_EXPORT=1 ile
 * `output: 'export'` bir build biçimi olarak duruyor. Statik export'ta
 * `generateStaticParams` olmayan bir dinamik route build'i kırar; id'yi
 * sorgu parametresinden okumak iki build biçiminde de çalışıyor. Uygulama
 * zaten aynı deseni kullanıyor (`/dashboard/chat?botId=`).
 *
 * `useSearchParams` yerine `window.location.search`: hook'un prerender
 * sırasında bir Suspense sınırı istemesi bu sayfayı gereksizce
 * karmaşıklaştırırdı; login sayfası da aynı yolu izliyor.
 */
export default function UserProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      setError("Profil bağlantısı eksik.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `/api/user/getpublicprofile.php?id=${encodeURIComponent(id)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (data?.success) setProfile(data);
        else setError(data?.message || "Profil yüklenemedi.");
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Profil yüklenirken hata:", err);
          setError("Sunucuya bağlanılamadı.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Geri
      </button>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 animate-pulse rounded-full bg-white/10" />
            <div className="space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
          <div className="h-24 bg-gradient-to-r from-fuchsia-600/25 via-purple-600/20 to-transparent" />

          <div className="px-6 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-[#0c0c14] bg-luma-base ring-1 ring-white/10">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="h-10 w-10 text-white/30" />
                )}
              </div>

              <div className="min-w-0 pb-1">
                <h1 className="truncate text-xl font-semibold tracking-tight text-white">
                  {profile.username || "Kullanıcı"}
                </h1>
                <p className="text-xs text-white/40">Lumanoris kullanıcısı</p>
              </div>
            </div>

            {/* Yalnızca herkese açık sayaçlar. Endpoint e-posta, telefon, ad
                soyad gibi alanları bilerek döndürmüyor. */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-caption uppercase tracking-wider text-white/40">
                  <Bot className="h-3.5 w-3.5 text-fuchsia-400" />
                  Chatbot
                </div>
                <p className="mt-1 text-title-sm font-bold text-white">
                  {profile.chatbotCount ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-caption uppercase tracking-wider text-white/40">
                  <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                  Paylaşılan Diyalog
                </div>
                <p className="mt-1 text-title-sm font-bold text-white">
                  {profile.sharedDialogueCount ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
