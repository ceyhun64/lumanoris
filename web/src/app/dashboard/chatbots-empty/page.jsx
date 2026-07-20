"use client";
import Link from "next/link";
import iconSrc from "@/images/ubeyaz.png";
import Image from "next/image";
import { Plus } from "lucide-react";

export default function Chatbotlarim() {

    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
            <div className="relative flex items-center justify-center">
                <div className="absolute h-32 w-32 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-violet-500/10 blur-2xl" />
                <Image src={iconSrc} alt="Logo" width={64} height={64} className="relative z-10 drop-shadow-[0_0_20px_rgba(217,70,239,0.6)]" />
            </div>

            <h2 className="font-display text-2xl font-bold text-white">
                Sohbet Botlarım
            </h2>

            <div className="flex max-w-md flex-col gap-2">
                <p className="text-[15px] leading-relaxed text-white/55">
                    Hayalinizdeki sohbet botunu sadece <span className="font-semibold text-fuchsia-300">birkaç basit adımda</span> hayata geçirin.
                </p>
                <p className="text-[15px] leading-relaxed text-white/55">
                    Bilgi paylaşın, eğlendirin ya da iş süreçlerini kolaylaştırın —
                    <span className="font-semibold text-fuchsia-300"> hepsi sizin elinizde!</span>
                </p>
            </div>

            <Link
                href="/dashboard/chatbots/create"
                className="flex items-center gap-2 rounded-xl bg-gradient-btn px-6 py-3.5 font-display text-[14px] font-semibold text-white shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
            >
                <Plus className="h-5 w-5" />
                İlk Sohbet Botunuzu Oluşturun
            </Link>
        </div>
    );
}
