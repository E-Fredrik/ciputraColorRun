"use client"
import { useState, useEffect } from "react";

export function useSessionState<T>(key: string, initialValue: T) {
    const [state, setState] = useState<T>(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const v = sessionStorage.getItem(key);
            if (v === null) return initialValue;

            // Try parsing JSON first (handles values written via JSON.stringify)
            try {
                return JSON.parse(v) as T;
            } catch (parseErr) {
                // If parsing fails, fall back to the raw string for string-like keys
                // This makes the hook tolerant of legacy / plain-string writes.
                // For non-string initial types, attempt basic conversions for common primitives.
                const trimmed = v.trim();
                // null/undefined markers
                if (trimmed === "null") return (null as unknown) as T;
                if (trimmed === "undefined") return (undefined as unknown) as T;

                // boolean
                if (trimmed === "true") return (true as unknown) as T;
                if (trimmed === "false") return (false as unknown) as T;

                // number
                const num = Number(trimmed);
                if (!Number.isNaN(num) && typeof initialValue === "number") return (num as unknown) as T;

                // otherwise return raw string cast to T (common case)
                return (v as unknown) as T;
            }
        } catch (e) {
            // on any error, return initial value
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            // Always write a JSON-serialized value so future reads are consistent.
            sessionStorage.setItem(key, JSON.stringify(state));
        } catch (e) { /* ignore quota/errors */ }
    }, [key, state]);

    const setAndSave = (value: React.SetStateAction<T>) => {
        setState(prev => {
            const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
            try { sessionStorage.setItem(key, JSON.stringify(next)); } catch (e) { /* ignore */ }
            return next;
        });
    };

    return [state, setAndSave] as const;
}