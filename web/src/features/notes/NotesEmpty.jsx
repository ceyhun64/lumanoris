"use client";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { EmptyState } from "@/shared/ui/empty-state";

export default function NotesEmpty() {
    const router = useRouter();

    return (
        <EmptyState
            icon={BookOpen}
            title="Deftere kaydedilmiş diyalog bulunmamaktadır."
            description="Sohbetlerinden beğendiğin anları diyalog defterine kaydedip paylaşabilirsin."
            actionLabel="Geçmişe Gözat"
            onAction={() => router.push("/dashboard/history")}
        />
    );
}
