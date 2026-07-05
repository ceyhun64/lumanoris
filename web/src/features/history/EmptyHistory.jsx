"use client";
import { useRouter } from "next/navigation";
import { History } from "lucide-react";
import { EmptyState } from "@/shared/ui/empty-state";

export default function EmptyCart() {
    const router = useRouter();

    return (
        <EmptyState
            icon={History}
            title="Geçmiş diyaloğun bulunmamaktadır."
            description="Sohbet ettiğin chatbotlar burada geçmiş olarak listelenecek."
            actionLabel="Keşfetmeye Başla"
            onAction={() => router.push("/dashboard/explore")}
        />
    );
}
