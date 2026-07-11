"use client";
import { useState, useEffect } from 'react'

function PrivacyPolicy2() {
    const [info, setInfo] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchInfo() {
            try {
                const res = await fetch("/api/content/getprivacy.php");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const result = await res.json();
                // ✅ Access nested data
                if (result.success && result.content?.gizlilik_politikasi) {
                    setInfo(result.content.gizlilik_politikasi);
                } else {
                    console.warn("Unexpected API response:", result);
                    setInfo(null);
                }
            } catch (err) {
                console.error("Fetch error:", err);
                setInfo(null);
            } finally {
                setIsLoading(false);
            }
        }
        fetchInfo();
    }, []);

  return (
    <div
        className="rounded-xl border border-transparent bg-luma-elevated p-6 text-white [&_h2]:mb-4 [&_h2]:text-xl [&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:text-base [&_h4]:text-fuchsia-400 [&_li]:mb-1 [&_p]:mb-3 [&_p]:text-sm [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: info }}
    ></div>
  )
}

export default PrivacyPolicy2
