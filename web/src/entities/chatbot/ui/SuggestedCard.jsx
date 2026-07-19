import Image from 'next/image';
import { useState } from 'react';
import ShareModal from '@/features/sharing/ShareModal';
import ReportModal from '@/features/moderation/ReportModal';
import AddToListModal from '@/features/lists/AddToListModal';
import { useRouter } from "next/navigation";
import { MoreVertical, Bookmark, Share2, EyeOff, Ban, Flag, MessageSquare } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/shared/ui/dropdown-menu';
import { Badge } from '@/shared/ui/badge';

export default function SuggestedCard({ bot }) {
    const { image, title, author, dialogues, badge, avatar } = bot;
    const router = useRouter();
    const [shareOpen, setShareOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <div
            className="flex flex-col cursor-pointer rounded-2xl border border-fuchsia-400/10 bg-gradient-to-b from-[#111120] to-[#0D0D1A] transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-400/22 hover:shadow-[0_10px_28px_rgba(217,70,239,0.15)] overflow-hidden"
            onClick={() => router.push(`/dashboard/chat`)}
        >
            {/* Image */}
            <div className="relative aspect-square w-full">
                {badge && (
                    <Badge variant={badge.type} className="absolute right-2 top-2 z-[1]">
                        {badge.label}
                    </Badge>
                )}
                <Image src={image} alt={title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 25vw" />
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <Image
                            src={avatar}
                            alt=""
                            width={22}
                            height={22}
                            className="h-[22px] w-[22px] shrink-0 rounded-full object-cover"
                        />
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate text-[13px] font-medium text-white/90">{title}</span>
                            <span className="truncate text-[11px] text-white/40">{author}</span>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/80"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => setModalVisible(true)}>
                                <Bookmark className="h-4 w-4" /> Listeye Kaydet
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShareOpen(true)}>
                                <Share2 className="h-4 w-4" /> Paylaş
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <EyeOff className="h-4 w-4" /> İlgilenmiyorum
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Ban className="h-4 w-4" /> Bu Profili Önermeyin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setReportOpen(true)} className="text-rose-400 focus:text-rose-400">
                                <Flag className="h-4 w-4" /> Bildir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="mt-auto flex items-center gap-1.5 text-[11px] text-white/40">
                    <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {dialogues} Diyalog
                </div>
            </div>

            <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />
            <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
            <AddToListModal isOpen={modalVisible} onClose={() => setModalVisible(false)} lists={[]} />
        </div>
    );
}
