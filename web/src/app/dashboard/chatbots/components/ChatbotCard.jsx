import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Bot, MessageSquare, Heart, Trash2, Rocket, ExternalLink } from "lucide-react";
import CategoryBadge from "@/shared/ui/category-badge";

// Only loaded once a card's publish/price/delete modal is actually opened —
// these are bundled once per page (not per card) but are rarely needed at all.
const PublishModal = dynamic(() => import("@/features/chatbot-mgmt/PublishModal"), { ssr: false });
const AddToSaleListModal = dynamic(() => import("@/features/chatbot-mgmt/AddToSaleListModal"), { ssr: false });
const DeleteConfirmModal = dynamic(() => import("@/shared/ui/DeleteConfirmModal"), { ssr: false });

export default function ChatbotCard({
  id,
  userId,
  title,
  image,
  profileImage,
  category,
  status,
  likes,
  dialogs,
  weeklyPrice,
  monthlyPrice,
  isIndependent,
  isOwn,
  onDelete,
  onChanged,
}) {
  const [publishOpen, setPublishOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0c10]/90 backdrop-blur-2xl transition-all duration-300 ease-out hover:border-violet-500/40 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:-translate-y-0.5">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-violet-950/40 to-slate-900/60">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-violet-600/10 text-violet-400">
            <Bot className="h-12 w-12 opacity-50" />
          </div>
        )}
        <CategoryBadge category={category} className="absolute left-3 top-3 bg-black/55" />
        <div className="absolute top-3 right-3 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-caption font-semibold backdrop-blur-md">
          {status}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Bot className="h-5 w-5 text-violet-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-bold text-white text-base truncate">
              {title || "İsimsiz Bot"}
            </h3>
            <p className="text-xs text-luma-muted">ID: #{id}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 py-2 border-y border-white/[0.06] text-xs text-white/60">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-violet-400" />
            <span>{dialogs || 0} Diyalog</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-fuchsia-400" />
            <span>{likes || 0} Beğeni</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs font-medium text-white/50">
            {weeklyPrice
              ? `${weeklyPrice} ₺/hafta`
              : monthlyPrice
                ? `${monthlyPrice} ₺/ay`
                : "Ücretsiz"}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <button
              onClick={() => setConfirmDeleteOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white/30 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
              title="Sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {isOwn && isIndependent ? (
              <button
                onClick={() => setPublishOpen(true)}
                className="flex h-8 items-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 text-xs font-medium text-emerald-300/90 transition-all hover:bg-emerald-500/15 hover:border-emerald-500/40"
                title="Herkese açık yayınla"
              >
                <span>Yayınla</span>
                <Rocket className="h-3 w-3" />
              </button>
            ) : isOwn ? (
              <button
                onClick={() => setPriceOpen(true)}
                className="flex h-8 items-center gap-1 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 text-xs font-medium text-amber-300/90 transition-all hover:bg-amber-500/15 hover:border-amber-500/40"
                title="Satış fiyatını düzenle"
              >
                <span>Fiyat Düzenle</span>
              </button>
            ) : null}
            <Link
              href={`/dashboard/chatbots/create?id=${id}`}
              className="flex h-8 items-center gap-1 rounded-xl bg-gradient-btn px-3.5 text-xs font-semibold text-white shadow-glow transition-all hover:brightness-110"
            >
              <span>Yönet</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <PublishModal
        isOpen={publishOpen}
        onClose={() => setPublishOpen(false)}
        onPublished={onChanged}
        botId={id}
        userId={userId}
        weeklyPrice={weeklyPrice}
      />
      <AddToSaleListModal
        isOpen={priceOpen}
        onClose={() => setPriceOpen(false)}
        botId={id}
        weeklyPrice={weeklyPrice}
        monthlyPrice={monthlyPrice}
      />
      <DeleteConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          onDelete();
        }}
        title="Bu botu silmek istediğinize emin misiniz?"
        description={
          <>
            "{title || "Bu chatbot"}" kalıcı olarak silinecektir.
            <br />
            Bu işlem geri alınamaz.
          </>
        }
        confirmLabel="Sil"
      />
    </div>
  );
}
