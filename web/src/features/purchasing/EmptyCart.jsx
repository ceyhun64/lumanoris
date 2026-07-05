"use client";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { EmptyState } from "@/shared/ui/empty-state";

export default function EmptyCart() {
    const router = useRouter();

    return (
        <EmptyState
            icon={ShoppingCart}
            title="Sepetinde ürün bulunmamaktadır."
            description="Pazaryerini keşfet, beğendiğin chatbotları sepetine ekle."
            actionLabel="Keşfetmeye Başla"
            onAction={() => router.push("/dashboard/explore")}
        />
    );
}
