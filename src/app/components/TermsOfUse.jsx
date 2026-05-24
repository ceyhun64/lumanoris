"use client";
import  { React, useState, useEffect } from 'react'

export default function TermsOfUse() {
    const [info, setInfo] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
            async function fetchInfo() {
                try {
                    const res = await fetch("/api/getusage.php");
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    
                    const result = await res.json();
                    // ✅ Access nested data
                    if (result.success && result.data?.kullanim_kosullari) {
                        setInfo(result.data.kullanim_kosullari);
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
    <div className="legal-wrapper" dangerouslySetInnerHTML={{ __html: info }} ></div>
  )
}
