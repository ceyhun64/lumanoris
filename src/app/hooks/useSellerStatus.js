"use client";
import { useCallback, useEffect, useState } from "react";

export function useSellerStatus(userId) {
    const [state, setState] = useState({
        loading: true,
        status: null,
        guid: null,
        tip: null,
        lastError: null,
        hasBankInfo: false,
        missingFields: [],
        error: null,
    });

    const fetchStatus = useCallback(async () => {
        if (!userId) {
            setState((prev) => ({ ...prev, loading: false }));
            return;
        }
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const res = await fetch(`/api/submerchant_status.php?user_id=${encodeURIComponent(userId)}`);
            const data = await res.json();
            if (!data || data.success === false) {
                throw new Error(data?.message || "Durum bilgisi alınamadı.");
            }
            setState({
                loading: false,
                status: data.status,
                guid: data.guid || null,
                tip: data.tip ?? null,
                lastError: data.last_error || null,
                hasBankInfo: !!data.has_bank_info,
                missingFields: Array.isArray(data.missing_fields) ? data.missing_fields : [],
                error: null,
            });
        } catch (err) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: err.message || String(err),
            }));
        }
    }, [userId]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return { ...state, refetch: fetchStatus };
}

export default useSellerStatus;
