"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-luma-base text-white/60 text-[14px]">
      <span className="animate-pulse">Yükleniyor...</span>
    </div>
  );
}
