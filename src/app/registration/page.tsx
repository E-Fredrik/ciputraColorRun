"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef, useContext } from "react";
import { showToast } from "../../lib/toast";
import TutorialModal from "../components/TutorialModal";
import CheckoutButton from "../components/CheckoutButton";
import { CartContext } from "@/context/CartContext";
import { useSessionState } from "@/hooks/useSessionState";

interface Category {
    id: number;
    name: string;
    basePrice: string;
    earlyBirdPrice?: string;
    tier1Price?: string;
    tier1Min?: number;
    tier1Max?: number;
    tier2Price?: string;
    tier2Min?: number;
    tier2Max?: number | null;
    tier3Price?: string;
    tier3Min?: number;
    bundlePrice?: string;
    bundleSize?: number;
    earlyBirdCapacity?: number;
    earlyBirdRemaining?: number | null;
    totalParticipants?: number; // Add this line
}

// NEW: Interface for jersey option
interface JerseyOption {
    id: number;
    size: string;
    type: string;
    price: string;
    quantity?: number | null;
    orderedCount?: number;
    remaining?: number | null;
    isSoldOut?: boolean;
    isExtraSize: boolean;
    description: string | null;
}

export default function RegistrationPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any | null>(null);
    const { cart, setCart } = useContext(CartContext);
    
    const [type, setType] = useState<"individual" | "community" | "family">("individual");
    // NEW: keep a separate registrationType state (used across the file)
    const [registrationType, setRegistrationType] = useState<"individual" | "community" | "family">("individual");
    
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [jerseyOptions, setJerseyOptions] = useState<JerseyOption[]>([]); // NEW
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [participants, setParticipants] = useState<number | "">("");
    const [selectedJerseySize, setSelectedJerseySize] = useState("M");
    const [useEarlyBird, setUseEarlyBird] = useState(false);
    const soldOutSelectionNoticeRef = useRef<string | null>(null);

    // --- NEW: helper to restore session-backed personal fields immediately on mount ---
    function loadSessionPersonalData() {
        if (typeof window === "undefined") return;
        try {
            const regFull = sessionStorage.getItem("reg_fullName");
            if (!regFull) return; // nothing to restore

            setFullName(regFull || "");
            setEmail(sessionStorage.getItem("reg_email") || "");
            setPhone(sessionStorage.getItem("reg_phone") || "");
            setEmergencyPhone(sessionStorage.getItem("reg_emergencyPhone") || "");
            setBirthDate(sessionStorage.getItem("reg_birthDate") || "");
            setGender((sessionStorage.getItem("reg_gender") as "male" | "female") || "male");
            setCurrentAddress(sessionStorage.getItem("reg_currentAddress") || "");
            setNationality((sessionStorage.getItem("reg_nationality") as "WNI" | "WNA") || "WNI");
            setMedicalHistory(sessionStorage.getItem("reg_medicalHistory") || "");
            setMedicationAllergy(sessionStorage.getItem("reg_medicationAllergy") || "");
            setGroupName(sessionStorage.getItem("reg_groupName") || "");
            setIdCardPhotoName(sessionStorage.getItem("reg_idCardPhotoName") || null);
            setExistingIdCardPhotoUrl(sessionStorage.getItem("reg_existingIdCardPhotoUrl") || null);
        } catch (e) {
            // ignore parse errors
        }
    }
    const isFamilyBundleSold = true
    const threeKMCategory = categories.find(c => String(c.name).toLowerCase().includes("3km") || String(c.name).toLowerCase().includes("3k"));
    const is3kSoldOut = true; // Hard-coded: 3K category is disabled

    // Dynamic slot limits for 5K and 10K
    const CATEGORY_SLOT_LIMITS: Record<string, number> = {
        "5k": 828,
        "10k": 321,
    };

    // Auto-close community registration when combined 5K + 10K remaining quota < 10
    const isCommunityAutoClosedByQuota = useMemo(() => {
        if (categories.length === 0) return false;
        let totalRemaining = 0;
        for (const cat of categories) {
            const nameLower = String(cat.name).toLowerCase();
            for (const [key, limit] of Object.entries(CATEGORY_SLOT_LIMITS)) {
                if (nameLower.includes(key)) {
                    const used = cat.totalParticipants ?? 0;
                    totalRemaining += Math.max(0, limit - used);
                }
            }
        }
        return totalRemaining < 10;
    }, [categories]);

    // Check if community participant count exceeds remaining quota for selected category
    function getCommunityQuotaError(catId: number | null, participantCount: number): string | null {
        if (!catId || participantCount <= 0) return null;
        const category = categories.find(c => c.id === catId);
        if (!category) return null;
        const slotInfo = getCategorySlotInfo(category);
        if (!slotInfo) return null;
        if (participantCount > slotInfo.remaining) {
            return `Cannot register ${participantCount} participants. Only ${slotInfo.remaining} slot(s) remaining for ${category.name}. Please reduce the number of participants.`;
        }
        return null;
    }

    function isCategorySoldOut(cat: Category): boolean {
        const nameLower = String(cat.name).toLowerCase();
        // 3K is hardcoded sold out
        if (nameLower.includes("3km") || nameLower.includes("3k")) {
            return is3kSoldOut;
        }
        // Check dynamic limits for 5K and 10K
        for (const [key, limit] of Object.entries(CATEGORY_SLOT_LIMITS)) {
            if (nameLower.includes(key)) {
                return (cat.totalParticipants ?? 0) >= limit;
            }
        }
        return false;
    }

    function getCategorySlotInfo(cat: Category): { limit: number; remaining: number } | null {
        const nameLower = String(cat.name).toLowerCase();
        for (const [key, limit] of Object.entries(CATEGORY_SLOT_LIMITS)) {
            if (nameLower.includes(key)) {
                const used = cat.totalParticipants ?? 0;
                return { limit, remaining: Math.max(0, limit - used) };
            }
        }
        return null;
    }
    const [fullName, setFullName] = useSessionState<string>("reg_fullName", "");
    const [email, setEmail] = useSessionState<string>("reg_email", "");
    const [phone, setPhone] = useSessionState<string>("reg_phone", "");
    const [emergencyPhone, setEmergencyPhone] = useSessionState<string>("reg_emergencyPhone", "");
    const [birthDate, setBirthDate] = useSessionState<string>("reg_birthDate", "");
    const [gender, setGender] = useSessionState<"male" | "female">("reg_gender", "male");
    const [currentAddress, setCurrentAddress] = useSessionState<string>("reg_currentAddress", "");
    const [nationality, setNationality] = useSessionState<"WNI" | "WNA">("reg_nationality", "WNI");
    const [medicalHistory, setMedicalHistory] = useSessionState<string>("reg_medicalHistory", "");
    const [medicationAllergy, setMedicationAllergy] = useSessionState<string>("reg_medicationAllergy", "");
    const [groupName, setGroupName] = useSessionState<string>("reg_groupName", "");
    const [idCardPhotoName, setIdCardPhotoName] = useSessionState<string | null>("reg_idCardPhotoName", null);
    const [idCardPhoto, setIdCardPhoto] = useState<File | null>(null);
    const [existingIdCardPhotoUrl, setExistingIdCardPhotoUrl] = useSessionState<string | null>("reg_existingIdCardPhotoUrl", null);


    // Upload file in chunks to /api/payments/upload-chunk and return assembled file URL
    async function uploadFileInChunksLocal(file: File, subDir: string = "id-cards"): Promise<string> {
        const CHUNK_SIZE = 200 * 1024; // 200KB
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const prefix = subDir === "id-cards" ? "id" : "file";
        const newFileName = `${uploadId}_${prefix}.${fileExt}`;

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            const chunkBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(chunk);
            });

            const res = await fetch('/api/payments/upload-chunk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chunk: chunkBase64,
                    fileName: newFileName,
                    chunkIndex,
                    totalChunks,
                    uploadId,
                    subDir,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error || `Chunk ${chunkIndex + 1} upload failed`);
            }

            const body = await res.json().catch(() => ({}));
            if (chunkIndex === totalChunks - 1 && body.fileUrl) {
                return body.fileUrl;
            }
        }

        throw new Error('Upload failed - no file URL returned');
    }
 
    // --- NEW: immediate-save effect for personal fields (real-time save) ---
    useEffect(() => {
        try {
            sessionStorage.setItem("reg_fullName", fullName || "");
            sessionStorage.setItem("reg_email", email || "");
            sessionStorage.setItem("reg_phone", phone || "");
            sessionStorage.setItem("reg_emergencyPhone", emergencyPhone || "");
            sessionStorage.setItem("reg_birthDate", birthDate || "");
            sessionStorage.setItem("reg_gender", gender || "male");
            sessionStorage.setItem("reg_currentAddress", currentAddress || "");
            sessionStorage.setItem("reg_nationality", nationality || "WNI");
            sessionStorage.setItem("reg_medicalHistory", medicalHistory || "");
            sessionStorage.setItem("reg_medicationAllergy", medicationAllergy || "");
            sessionStorage.setItem("reg_groupName", groupName || "");
            sessionStorage.setItem("reg_idCardPhotoName", idCardPhotoName || "");
            sessionStorage.setItem("reg_existingIdCardPhotoUrl", existingIdCardPhotoUrl || "");
        } catch (e) {
            // ignore quota errors
        }
    }, [
        fullName, email, phone, emergencyPhone, birthDate, gender,
        currentAddress, nationality, medicalHistory, medicationAllergy,
        groupName, idCardPhotoName, existingIdCardPhotoUrl
    ]);

    // Jerseys: use local state (do NOT persist full jersey map to session to avoid backend overwrite)
    const [jerseys, setJerseys] = useState<Record<string, number | "">>({});

    // modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    // NEW: submission/loading state for checkout actions
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tutorial modal state
    const [showTutorial, setShowTutorial] = useState(true); // show immediately

    // Size chart state - simplified since we're showing both at once
    const [showSizeChart, setShowSizeChart] = useState(false);

    // Tutorial steps - you can add/edit these easily
    const tutorialSteps = [
      {
        title: "Fill Personal Details and Pick Registration Type",
        description: "Start off by filling your personal details and picking the registration type (Individual/Community/Family)",
        image: "/images/tutorial/tut1.png",
        tip: "Prepare ID Card"
      },
      {
        title: "Choose Race Distance and Jersey Sizes",
        description: 'Choose the race distance and jersey sizes, then click "Checkout" to proceed to payment',
        image: "/images/tutorial/tut2.png",
        tip: "Make sure that the jersey quantity is the same as the participant"
      },
      {
        title: "Complete Payment",
        description: "Review your registration details and complete the payment process",
        image: "/images/tutorial/tutor3.png",
        tip: "Make sure all details are correct before submitting payment"
      },
      // Upload step moved to confirmation page
    ];

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).AOS) {
            (window as any).AOS.refresh();
        }

        // Restore any session personal data immediately (this runs before the async user fetch)
        loadSessionPersonalData();

        // Load current user - but DO NOT overwrite session personal fields if session exists
        (async () => {
            try {
                const resUser = await fetch("/api/user");
                if (resUser.ok) {
                    const body = await resUser.json().catch(() => ({}));
                    const user = body?.user;
                    if (user) {
                        setCurrentUser(user);

                        // If there's already session personal data, prefer session (user likely editing as guest)
                        const hasSessionFull = typeof window !== 'undefined' && Boolean(sessionStorage.getItem("reg_fullName"));
                        if (!hasSessionFull) {
                            // No session -> populate from server user
                            setFullName(user.name || "");
                            setEmail(user.email || "");
                            setPhone(user.phone || "");
                            setEmergencyPhone(user.emergencyPhone || "");
                            setBirthDate(user.birthDate ? new Date(user.birthDate).toISOString().slice(0,10) : "");
                            setGender(user.gender || "male");
                            setCurrentAddress(user.currentAddress || "");
                            setNationality(user.nationality || "WNI");
                            setMedicalHistory(user.medicalHistory || "");
                            setMedicationAllergy(user.medicationAllergy || "");
                            if (user.idCardPhoto) {
                                setExistingIdCardPhotoUrl(user.idCardPhoto);
                                try {
                                    const parts = String(user.idCardPhoto).split("/");
                                    setIdCardPhotoName(parts[parts.length - 1] || "Uploaded ID");
                                } catch { /* ignore */ }
                            }
                        } else {
                            // If session exists, keep session values; still set existingIdCardPhotoUrl if missing
                            if (!existingIdCardPhotoUrl && user.idCardPhoto) {
                                setExistingIdCardPhotoUrl(user.idCardPhoto);
                            }
                        }
                    } else {
                        // Not logged in -> keep session restore done earlier
                    }
                } else {
                    // Not logged in -> session restore done earlier
                }
            } catch (err) {
                // silent fail
            }
        })();

        // Fetch categories
        (async () => {
            try {
                const res = await fetch(`/api/categories`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.error('Error response from /api/categories:', errorData);
                    throw new Error(`Failed to load categories. Status: ${res.status}. Details: ${errorData.details || 'No details'}`);
                }
                const data = await res.json();
                setCategories(data);
                // Change default category to 5km instead of 3km
                if (data.length > 0) {
                    const fiveKmCat = data.find((c: Category) => String(c.name).toLowerCase().includes("5km") || String(c.name).toLowerCase().includes("5k"));
                    setCategoryId(fiveKmCat ? fiveKmCat.id : data[0].id);
                }
            } catch (err) {
                console.error("Failed to load categories:", err);
                showToast("Failed to load categories. Please refresh the page.", "error");
            }
        })();

        // NEW: Fetch jersey options
        (async () => {
            try {
                const res = await fetch(`/api/jerseys`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                if (!res.ok) throw new Error("Failed to load jersey options");
                const data: JerseyOption[] = await res.json();
                setJerseyOptions(data);

                // Build default map for all sizes returned by server
                const initialJerseys: Record<string, number | ""> = {};
                data.forEach((jersey: JerseyOption) => {
                    initialJerseys[jersey.size] = "";
                });

                // Prefer any saved session jerseys (reg_jerseys) or reg_formData.jerseys,
                // but ensure we include all newly-introduced sizes from the server.
                let merged: Record<string, number | ""> = { ...initialJerseys };

                try {
                    const savedFormData = sessionStorage.getItem("reg_formData");
                    if (savedFormData) {
                        const formData = JSON.parse(savedFormData);
                        if (formData && formData.jerseys && typeof formData.jerseys === "object") {
                            Object.entries(formData.jerseys).forEach(([k, v]) => {
                                // normalize parsed value to number | ""
                                let parsed: number | "" = "";

                                if (v === "" || v === null || v === undefined) {
                                    parsed = "";
                                } else if (typeof v === "number" && Number.isFinite(v)) {
                                    parsed = v;
                                } else if (typeof v === "string") {
                                    const t = v.trim();
                                    if (t === "") {
                                        parsed = "";
                                    } else {
                                        const n = Number(t);
                                        parsed = Number.isNaN(n) ? (merged[k] ?? 0) : n;
                                    }
                                } else {
                                    // fallback: keep existing merged value if present, otherwise 0
                                    parsed = merged[k] ?? 0;
                                }

                                merged[k] = parsed;
                            });
                        }
                    }
                } catch (e) {
                    // ignore parsing errors
                }

                // If not present in reg_formData, try dedicated reg_jerseys key
                try {
                    const saved = sessionStorage.getItem("reg_jerseys");
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        if (parsed && typeof parsed === "object") {
                             Object.entries(parsed).forEach(([k, v]) => {
                                // normalize parsed value to number | ""
                                let parsedVal: number | "" = "";
                                if (v === "" || v === null || v === undefined) {
                                    parsedVal = "";
                                } else if (typeof v === "number" && Number.isFinite(v)) {
                                    parsedVal = v;
                                } else if (typeof v === "string") {
                                    const t = v.trim();
                                    if (t === "") {
                                        parsedVal = "";
                                    } else {
                                        const n = Number(t);
                                        parsedVal = Number.isNaN(n) ? (merged[k] ?? 0) : n;
                                    }
                                } else {
                                    // fallback: keep existing merged value if present, otherwise 0
                                    parsedVal = merged[k] ?? 0;
                                }
                                merged[k] = parsedVal;
                            });
                        }
                    }
                } catch (e) {
                    // ignore
                }

                // Clamp restored values to current quota and clear sold-out sizes.
                data.forEach((jersey) => {
                    let computedRemaining: number | null = null;
                    if (typeof jersey.remaining === "number") {
                        computedRemaining = Math.max(0, jersey.remaining);
                    } else if (typeof jersey.quantity === "number") {
                        computedRemaining = Math.max(0, jersey.quantity - Number(jersey.orderedCount || 0));
                    }

                    if (computedRemaining === 0) {
                        merged[jersey.size] = "";
                        return;
                    }

                    if (typeof computedRemaining === "number") {
                        const currentValue = Number(merged[jersey.size] || 0);
                        if (currentValue > computedRemaining) {
                            merged[jersey.size] = computedRemaining;
                        }
                    }
                });

                const firstAvailable = data.find((j) => !j.isSoldOut);
                const storedSelectedSize = sessionStorage.getItem("reg_selectedJerseySize");
                if (storedSelectedSize) {
                    const validStored = data.find((j) => j.size === storedSelectedSize && !j.isSoldOut);
                    if (validStored) {
                        setSelectedJerseySize(validStored.size);
                    } else if (firstAvailable) {
                        setSelectedJerseySize(firstAvailable.size);
                    }
                } else if (firstAvailable) {
                    setSelectedJerseySize(firstAvailable.size);
                }

                // Finally set jerseys without overwriting with empty defaults
                setJerseys(merged);
            } catch (err) {
                console.error("Failed to load jersey options:", err);
                showToast("Failed to load jersey sizes. Please refresh the page.", "error");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Add this useEffect to save form data to session on every change
    useEffect(() => {
        // Save all form data to sessionStorage whenever any field changes
        try {
            const formData = {
                fullName,
                email,
                phone,
                emergencyPhone,
                birthDate,
                gender,
                currentAddress,
                nationality,
                medicalHistory,
                medicationAllergy,
                groupName,
                idCardPhotoName,
                existingIdCardPhotoUrl,
                // registration UI state
                type,
                registrationType,
                categoryId,
                participants,
                selectedJerseySize,
                jerseys, // store raw jersey map (numbers or "")
            };
            // JSON backup
            sessionStorage.setItem("reg_formData", JSON.stringify(formData));

            // Also write individual keys used by other pages/confirm step
            sessionStorage.setItem("reg_fullName", fullName || "");
            sessionStorage.setItem("reg_email", email || "");
            sessionStorage.setItem("reg_phone", phone || "");
            sessionStorage.setItem("reg_emergencyPhone", emergencyPhone || "");
            sessionStorage.setItem("reg_birthDate", birthDate || "");
            sessionStorage.setItem("reg_gender", gender || "male");
            sessionStorage.setItem("reg_currentAddress", currentAddress || "");
            sessionStorage.setItem("reg_nationality", nationality || "WNI");
            sessionStorage.setItem("reg_medicalHistory", medicalHistory || "");
            sessionStorage.setItem("reg_medicationAllergy", medicationAllergy || "");
            sessionStorage.setItem("reg_groupName", groupName || "");
            sessionStorage.setItem("reg_idCardPhotoName", idCardPhotoName || "");
            sessionStorage.setItem("reg_existingIdCardPhotoUrl", existingIdCardPhotoUrl || "");
            sessionStorage.setItem("reg_type", type || "individual");
            sessionStorage.setItem("reg_registrationType", registrationType || "individual");
            sessionStorage.setItem("reg_categoryId", String(categoryId || ""));
            sessionStorage.setItem("reg_participants", String(participants || ""));
            sessionStorage.setItem("reg_selectedJerseySize", selectedJerseySize || "M");
            // store jerseys as JSON string (numbers or empty strings)
            sessionStorage.setItem("reg_jerseys", JSON.stringify(jerseys || {}));
        } catch (e) {
            console.error("Failed to save form data:", e);
        }
    }, [
        fullName, email, phone, emergencyPhone, birthDate, gender, currentAddress,
        nationality, medicalHistory, medicationAllergy, groupName, idCardPhotoName,
        existingIdCardPhotoUrl, type, registrationType, categoryId, participants,
        selectedJerseySize, jerseys
    ]);

    // --- No cart functionality - direct registration flow ---
    const isGroupType = type === "community" || type === "family";

    // COMMUNITY: Track participants added in current session
    function getTotalCommunityParticipants(): number {
        // Sum all community participants already in the cart
        const cartCommunityTotal = cart
            .filter((item: any) => item.type === "community")
            .reduce((sum: number, item: any) => sum + Number(item.participants || 0), 0);
        return cartCommunityTotal;
    }

    // Current community participant count (cart removed => rely on participants input)
    const communityCount = Number(participants || 0);

    // NEW: Calculate extra jersey charges
    function calculateJerseyCharges(jerseySelection: Record<string, number | "">): number {
        let total = 0;
        Object.entries(jerseySelection).forEach(([size, count]) => {
            const numCount = Number(count || 0);
            if (numCount > 0) {
                const jerseyOption = jerseyOptions.find(j => j.size === size);
                if (jerseyOption && jerseyOption.isExtraSize) {
                    total += numCount * Number(jerseyOption.price);
                }
            }
        });
        return total;
    }

    // NEW: Calculate jersey charges for individual
    function calculateIndividualJerseyCharge(size: string): number {
        const jerseyOption = jerseyOptions.find(j => j.size === size);
        if (jerseyOption && jerseyOption.isExtraSize) {
            return Number(jerseyOption.price);
        }
        return 0;
    }

    // Calculate price based on total participants
    function calculatePrice(category: Category, totalParticipants: number, bundleType?: "family"): number {
        // Family bundle pricing
        if (bundleType === "family" && category.bundlePrice) {
            return Number(category.bundlePrice);
        }

        // AUTO-APPLY early bird for individuals only when slots remain
        if (type === "individual" && category.earlyBirdPrice && (typeof category.earlyBirdRemaining === "number" ? category.earlyBirdRemaining > 0 : false)) {
            return Number(category.earlyBirdPrice);
        }

        // Individual pricing
        if (type === "individual") {
            return Number(category.basePrice);
        }

        // Community tiered pricing based on TOTAL participants
        if (category.tier3Price && category.tier3Min && totalParticipants >= category.tier3Min) {
            return Number(category.tier3Price);
        }
        
        if (category.tier2Price && category.tier2Min) {
            if (category.tier2Max) {
                if (totalParticipants >= category.tier2Min && totalParticipants <= category.tier2Max) {
                    return Number(category.tier2Price);
                }
            } else {
                // No max means unlimited (like 3K >30)
                if (totalParticipants >= category.tier2Min) {
                    return Number(category.tier2Price);
                }
            }
        }
        
        if (category.tier1Price && category.tier1Min && category.tier1Max) {
            if (totalParticipants >= category.tier1Min && totalParticipants <= category.tier1Max) {
                return Number(category.tier1Price);
            }
        }

        return Number(category.basePrice);
    }

    // Get current price for display - now accounts for cart participants
    const currentPrice = useMemo(() => {
        if (!categoryId) return 0;
        const category = categories.find(c => c.id === categoryId);
        if (!category) return 0;

        if (type === "family") {
            return calculatePrice(category, 0, "family");
        }

        const currentParticipants = Number(participants || 0);
        // Include participants already in the cart for community pricing
        const cartParticipants = getTotalCommunityParticipants();
        const totalWithCurrent = type === "community" 
            ? cartParticipants + currentParticipants 
            : currentParticipants;
        
        return calculatePrice(category, type === "community" ? totalWithCurrent : 1);
    }, [categoryId, categories, participants, type, cart]);

    // NEW: Calculate subtotal including jersey charges
    const currentSubtotal = useMemo(() => {
        if (type === "family") {
            const category = categories.find(c => c.id === categoryId);
            const bundleSize = category?.bundleSize || 4;
            const baseTotal = currentPrice * bundleSize;
            const jerseyCharge = calculateJerseyCharges(jerseys);
            return baseTotal + jerseyCharge;
        }
        
        if (type === "individual") {
            const basePrice = currentPrice;
            const jerseyCharge = calculateIndividualJerseyCharge(selectedJerseySize);
            return basePrice + jerseyCharge;
        }
        
        const currentParticipants = Number(participants || 0);
        const baseTotal = currentPrice * currentParticipants;
        const jerseyCharge = calculateJerseyCharges(jerseys);
        return baseTotal + jerseyCharge;
    }, [currentPrice, participants, type, categoryId, categories, jerseys, selectedJerseySize, jerseyOptions]);

    // Calculate discount percentage
    const discountInfo = useMemo(() => {
        if (!categoryId) return null;
        const category = categories.find(c => c.id === categoryId);
        if (!category) return null;

        const basePrice = Number(category.basePrice);
        if (currentPrice >= basePrice) return null;

        const discountAmount = basePrice - currentPrice;
        const discountPercent = Math.round((discountAmount / basePrice) * 100);

        return {
            basePrice,
            discountAmount,
            discountPercent
        };
    }, [categoryId, categories, currentPrice]);

    // Display pricing breakdown (null when not available)
    const selectedCategory = categoryId ? categories.find(c => c.id === categoryId) ?? null : null;

    // NEW: Get adult and kids jersey options separately
    const adultJerseys = useMemo(() => jerseyOptions.filter(j => j.type === "adult"), [jerseyOptions]);
    const kidsJerseys = useMemo(() => jerseyOptions.filter(j => j.type === "kids"), [jerseyOptions]);

    const jerseyMapBySize = useMemo(() => {
        const map = new Map<string, JerseyOption>();
        jerseyOptions.forEach((jersey) => {
            map.set(jersey.size, jersey);
        });
        return map;
    }, [jerseyOptions]);

    function getRemainingForSizeFromMap(map: Map<string, JerseyOption>, size: string): number | null {
        const jersey = map.get(size);
        if (!jersey) return null;

        if (typeof jersey.remaining === "number") {
            return Math.max(0, jersey.remaining);
        }

        if (typeof jersey.quantity === "number") {
            return Math.max(0, jersey.quantity - Number(jersey.orderedCount || 0));
        }

        return null;
    }

    function isSizeSoldOutFromMap(map: Map<string, JerseyOption>, size: string): boolean {
        const jersey = map.get(size);
        if (!jersey) return false;
        if (typeof jersey.isSoldOut === "boolean") return jersey.isSoldOut;

        const remaining = getRemainingForSizeFromMap(map, size);
        return typeof remaining === "number" ? remaining <= 0 : false;
    }

    function getComputedRemainingForSize(size: string): number | null {
        return getRemainingForSizeFromMap(jerseyMapBySize, size);
    }

    function isSizeSoldOut(size: string): boolean {
        return isSizeSoldOutFromMap(jerseyMapBySize, size);
    }

    function getSelectableMaxForSize(size: string): number | null {
        return getComputedRemainingForSize(size);
    }

    function validateIndividualJerseyQuotaWithMap(size: string, map: Map<string, JerseyOption>): boolean {
        if (!map.has(size)) {
            showToast("Please select a valid jersey size.", "error");
            return false;
        }

        const remaining = getRemainingForSizeFromMap(map, size);
        if (typeof remaining === "number" && remaining <= 0) {
            showToast(`Jersey size ${size} is sold out. Please choose another size.`, "error");
            return false;
        }
        return true;
    }

    function validateGroupJerseyQuotaWithMap(selection: Record<string, number | "">, map: Map<string, JerseyOption>): boolean {
        for (const [size, rawCount] of Object.entries(selection)) {
            const requested = Math.max(0, Math.floor(Number(rawCount || 0)));
            if (requested <= 0) continue;

            if (!map.has(size)) {
                showToast(`Invalid jersey size in selection: ${size}. Please refresh and try again.`, "error");
                return false;
            }

            const remaining = getRemainingForSizeFromMap(map, size);
            if (typeof remaining === "number" && requested > remaining) {
                showToast(`Only ${remaining} jersey(s) left for size ${size}. Please adjust your selection.`, "error");
                return false;
            }
        }
        return true;
    }

    async function refreshLatestJerseyOptions(): Promise<Map<string, JerseyOption> | null> {
        try {
            const res = await fetch(`/api/jerseys?t=${Date.now()}`, {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache" },
            });

            if (!res.ok) {
                throw new Error(`Failed to refresh jersey options (${res.status})`);
            }

            const latestOptions: JerseyOption[] = await res.json();
            setJerseyOptions(latestOptions);

            const latestMap = new Map<string, JerseyOption>();
            latestOptions.forEach((jersey) => {
                latestMap.set(jersey.size, jersey);
            });

            return latestMap;
        } catch (err) {
            console.error("Failed to refresh jersey options:", err);
            showToast("Failed to verify latest jersey stock. Please try again.", "error");
            return null;
        }
    }

    useEffect(() => {
        if (!selectedJerseySize || jerseyOptions.length === 0) return;

        const selected = jerseyMapBySize.get(selectedJerseySize);
        if (selected && !isSizeSoldOut(selectedJerseySize)) return;

        const firstAvailable = jerseyOptions.find((j) => !isSizeSoldOut(j.size));
        if (!firstAvailable) return;

        setSelectedJerseySize(firstAvailable.size);

        if (selected && isSizeSoldOut(selected.size) && soldOutSelectionNoticeRef.current !== selected.size) {
            soldOutSelectionNoticeRef.current = selected.size;
            showToast(`Jersey size ${selected.size} is sold out. Switched to ${firstAvailable.size}.`, "info");
        }
    }, [jerseyMapBySize, jerseyOptions, selectedJerseySize]);

    function validateIndividualJerseyQuota(size: string): boolean {
        return validateIndividualJerseyQuotaWithMap(size, jerseyMapBySize);
    }

    function validateGroupJerseyQuota(selection: Record<string, number | "">): boolean {
        return validateGroupJerseyQuotaWithMap(selection, jerseyMapBySize);
    }

    function updateJersey(size: string, value: number | "") {
        const maxSelectable = getSelectableMaxForSize(size);
        if (typeof maxSelectable === "number" && maxSelectable <= 0) {
            setJerseys((s) => ({ ...s, [size]: "" }));
            showToast(`Jersey size ${size} is sold out.`, "error");
            return;
        }

        if (value === "") {
            setJerseys((s) => ({ ...s, [size]: "" }));
            return;
        }

        const normalized = Math.max(0, Math.floor(Number(value || 0)));
        if (typeof maxSelectable === "number" && normalized > maxSelectable) {
            setJerseys((s) => ({ ...s, [size]: maxSelectable }));
            showToast(`Only ${maxSelectable} jersey(s) left for size ${size}.`, "error");
            return;
        }

        setJerseys((s) => ({ ...s, [size]: normalized }));
    }

    // Add helpers (place these above validatePersonalDetails)
    function isValidEmail(value: string) {
      // simple, practical email pattern (not full RFC)
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    }

    // Sanitize phone input: allow digits, +, spaces and dashes only (no letters)
    function sanitizeLocalPhoneInput(value: string) {
      // remove everything except digits, +, spaces and dashes
      const cleaned = (value || "").replace(/[^\d\s\-+]/g, "");
      // optionally collapse multiple spaces
      return cleaned.replace(/\s{2,}/g, " ").trim();
    }

    function isValidPhone(value: string) {
      // Accept local format (starting with 0) or international format (starting with +).
      // Digits only after the prefix. Length 9..15 digits total.
      const cleaned = (value || "").replace(/[\s-]/g, "");
      return /^(0\d{7,}|\+\d{7,})$/.test(cleaned);
    }

    function isValidEmergencyPhone(value: string) {
      // Accept local format (starting with 0) or international format (starting with +).
      // Minimum 8 digits total (excluding the + sign).
      const cleaned = (value || "").replace(/[\s-]/g, "");
      return /^(0\d{7,}|\+\d{7,})$/.test(cleaned);
    }

    function validatePersonalDetails(): boolean {
        if (!fullName) {
            showToast("Please fill in your Full Name", "error");
            return false;
        }
        if (!email) {
            showToast("Please fill in your Email", "error");
            return false;
        }
        if (!phone) {
            showToast("Please fill in your Phone Number", "error");
            return false;
        }
        if (!birthDate) {
            showToast("Please fill in your Birth Date", "error");
            return false;
        }
        if (!currentAddress) {
            showToast("Please fill in your Current Address", "error");
            return false;
        }
        const hasIdProof = Boolean(idCardPhoto) || Boolean(existingIdCardPhotoUrl) || Boolean(idCardPhotoName);
        if (!hasIdProof) {
            showToast("Please upload an ID Card/Passport Photo", "error");
            return false;
        }

        // Birth date must be a valid date and not in the future
        const parsedBirth = new Date(birthDate);
        if (isNaN(parsedBirth.getTime())) {
            showToast("Please enter a valid birth date", "error");
            return false;
        }
        const today = new Date();
        // compare only date parts to avoid timezone differences
        const birthDateOnly = new Date(parsedBirth.getFullYear(), parsedBirth.getMonth(), parsedBirth.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (birthDateOnly > todayOnly) {
            showToast("Birth date cannot be in the future", "error");
            return false;
        }

    // Format checks
    if (!isValidEmail(email)) {
        showToast("Please enter a valid email address (e.g. user@example.com)", "error");
        return false;
    }

    if (!isValidPhone(phone)) {
        showToast("Please enter a valid phone number starting with 0 or + (e.g. 081234567890 or +6281234567890), Minimal 8 digits", "error");
        return false;
    }

    // Medical fields are required for ALL registration types
    if (!medicalHistory) {
        showToast("Please provide medical history information (or write 'None')", "error");
        return false;
    }
    
    if (!medicationAllergy) {
        showToast("Please provide medication allergy information (or write 'None')", "error");
        return false;
    }
    
    if (type === "individual") {
        if (!emergencyPhone) {
            showToast("Please provide an emergency contact number", "error");
            return false;
        }
        // validate emergency phone format as well
        if (!isValidEmergencyPhone(emergencyPhone)) {
            showToast("Please enter a valid emergency contact number (e.g. 081234567890 or +6281234567890), minimum 8 digits", "error");
            return false;
        }
    }

    if (type === "community") {
        if (!groupName || groupName.trim() === "") {
            showToast("Please provide a community/group name", "error");
            return false;
        }
    }

    return true;
    }

    function savePersonalDetailsToSession() {
        try {
            sessionStorage.setItem("reg_fullName", fullName);
            sessionStorage.setItem("reg_email", email);
            sessionStorage.setItem("reg_phone", phone);
            sessionStorage.setItem("reg_emergencyPhone", emergencyPhone);
            sessionStorage.setItem("reg_birthDate", birthDate);
            sessionStorage.setItem("reg_gender", gender);
            sessionStorage.setItem("reg_currentAddress", currentAddress);
            sessionStorage.setItem("reg_nationality", nationality);
            sessionStorage.setItem("reg_medicalHistory", medicalHistory);
            sessionStorage.setItem("reg_medicationAllergy", medicationAllergy);
            // store the filename for convenience (either newly uploaded file name or existing saved file name)
            if (idCardPhoto) {
                 sessionStorage.setItem("reg_idCardPhotoName", idCardPhoto.name);
            } else if (existingIdCardPhotoUrl) {
                try {
                    const parts = String(existingIdCardPhotoUrl).split("/");
                    sessionStorage.setItem("reg_idCardPhotoName", parts[parts.length - 1] || "Uploaded ID");
                } catch { /* ignore */ }
             }
        } catch (e) {
            console.error("Failed to save to sessionStorage:", e);
        }
    }

    function clearForm() {
        setParticipants("");
        
        const initialJerseys: Record<string, number | ""> = {};
        jerseyOptions.forEach((jersey) => {
            initialJerseys[jersey.size] = "";
        });
        setJerseys(initialJerseys);
    }

    
    async function handleAddToCart() {
        if (!validatePersonalDetails()) return;

        const category = categories.find((c) => c.id === categoryId);
        if (!category) {
            showToast("Please select a category", "error");
            return;
        }

        // Check category sold out
        if (isCategorySoldOut(category)) {
            showToast(`${category.name} is sold out! Please select a different category.`, "error");
            return;
        }

        // Check community quota: participant count must not exceed remaining slots
        if (type === "community") {
            const currentParticipants = Number(participants || 0);
            const quotaError = getCommunityQuotaError(category.id, currentParticipants);
            if (quotaError) {
                showToast(quotaError, "error");
                return;
            }
        }

        const latestJerseyMap = await refreshLatestJerseyOptions();
        if (!latestJerseyMap) {
            return;
        }

        if (type === "individual") {
            if (!validateIndividualJerseyQuotaWithMap(selectedJerseySize, latestJerseyMap)) {
                return;
            }
        } else {
            if (!validateGroupJerseyQuotaWithMap(jerseys, latestJerseyMap)) {
                return;
            }
        }

        if (type === "community") {
            const currentParticipants = Number(participants || 0);
            if (currentParticipants <= 0) {
                showToast("Please enter the number of participants", "error");
                return;
            }
            const totalJerseys = Object.values(jerseys).reduce<number>((sum, val) => sum + Number(val || 0), 0);
            if (totalJerseys !== currentParticipants) {
                showToast(`Jersey count must match participant count`, "error");
                return;
            }
        }

        // CRITICAL: Upload ID card BEFORE adding to cart if not already uploaded
        let resolvedIdCardUrl = existingIdCardPhotoUrl;
        if (idCardPhoto instanceof File && !existingIdCardPhotoUrl) {
            try {
                setIsSubmitting(true);
                // showToast("Uploading ID card...", "info");
                resolvedIdCardUrl = await uploadFileInChunksLocal(idCardPhoto, "id-cards");
                setExistingIdCardPhotoUrl(resolvedIdCardUrl);
                setIdCardPhotoName(idCardPhoto.name);
                // Save to session storage immediately
                sessionStorage.setItem("reg_existingIdCardPhotoUrl", resolvedIdCardUrl);
                // showToast("ID card uploaded successfully", "success");
            } catch (e) {
                console.error("[handleAddToCart] ID upload failed:", e);
                showToast("Failed to upload ID card. Please try again.", "error");
                setIsSubmitting(false);
                return;
            } finally {
                setIsSubmitting(false);
            }
        }

        // Validate ID card is available
        if (!resolvedIdCardUrl) {
            showToast("Please upload an ID card photo", "error");
            return;
        }

        // Save personal details to session (including ID card URL)
        savePersonalDetailsToSession();
        // Ensure ID card URL is saved
        sessionStorage.setItem("reg_existingIdCardPhotoUrl", resolvedIdCardUrl);

        const newItem = {
            id: new Date().getTime(),
            type,
            categoryId: category.id,
            categoryName: category.name,
            participants: type === "community" ? participants : 1,
            price: currentPrice,
            jerseyCharges: calculateJerseyCharges(jerseys),
            jerseys: type === "community" ? jerseys : { [selectedJerseySize]: 1 },
            groupName: groupName,
        };

        setCart([...cart, newItem]);
        showToast("Added to cart!", "success");

        // Clear participant count and jersey inputs for community type
        if (type === "community") {
            setParticipants("");
            setJerseys({});
        }
    }

    // No add-to-cart functionality - proceed directly to checkout


    // Direct checkout - no cart, go straight to confirmation
    async function handleCheckout() {
        if (isSubmitting) return; // prevent double clicks
        
        if (!validatePersonalDetails()) return;

        // Check category sold out before proceeding
        const selectedCat = categories.find((c) => c.id === categoryId);
        if (selectedCat && isCategorySoldOut(selectedCat)) {
            showToast(`${selectedCat.name} is sold out! Please select a different category.`, "error");
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const latestJerseyMap = await refreshLatestJerseyOptions();
            if (!latestJerseyMap) {
                return;
            }

            if (type === "individual") {
                if (!validateIndividualJerseyQuotaWithMap(selectedJerseySize, latestJerseyMap)) {
                    return;
                }

                savePersonalDetailsToSession();

                const jerseyCharge = calculateIndividualJerseyCharge(selectedJerseySize);
                
                const category = categories.find((c) => c.id === categoryId);
                if (!category) {
                    showToast("Please select a category before proceeding", "error");
                    return;
                }

                // If user selected an ID file in the registration form, upload it now and store the returned URL
                let resolvedExistingIdUrl = existingIdCardPhotoUrl;
                if (idCardPhoto instanceof File) {
                    try {
                        resolvedExistingIdUrl = await uploadFileInChunksLocal(idCardPhoto, "id-cards");
                        setExistingIdCardPhotoUrl(resolvedExistingIdUrl);
                        setIdCardPhotoName(idCardPhoto.name);
                    } catch (e) {
                        console.error("[handleCheckout] ID upload failed:", e);
                        showToast("Failed to upload ID card. Please try again.", "error");
                        return;
                    }
                }

                const registrationData = {
                    type: "individual",
                    categoryId: category.id,
                    categoryName: category.name,
                    price: currentPrice,
                    jerseySize: selectedJerseySize,
                    jerseyCharges: jerseyCharge,
                    userDetails: {
                        fullName,
                        email,
                        phone,
                        emergencyPhone,
                        birthDate,
                        gender,
                        currentAddress,
                        nationality,
                        medicalHistory,
                        medicationAllergy,
                        idCardPhoto: undefined,
                        existingIdCardPhotoUrl: resolvedExistingIdUrl || undefined,
                        registrationType,
                    }
                };

                sessionStorage.setItem("currentRegistration", JSON.stringify(registrationData));

                setAgreedToTerms(false);
                setIsModalOpen(true);
                return;
            } else if (type === "family") {
                let resolvedExistingIdUrl = existingIdCardPhotoUrl;
                if (idCardPhoto instanceof File) {
                    try {
                        resolvedExistingIdUrl = await uploadFileInChunksLocal(idCardPhoto, "id-cards");
                        setExistingIdCardPhotoUrl(resolvedExistingIdUrl);
                        setIdCardPhotoName(idCardPhoto.name);
                    } catch (e) {
                        console.error("[handleCheckout] ID upload failed:", e);
                        showToast("Failed to upload ID card. Please try again.", "error");
                        return;
                    }
                }
                const category = categories.find((c) => c.id === categoryId);
                if (!category || !category.bundleSize) {
                    showToast("Invalid family bundle selection", "error");
                    return;
                }

                if (!validateGroupJerseyQuotaWithMap(jerseys, latestJerseyMap)) {
                    return;
                }

                const totalJerseys = Object.values(jerseys).reduce<number>((sum, val) => sum + Number(val || 0), 0);
                if (totalJerseys !== category.bundleSize) {
                    showToast(`Please select exactly ${category.bundleSize} jerseys for the family bundle.`, "error");
                    return;
                }

                setAgreedToTerms(false);
                setIsModalOpen(true);
                return;
            } else {
                // COMMUNITY TYPE - Upload ID card BEFORE opening modal
                const currentParticipants = Number(participants || 0);
                if (currentParticipants < 10) {
                    showToast(`Community registration requires minimum 10 participants. Currently have ${currentParticipants}`, "error");
                    return;
                }

                // Check community quota: participant count must not exceed remaining slots
                const quotaError = getCommunityQuotaError(categoryId, currentParticipants);
                if (quotaError) {
                    showToast(quotaError, "error");
                    return;
                }

                if (!validateGroupJerseyQuotaWithMap(jerseys, latestJerseyMap)) {
                    return;
                }

                const totalJerseys = Object.values(jerseys).reduce<number>((sum, val) => sum + Number(val || 0), 0);
                if (totalJerseys !== currentParticipants) {
                    showToast(`Jersey count must match participant count`, "error");
                    return;
                }

                // CRITICAL: Upload ID card photo BEFORE proceeding
                let resolvedExistingIdUrl = existingIdCardPhotoUrl;
                if (idCardPhoto instanceof File) {
                    try {
                        showToast("Uploading ID card...", "info");
                        resolvedExistingIdUrl = await uploadFileInChunksLocal(idCardPhoto, "id-cards");
                        setExistingIdCardPhotoUrl(resolvedExistingIdUrl);
                        setIdCardPhotoName(idCardPhoto.name);
                        showToast("ID card uploaded successfully", "success");
                    } catch (e) {
                        console.error("[handleCheckout] ID upload failed:", e);
                        showToast("Failed to upload ID card. Please try again.", "error");
                        return;
                    }
                }

                // Ensure ID card is available
                if (!resolvedExistingIdUrl) {
                    showToast("Please upload an ID card photo", "error");
                    return;
                }

                // Save to session for confirm page
                savePersonalDetailsToSession();
                
                // Store the uploaded ID URL
                sessionStorage.setItem("reg_existingIdCardPhotoUrl", resolvedExistingIdUrl);

                setAgreedToTerms(false);
                setIsModalOpen(true);
                return;
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    // No add-to-cart - direct checkout only

    // Direct checkout after terms accepted - save to session and redirect
    async function executeCheckout() {
        const latestJerseyMap = await refreshLatestJerseyOptions();
        if (!latestJerseyMap) {
            return;
        }

        // Ensure personal details persisted
        savePersonalDetailsToSession();

        // If individual, session already contains currentRegistration -> proceed directly
        if (type === "individual") {
            if (!validateIndividualJerseyQuotaWithMap(selectedJerseySize, latestJerseyMap)) {
                return;
            }

            setIsModalOpen(false);
            router.push("/registration/confirm");
            return;
        }

        if (!categoryId) return;
 
        const category = categories.find((c) => c.id === categoryId);
        if (!category) return;
 
        if (type === "family") {
            if (!validateGroupJerseyQuotaWithMap(jerseys, latestJerseyMap)) {
                return;
            }

            // Force 3km category for family
            const threeKm = categories.find(c => String(c.name).toLowerCase().trim() === "3km")
                || categories.find(c => String(c.name).toLowerCase().includes("3k"));
            if (!threeKm) {
                showToast("Family bundle is not available because 3km category is missing", "error");
                return;
            }
            const bundleSize = threeKm.bundleSize || 4;
            const jerseyCharge = calculateJerseyCharges(jerseys);
            
            const registrationData = {
                type: "family",
                categoryId: threeKm.id,
                categoryName: threeKm.name,
                price: currentPrice,
                participants: bundleSize,
                jerseys: Object.fromEntries(
                    Object.entries(jerseys).map(([k, v]) => [k, Number(v) || 0])
                ),
                jerseyCharges: jerseyCharge,
                groupName: (groupName || "").trim() || undefined,
                userDetails: {
                    fullName,
                    email,
                    phone,
                    emergencyPhone,
                    birthDate,
                    gender,
                    currentAddress,
                    nationality,
                    medicalHistory,
                    medicationAllergy,
                    // Do NOT store File objects in sessionStorage
                    idCardPhoto: undefined,
                    existingIdCardPhotoUrl: existingIdCardPhotoUrl || undefined,
                    registrationType,
                    groupName: (groupName || "").trim() || undefined,
                }
            };
            
            sessionStorage.setItem("currentRegistration", JSON.stringify(registrationData));
        } else {
            // Community
            if (!validateGroupJerseyQuotaWithMap(jerseys, latestJerseyMap)) {
                return;
            }

            const currentParticipants = Number(participants || 0);
            const jerseyCharge = calculateJerseyCharges(jerseys);
            
            const registrationData = {
                type: "community",
                categoryId: category.id,
                categoryName: category.name,
                price: currentPrice,
                participants: currentParticipants,
                jerseys: Object.fromEntries(
                    Object.entries(jerseys).map(([k, v]) => [k, Number(v) || 0])
                ),
                jerseyCharges: jerseyCharge,
                groupName: (groupName || "").trim() || undefined,
                userDetails: {
                    fullName,
                    email,
                    phone,
                    emergencyPhone,
                    birthDate,
                    gender,
                    currentAddress,
                    nationality,
                    medicalHistory,
                    medicationAllergy,
                    // Don't store File objects in session (not serializable).
                    // Persist existing uploaded URL instead so confirm page/server can reuse it.
                    idCardPhoto: undefined,
                    existingIdCardPhotoUrl: existingIdCardPhotoUrl || undefined,
                    registrationType,
                    groupName: (groupName || "").trim() || undefined,
                }
            };
            
            sessionStorage.setItem("currentRegistration", JSON.stringify(registrationData));
        }

        setIsModalOpen(false);
        router.push("/registration/confirm");
    }

    // ADD THIS: Live tier info display for community - now accounts for cart
    const tierInfo = useMemo(() => {
        if (type !== "community" || !categoryId) return null;
        const category = categories.find(c => c.id === categoryId);
        if (!category) return null;

        const currentParticipants = Number(participants || 0);
        const totalInCart = getTotalCommunityParticipants();
        const totalWithCurrent = totalInCart + currentParticipants;

        let tier = "Base Price";
        let nextTier = null;
        let participantsToNext = 0;

        if (category.tier3Price && category.tier3Min && totalWithCurrent >= category.tier3Min) {
            tier = `Tier 3 (≥${category.tier3Min} people)`;
        } else if (category.tier2Price && category.tier2Min) {
            if (category.tier2Max && totalWithCurrent >= category.tier2Min && totalWithCurrent <= category.tier2Max) {
                tier = `Tier 2 (${category.tier2Min}-${category.tier2Max} people)`;
                if (category.tier3Price && category.tier3Min) {
                    nextTier = `Tier 3`;
                    participantsToNext = category.tier3Min - totalWithCurrent;
                }
            } else if (!category.tier2Max && totalWithCurrent >= category.tier2Min) {
                tier = `Tier 2 (≥${category.tier2Min} people)`;
            } else if (totalWithCurrent < category.tier2Min) {
                if (category.tier1Price && category.tier1Min && category.tier1Max && totalWithCurrent >= category.tier1Min) {
                    tier = `Tier 1 (${category.tier1Min}-${category.tier1Max} people)`;
                    nextTier = "Tier 2";
                    participantsToNext = category.tier2Min - totalWithCurrent;
                } else {
                    nextTier = category.tier1Min && totalWithCurrent < category.tier1Min ? "Tier 1" : "Tier 2";
                    participantsToNext = (category.tier1Min && totalWithCurrent < category.tier1Min) 
                        ? category.tier1Min - totalWithCurrent 
                        : category.tier2Min - totalWithCurrent;
                }
            }
        } else if (category.tier1Price && category.tier1Min && category.tier1Max) {
            if (totalWithCurrent >= category.tier1Min && totalWithCurrent <= category.tier1Max) {
                tier = `Tier 1 (${category.tier1Min}-${category.tier1Max} people)`;
                if (category.tier2Price && category.tier2Min) {
                    nextTier = "Tier 2";
                    participantsToNext = category.tier2Min - totalWithCurrent;
                }
            } else if (totalWithCurrent < category.tier1Min) {
                nextTier = "Tier 1";
                participantsToNext = category.tier1Min - totalWithCurrent;
            }
        }

        return {
            tier,
            nextTier,
            participantsToNext,
            totalInCart,
            totalWithCurrent
        };
    }, [type, categoryId, categories, participants, cart]);

    function openSizeChart() {
        setShowSizeChart(true);
    }

    if (loading) {
        return (
            <main className="flex min-h-screen pt-28 pb-16 items-center justify-center"
                style={{
                    backgroundImage: "url('/images/generalBg.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}>
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                    <p className="mt-4 text-gray-700 font-semibold">Loading registration form...</p>
                </div>
            </main>
        );
    }

    return (
        <main
            className="flex min-h-screen pt-28 pb-16"
            style={{
                backgroundImage: "url('/images/generalBg.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className="mx-auto w-full max-w-5xl px-4">
                <h1 className="text-4xl md:text-6xl text-center font-bold mb-8 tracking-wide unified-gradient-title font-moderniz">
                    UNIVERSITAS CIPUTRA COLOR RUN
                </h1>

                <section className="bg-white/95 backdrop-blur-md rounded-lg p-8 md:p-10 shadow-lg text-gray-800" data-aos="zoom-in" data-aos-delay="200">
                    <h2 className="text-2xl font-bold text-center mb-1 text-gray-800 font-moderniz">REGISTRATION FORM</h2>
                    <p className="text-center text-sm text-gray-600 mb-6 font-mustica">Enter the details to get going</p>

                    {/* Registration Type Selection */}
                    <div className="space-y-3 mb-6">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3">Registration Type <strong className="text-red-500">*</strong></p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Individual */}
                            <label
                              title="Individual"
                              className={`relative flex items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${type === "individual" ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50/50'}`}
                            >
                                <input
                                    type="radio"
                                    name="regType"
                                    value="individual"
                                    checked={type === "individual"}
                                    onChange={() => { setType("individual"); setRegistrationType("individual"); }}
                                    className="sr-only"
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${type === "individual" ? 'border-blue-500 bg-blue-500' : 'border-gray-400 bg-white'}`}>
                                        {type === "individual" && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                    </div>
                                    <span className={`text-sm font-semibold text-center ${type === "individual" ? 'text-blue-700' : 'text-gray-700'}`}>Individual</span>
                                </div>
                            </label>
 
                            {/* Community */}
                            <label
                              title={isCommunityAutoClosedByQuota ? "Community registration is closed" : "Community"}
                              className={`relative flex items-center justify-center p-4 rounded-xl border-2 transition-all ${
                                isCommunityAutoClosedByQuota ? 'opacity-50 cursor-not-allowed bg-gray-100' :
                                type === "community" ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-105 cursor-pointer' : 'border-gray-300 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer'}`}
                            >
                                <input
                                    type="radio"
                                    name="regType"
                                    value="community"
                                    disabled={isCommunityAutoClosedByQuota}
                                    checked={type === "community"}
                                    onChange={() => { setType("community"); setRegistrationType("community"); }}
                                    className="sr-only"
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${type === "community" ? 'border-emerald-500 bg-emerald-500' : 'border-gray-400 bg-white'}`}>
                                        {type === "community" && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                    </div>
                                    <span className={`text-sm font-semibold text-center ${type === "community" ? 'text-emerald-700' : 'text-gray-700'}`}>
                                        Community
                                        <span className="block text-xs font-normal">(Min. 10)</span>
                                    </span>
                                    {isCommunityAutoClosedByQuota && (
                                        <span className="text-xs font-semibold text-red-500 text-center uppercase tracking-wide mt-1">
                                            Closed
                                        </span>
                                    )}
                                </div>
                            </label>
 
                            {/* Family */}
                            <label
                                                            title="Family Bundle is sold out."
                              className={`relative flex items-center justify-center p-4 rounded-xl border-2 transition-all ${
                                                                isFamilyBundleSold ? 'opacity-50 cursor-not-allowed bg-gray-100' : 
                                type === "family" ? 'border-purple-500 bg-purple-50 shadow-lg scale-105' : 'border-gray-300 bg-white hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer'
                              }`}
                            >
                                <input
                                    type="radio"
                                    name="regType"
                                    value="family"
                                    disabled= {true}
                                    checked={type === "family"}
                                    // onChange={() => { setType("family"); setRegistrationType("family"); }}
                                    onChange={() => {
                                        setType("family");
                                        setRegistrationType("family");
                                        // Ensure family bundle uses the 3km category so bundlePrice is applied
                                        const threeKm = categories.find(c => String(c.name).toLowerCase().trim() === "3km")
                                            || categories.find(c => String(c.name).toLowerCase().includes("3k"));
                                        if (threeKm) setCategoryId(threeKm.id);
                                    }}
                                    className="sr-only"
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${type === "family" ? 'border-purple-500 bg-purple-500' : 'border-gray-400 bg-white'}`}>
                                        {type === "family" && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                    </div>
                                    <span className={`text-sm font-semibold text-center ${type === "family" ? 'text-purple-700' : 'text-gray-700'}`}>
                                        Family Bundle
                                        <span className="block text-xs font-normal">(4 people)</span>
                                    </span>
                                    {isFamilyBundleSold && (
                                        <span className="text-xs font-semibold text-red-500 text-center uppercase tracking-wide mt-1">
                                            Sold Out
                                        </span>
                                    )}
                                </div>
                            </label>
                        </div>
                     </div>

                    {/* Personal Details Form - Keep all existing personal details inputs */}
                    <div className="space-y-4">
                        <div className="grid gap-3">
                            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Full Name (as per ID Card) <strong className = "text-red-500">*</strong></label>
                            <input
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors text-base"
                                placeholder="Enter your full name as per Valid ID"
                                required
                            />
                        </div>

                        {/* Community/Group Name - Only show for community type */}
                        {type === "community" && (
                            <div className="grid gap-3">
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                    Community/Group Name *
                                </label>
                                <input
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-base"
                                    placeholder="Enter your community or group name"
                                    required
                                />
                                <p className="text-xs text-gray-500">
                                    This name will be used for all participants in your community registration
                                </p>
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-3">
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Email <strong className="text-red-500">*</strong></label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors text-base"
                                    placeholder="your.email@example.com"
                                    required
                                    pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                                    title="Enter a valid email address (e.g. name@example.com)"
                                />
                            </div>

                            <div className="grid gap-3">
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">WhatsApp Number <strong className="text-red-500">*</strong></label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors text-base"
                                    placeholder="0812 3456 7890"
                                    required
                                    inputMode="tel"
                                    pattern="^(0\d{8,14}|\+\d{8,14})$"
                                    title="Enter a valid phone number starting with 0 or + (e.g. 081234567890 or +6281234567890)"
                                />
                            </div>
                        </div>

                        {/* Emergency Phone - Only for Individual */}
                        {type === "individual" && (
                            <div className="grid gap-3">
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Emergency Contact Number <strong className="text-red-500">*</strong></label>
                                <input
                                    type="tel"
                                    value={emergencyPhone}
                                    onChange={(e) => setEmergencyPhone(e.target.value)}
                                    className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors text-base"
                                    placeholder="0812 3456 7890"
                                    required
                                    inputMode="tel"
                                    pattern="^0\d{8,14}$"
                                    title="Enter a valid local phone number starting with 0 (e.g. 081234567890)"
                                />
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-3">
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Birth Date <strong className="text-red-500">*</strong></label>
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 focus:border-blue-500 focus:outline-none transition-colors text-base"
                                    required
                                />
                            </div>

                            <div className="grid gap-3">
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Gender <strong className="text-red-500">*</strong></label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value as "male" | "female")}
                                    className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 focus:border-blue-500 focus:outline-none transition-colors text-base cursor-pointer"
                                    required
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Current Address <strong className="text-red-500">*</strong></label>
                            <textarea
                                value={currentAddress}
                                onChange={(e) => setCurrentAddress(e.target.value)}
                                className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors resize-none text-base"
                                placeholder="Enter your current address"
                                rows={3}
                                required
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-3">
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Nationality <strong className="text-red-500">*</strong></label>
                                <select
                                    value={nationality}
                                    onChange={(e) => setNationality(e.target.value as "WNI" | "WNA")}
                                    className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 focus:border-blue-500 focus:outline-none transition-colors text-base cursor-pointer"
                                    required
                                >
                                    <option value="WNI">WNI (Indonesian Citizen)</option>
                                    <option value="WNA">WNA (Foreign Citizen)</option>
                                </select>
                            </div>

                            <div className="grid gap-3">
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                    {nationality === "WNI" ? "ID Card Photo (KTP, SIM, Birth Certificate, and other official ID)" : "Passport Photo"} <strong className = "text-red-600">*</strong>
                                </label>
                                <label 
                                    htmlFor="idCardPhoto"
                                    className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent cursor-pointer hover:border-blue-300 transition-colors flex items-center justify-between group"
                                >
                                    <span className={`text-base ${idCardPhotoName ? "text-gray-800" : "text-gray-400"}`}>
                                        {idCardPhotoName || `Upload ${nationality === "WNI" ? "ID Card (KTP, SIM, Birth Certificate, and other official ID)" : "Passport"}`}
                                    </span>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </label>
                                <input
                                    id="idCardPhoto"
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            // Validate file size (Max 10MB)
                                            if (file.size > 10 * 1024 * 1024) {
                                                showToast("File too large. Maximum size is 10MB.", "error");
                                                return;
                                            }
                                            setIdCardPhoto(file);
                                            setIdCardPhotoName(file.name);
                                        }
                                    }}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG, PDF (Max 10MB)</p>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Medical History <strong className = "text-red-600">*</strong></label>
                            <textarea
                                value={medicalHistory}
                                onChange={(e) => setMedicalHistory(e.target.value)}
                                className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors resize-none text-base"
                                placeholder="Please list any medical conditions we should be aware of (e.g. Heart Problems, Past Surgeries, Broken Bones, Pregnancy, Stroke, Family History, Congenital Conditions), or write &quot;None&quot; if not applicable"
                                rows={3}
                                required
                            />
                            {(type === "community" || type === "family") && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Medical History (Any member in the community that has a past medical history should be written down )
                                </p>
                            )}
                        </div>
                        
                        <div className="grid gap-3">
                            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Medication Allergy <strong className="text-red-500">*</strong></label>
                            <textarea
                                value={medicationAllergy}
                                onChange={(e) => setMedicationAllergy(e.target.value)}
                                className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors resize-none text-base"
                                placeholder="List medication allergies (e.g. Penicillin, Aspirin, Ibuprofen), or write 'None' if not applicable"
                                rows={3}
                                required
                            />
                            {(type === "community" || type === "family") && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Medication Allergy (Any member in the community that has medication allergies should be written down )
                                </p>
                            )}
                        </div>

                        {/* Registration Type - IMPROVED RADIO BUTTONS */}
                    </div>

                    {/* Family Bundle Layout */}
                    {type === "family" && (
                        <div className="space-y-6 mt-6">
                            <div className="rounded-lg border border-gray-200 p-5 bg-white">
                                <div className="space-y-5">
                                    <div className="grid gap-3">
                                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Race Category *</label>
                                        <select
                                            value={categoryId ?? ""}
                                            onChange={(e) => setCategoryId(Number(e.target.value))}
                                            className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 focus:border-purple-500 focus:outline-none transition-colors text-base cursor-pointer"
                                        >
                                   
                                    { /* Only show 3km option(s) for Family bundle to avoid accidental mismatch */ }
                                    {categories
                                      .filter(c => String(c.name).toLowerCase().trim() === "3km" || String(c.name).toLowerCase().includes("3k"))
                                      .map(cat => {
                                        const is3k = String(cat.name).toLowerCase().includes("3km") || String(cat.name).toLowerCase().includes("3k");
                                        const isDisabled = is3k && is3kSoldOut;
                                        return (
                                            <option key={cat.id} value={cat.id} disabled={isDisabled}>
                                                {cat.name} {isDisabled ? "(Sold Out!)" : ""} - Rp {Number(cat.bundlePrice || cat.basePrice).toLocaleString("id-ID")}/person
                                            </option>
                                        );
                                      })}
                                </select>
                                <p className="text-xs text-gray-500">Only 3km category supports family bundle</p>
                            </div>

                            {/* NEW: Family Name field (stored to same groupName slot as community) */}
                            <div className="grid gap-3">
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Family Name <strong className="text-red-500">*</strong></label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors text-base"
                                    placeholder="Enter family name (will be used as group name)"
                                    required
                                />
                                <p className="text-xs text-gray-500">This name will be used for all members in this family bundle</p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                        Jersey Size Distribution (4 people total) <strong className="text-red-500">*</strong>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => openSizeChart()}
                                        className="text-xs text-purple-600 hover:text-purple-700 font-semibold underline flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                        View Size Charts
                                    </button>
                                </div>
                                
                                {/* Adult Sizes - Standard */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold text-gray-700">Adult Sizes (Standard):</p>
                                        <button
                                            type="button"
                                            onClick={() => openSizeChart()}
                                            className="text-xs text-blue-600 hover:text-blue-700 underline"
                                        >
                                            Size Guide
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                                                                {["S", "M", "L", "XL"].map((size) => {
                                                                                    const soldOut = isSizeSoldOut(size);
                                                                                    const remaining = getSelectableMaxForSize(size);
                                                                                    return (
                                                                                        <div key={size} className="flex flex-col items-center">
                                                                                            <div className="flex items-center gap-1 mb-2">
                                                                                                <span className="text-xs font-medium text-gray-700">{size}</span>
                                                                                            </div>
                                                                                            <input
                                                                                                type="number"
                                                                                                min={0}
                                                                                                max={typeof remaining === "number" ? remaining : undefined}
                                                                                                value={jerseys[size] ?? ""}
                                                                                                onChange={(e) => updateJersey(size, e.target.value === "" ? "" : Number(e.target.value))}
                                                                                                className="jersey-input shift-right accent-purple-500 border-purple-300 focus:border-purple-500"
                                                                                                placeholder="0"
                                                                                                inputMode="numeric"
                                                                                                aria-label={`Count for size ${size}`}
                                                                                                disabled={soldOut}
                                                                                            />
                                                                                            {soldOut ? (
                                                                                                <span className="text-[10px] text-red-600 font-semibold mt-1">Sold Out</span>
                                                                                            ) : (typeof remaining === "number" ? (
                                                                                                <span className="text-[10px] text-gray-500 mt-1">{remaining} left</span>
                                                                                            ) : null)}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                         </div>
                                       </div>
 
                                       {/* Extra sizes: +Rp 10.000 each */}
                                       <div className="mb-4">
                                          <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-semibold text-orange-700">Adult Sizes (Extra - +Rp 10.000 each):</p>
                                            <button
                                              type="button"
                                              onClick={() => openSizeChart()}
                                                                                           className="text-xs text-orange-600 hover:text-orange-700 underline"
                                            >
                                              Size Guide
                                            </button>
                                          </div>

                                          <div className="grid grid-cols-4 gap-3">
                                                                                        {["XXL","3L","4L","5L"].map((size) => {
                                                                                            const soldOut = isSizeSoldOut(size);
                                                                                            const remaining = getSelectableMaxForSize(size);
                                                                                            return (
                                                                                                <div key={size} className="flex flex-col items-center">
                                                                                                    <div className="flex items-center gap-1 mb-2">
                                                                                                        <span className="text-xs font-medium text-orange-700">{size}</span>
                                                                                                        <span className="text-[10px] text-orange-500 font-semibold">+10k</span>
                                                                                                    </div>
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        min={0}
                                                                                                        max={typeof remaining === "number" ? remaining : undefined}
                                                                                                        value={jerseys[size] ?? ""}
                                                                                                        onChange={(e) => updateJersey(size, e.target.value === "" ? "" : Number(e.target.value))}
                                                                                                        className="jersey-input shift-right accent-orange-500 border-orange-300 focus:border-orange-500"
                                                                                                        placeholder="0"
                                                                                                        inputMode="numeric"
                                                                                                        aria-label={`Count for size ${size}`}
                                                                                                        disabled={soldOut}
                                                                                                    />
                                                                                                    {soldOut ? (
                                                                                                        <span className="text-[10px] text-red-600 font-semibold mt-1">Sold Out</span>
                                                                                                    ) : (typeof remaining === "number" ? (
                                                                                                        <span className="text-[10px] text-gray-500 mt-1">{remaining} left</span>
                                                                                                    ) : null)}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                          </div>
                                        </div>

                                        {/* Large extra sizes: +Rp 20.000 each */}
                                        <div className="mb-4">
                                          <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-semibold text-red-600">Large Extra Sizes (Extra - +Rp 20.000 each):</p>
                                            <button
                                              type="button"
                                              onClick={() => openSizeChart()}
                                              className="text-xs text-red-500 hover:text-red-600 underline"
                                            >
                                              Size Guide
                                            </button>
                                          </div>

                                          <div className="grid grid-cols-3 gap-3">
                                                                                        {["6L"].map((size) => {
                                                                                            const soldOut = isSizeSoldOut(size);
                                                                                            const remaining = getSelectableMaxForSize(size);
                                                                                            return (
                                                                                                <div key={size} className="flex flex-col items-center">
                                                                                                    <div className="flex items-center gap-1 mb-2">
                                                                                                        <span className="text-xs font-medium text-red-600">{size}</span>
                                                                                                        <span className="text-[10px] text-red-500 font-semibold">+20k</span>
                                                                                                    </div>
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        min={0}
                                                                                                        max={typeof remaining === "number" ? remaining : undefined}
                                                                                                        value={jerseys[size] ?? ""}
                                                                                                        onChange={(e) => updateJersey(size, e.target.value === "" ? "" : Number(e.target.value))}
                                                                                                        className="jersey-input shift-right accent-red-500 border-red-300 focus:border-red-500"
                                                                                                        placeholder="0"
                                                                                                        inputMode="numeric"
                                                                                                        aria-label={`Count for size ${size}`}
                                                                                                        disabled={soldOut}
                                                                                                    />
                                                                                                    {soldOut ? (
                                                                                                        <span className="text-[10px] text-red-600 font-semibold mt-1">Sold Out</span>
                                                                                                    ) : (typeof remaining === "number" ? (
                                                                                                        <span className="text-[10px] text-gray-500 mt-1">{remaining} left</span>
                                                                                                    ) : null)}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                          </div>
                                        </div>

                                        <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-purple-700">Kids Sizes:</p>
                                    <button
                                      type="button"
                                      onClick={() => openSizeChart()}
                                      className="text-xs text-purple-600 hover:text-purple-700 underline"
                                    >
                                      Size Guide
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-3 gap-3">
                                                                        {["XS - KIDS", "S - KIDS", "M - KIDS", "L - KIDS", "XL - KIDS"].map((size) => {
                                                                            const soldOut = isSizeSoldOut(size);
                                                                            const remaining = getSelectableMaxForSize(size);
                                                                            return (
                                                                                <div key={size} className="flex flex-col items-center">
                                                                                    <div className="flex items-center gap-1 mb-2">
                                                                                        <span className="text-xs font-medium text-purple-700">{size}</span>
                                                                                    </div>
                                                                                    <input
                                                                                        type="number"
                                                                                        min={0}
                                                                                        max={typeof remaining === "number" ? remaining : undefined}
                                                                                        value={jerseys[size] ?? ""}
                                                                                        onChange={(e) => updateJersey(size, e.target.value === "" ? "" : Number(e.target.value))}
                                                                                        className="jersey-input shift-right accent-purple-500 border-purple-300 focus:border-purple-500"
                                                                                        placeholder="0"
                                                                                        inputMode="numeric"
                                                                                        aria-label={`Count for size ${size}`}
                                                                                        disabled={soldOut}
                                                                                    />
                                                                                    {soldOut ? (
                                                                                        <span className="text-[10px] text-red-600 font-semibold mt-1">Sold Out</span>
                                                                                    ) : (typeof remaining === "number" ? (
                                                                                        <span className="text-[10px] text-gray-500 mt-1">{remaining} left</span>
                                                                                    ) : null)}
                                                                                </div>
                                                                            );
                                                                        })}
                                  </div>
                                </div>

                                        <p className="text-xs text-gray-500 mt-3 text-center">
                                            Total: {Object.values(jerseys).reduce<number>((sum, val) => sum + Number(val || 0), 0)} / 4
                                        </p>
                                    </div>

                                    {/* Family Bundle Pricing Display */}
                                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg">
                                        <div className="space-y-2 mb-3">
                                            <span className="text-sm font-semibold text-gray-700 block">Price per person:</span>
                                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                                {discountInfo && (
                                                    <>
                                                        <span className="text-xs sm:text-sm text-gray-400 line-through">
                                                            Rp {discountInfo.basePrice.toLocaleString("id-ID")}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                                                            -{discountInfo.discountPercent}%
                                                        </span>
                                                    </>
                                                )}
                                                <span className="text-base sm:text-lg font-bold text-purple-700 whitespace-nowrap">
                                                    Rp {currentPrice.toLocaleString("id-ID")}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-purple-200">
                                            <div className="space-y-2 mb-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        Base subtotal ({(() => {
                                                            const cat = categories.find(c => c.id === categoryId);
                                                            return cat?.bundleSize || 4;
                                                        })()} people):
                                                    </span>
                                                    <span className="text-base font-bold text-emerald-700">
                                                        Rp {(() => {
                                                            const cat = categories.find(c => c.id === categoryId);
                                                            const bundleSize = cat?.bundleSize || 4;
                                                            return (currentPrice * bundleSize).toLocaleString("id-ID");
                                                        })()}
                                                    </span>
                                                </div>
                                                {calculateJerseyCharges(jerseys) > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-orange-600">Extra size charges:</span>
                                                        <span className="text-sm font-semibold text-orange-600">
                                                            +Rp {calculateJerseyCharges(jerseys).toLocaleString("id-ID")}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="pt-2 border-t border-purple-200">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-gray-700">Grand Total:</span>
                                                        <span className="text-lg sm:text-xl font-bold text-purple-800 block">
                                                            Rp {currentSubtotal.toLocaleString("id-ID")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                        <button
                                            onClick={handleCheckout}
                                            className="flex-1 px-6 py-3 rounded-full font-bold shadow-xl transition-all transform bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:shadow-2xl"
                                        >
                                            Proceed to Checkout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    


                    {/* Community layout with improved pricing */}
                    {type === "community" && (
                        <div className="space-y-6 mt-6">

                            <div className="rounded-lg border border-gray-200 p-5 bg-white">
                                <div className="space-y-5">
                                    {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-3"> */}
                                        {/* <p className="text-xs text-blue-700">
                                            💡 <strong>Tip:</strong> Add multiple categories! Total participants across all categories determine your tier pricing.
                                            Example: 20 in 3K + 20 in 5K + 20 in 10K = 60 total → Best pricing tier!
                                        </p> */}
                                    {/* </div> */}

                                    <div className="grid gap-3">
                                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Race Category *</label>
                                        <select
                                            value={categoryId ?? ""}
                                            onChange={(e) => setCategoryId(Number(e.target.value))}
                                            className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 focus:border-emerald-500 focus:outline-none transition-colors text-base cursor-pointer"
                                        >
                                            {categories.map((cat) => {
                                                const isDisabled = isCategorySoldOut(cat);
                                                const slotInfo = getCategorySlotInfo(cat);
                                                return (
                                                    <option key={cat.id} value={cat.id} disabled={isDisabled}>
                                                        {cat.name} {isDisabled ? "(Sold Out!)" : (slotInfo ? `(${slotInfo.remaining} slots left)` : "")} - Starting from Rp {Number(cat.basePrice).toLocaleString("id-ID")}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div className="grid gap-3">
                                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Number of Participants (for this category) <strong className="text-red-500">*</strong></label>
                                        <input
                                            type="number"
                                            value={participants}
                                            onChange={(e) => setParticipants(e.target.value === "" ? "" : Number(e.target.value))}
                                            className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-base"
                                            placeholder="Enter participant amount"
                                        />
                                        {/* <p className="text-xs text-gray-500 mt-1">
                                            This will be added to your community total ({getTotalCommunityParticipants()} currently in cart)
                                        </p> */}
                                        {/* Inline quota error for community */}
                                        {(() => {
                                            const quotaErr = getCommunityQuotaError(categoryId, Number(participants || 0));
                                            if (!quotaErr) return null;
                                            return (
                                                <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-2">
                                                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                    <p className="text-xs text-red-700 font-semibold">{quotaErr}</p>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* LIVE TIER INFO */}
                                    {tierInfo && Number(participants || 0) > 0 && (
                                        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-gray-700">Current Tier:</span>
                                                    <span className="px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                                                        {tierInfo.tier}
                                                    </span>
                                                </div>
                                                {tierInfo.totalInCart > 0 && (
                                                    <div className="text-xs text-gray-600">
                                                        Total: {tierInfo.totalWithCurrent} participants ({tierInfo.totalInCart} in cart + {Number(participants || 0)} current)
                                                    </div>
                                                )}
                                                {tierInfo.nextTier && tierInfo.participantsToNext > 0 && (
                                                    <div className="pt-2 border-t border-purple-200">
                                                        <p className="text-xs text-purple-700">
                                                            🎯 Add <strong>{tierInfo.participantsToNext}</strong> more to unlock <strong>{tierInfo.nextTier}</strong> pricing!
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid gap-3">
                                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Jersey Size Distribution *</label>
                                        
                                        {/* Adult Sizes - Standard */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-semibold text-gray-700">Adult Sizes (Standard):</p>
                                                <button
                                                    type="button"
                                                    onClick={() => openSizeChart()}
                                                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                                                >
                                                    Size Guide
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                                                                {["S", "M", "L", "XL"].map((size) => {
                                                                                                    const soldOut = isSizeSoldOut(size);
                                                                                                    const remaining = getSelectableMaxForSize(size);
                                                                                                    return (
                                                                                                        <div key={size} className="flex flex-col items-center">
                                                                                                            <div className="flex items-center gap-1 mb-2">
                                                                                                                <span className="text-xs font-medium text-gray-700">{size}</span>
                                                                                                            </div>
                                                                                                            <input
                                                                                                                type="number"
                                                                                                                min={0}
                                                                                                                max={typeof remaining === "number" ? remaining : undefined}
                                                                                                                value={jerseys[size] ?? ""}
                                                                                                                onChange={(e) => updateJersey(size, e.target.value === "" ? "" : Number(e.target.value))}
                                                                                                                className="jersey-input shift-right accent-purple-500 border-purple-300 focus:border-purple-500"
                                                                                                                placeholder="0"
                                                                                                                inputMode="numeric"
                                                                                                                aria-label={`Count for size ${size}`}
                                                                                                                disabled={soldOut}
                                                                                                            />
                                                                                                            {soldOut ? (
                                                                                                                <span className="text-[10px] text-red-600 font-semibold mt-1">Sold Out</span>
                                                                                                            ) : (typeof remaining === "number" ? (
                                                                                                                <span className="text-[10px] text-gray-500 mt-1">{remaining} left</span>
                                                                                                            ) : null)}
                                                                                                        </div>
                                                                                                    );
                                                                                                })}
                                                 </div>
                                              
                                        </div>

                                        {/* Extra sizes: +Rp 10.000 each */}
                                       <div className="mb-4">
                                          <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-semibold text-orange-700">Adult Sizes (Extra - +Rp 10.000 each):</p>
                                            <button
                                              type="button"
                                              onClick={() => openSizeChart()}
                                              className="text-xs text-orange-600 hover:text-orange-700 underline"
                                            >
                                              Size Guide
                                            </button>
                                          </div>

                                          <div className="grid grid-cols-4 gap-3">
                                                                                        {["XXL","3L","4L","5L"].map((size) => {
                                                                                            const soldOut = isSizeSoldOut(size);
                                                                                            const remaining = getSelectableMaxForSize(size);
                                                                                            return (
                                                                                                <div key={size} className="flex flex-col items-center">
                                                                                                    <div className="flex items-center gap-1 mb-2">
                                                                                                        <span className="text-xs font-medium text-orange-700">{size}</span>
                                                                                                        <span className="text-[10px] text-orange-500 font-semibold">+10k</span>
                                                                                                    </div>
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        min={0}
                                                                                                        max={typeof remaining === "number" ? remaining : undefined}
                                                                                                        value={jerseys[size] ?? ""}
                                                                                                        onChange={(e) => updateJersey(size, e.target.value === "" ? "" : Number(e.target.value))}
                                                                                                        className="jersey-input shift-right accent-orange-500 border-orange-300 focus:border-orange-500"
                                                                                                        placeholder="0"
                                                                                                        inputMode="numeric"
                                                                                                        aria-label={`Count for size ${size}`}
                                                                                                        disabled={soldOut}
                                                                                                    />
                                                                                                    {soldOut ? (
                                                                                                        <span className="text-[10px] text-red-600 font-semibold mt-1">Sold Out</span>
                                                                                                    ) : (typeof remaining === "number" ? (
                                                                                                        <span className="text-[10px] text-gray-500 mt-1">{remaining} left</span>
                                                                                                    ) : null)}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                          </div>
                                        </div>

                                        {/* Large extra sizes: +Rp 20.000 each */}
                                        <div className="mb-4">
                                          <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-semibold text-red-600">Large Extra Sizes (Extra - +Rp 20.000 each):</p>
                                            <button
                                              type="button"
                                              onClick={() => openSizeChart()}
                                              className="text-xs text-red-500 hover:text-red-600 underline"
                                            >
                                              Size Guide
                                            </button>
                                          </div>

                                          <div className="grid grid-cols-3 gap-3">
                                                                                        {["6L"].map((size) => {
                                                                                            const soldOut = isSizeSoldOut(size);
                                                                                            const remaining = getSelectableMaxForSize(size);
                                                                                            return (
                                                                                                <div key={size} className="flex flex-col items-center">
                                                                                                    <div className="flex items-center gap-1 mb-2">
                                                                                                        <span className="text-xs font-medium text-red-600">{size}</span>
                                                                                                        <span className="text-[10px] text-red-500 font-semibold">+20k</span>
                                                                                                    </div>
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        min={0}
                                                                                                        max={typeof remaining === "number" ? remaining : undefined}
                                                                                                        value={jerseys[size] ?? ""}
                                                                                                        onChange={(e) => updateJersey(size, e.target.value === "" ? "" : Number(e.target.value))}
                                                                                                        className="jersey-input shift-right accent-red-500 border-red-300 focus:border-red-500"
                                                                                                        placeholder="0"
                                                                                                        inputMode="numeric"
                                                                                                        aria-label={`Count for size ${size}`}
                                                                                                        disabled={soldOut}
                                                                                                    />
                                                                                                    {soldOut ? (
                                                                                                        <span className="text-[10px] text-red-600 font-semibold mt-1">Sold Out</span>
                                                                                                    ) : (typeof remaining === "number" ? (
                                                                                                        <span className="text-[10px] text-gray-500 mt-1">{remaining} left</span>
                                                                                                    ) : null)}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                          </div>
                                        </div>

                                        <div className="mb-4">
                                          <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-semibold text-purple-700">Kids Sizes:</p>
                                            <button
                                              type="button"
                                              onClick={() => openSizeChart()}
                                              className="text-xs text-purple-600 hover:text-purple-700 underline"
                                            >
                                              Size Guide
                                            </button>
                                          </div>

                                          <div className="grid grid-cols-3 gap-3">
                                                                                        {["XS - KIDS", "S - KIDS", "M - KIDS", "L - KIDS", "XL - KIDS"].map((size) => {
                                                                                            const soldOut = isSizeSoldOut(size);
                                                                                            const remaining = getSelectableMaxForSize(size);
                                                                                            return (
                                                                                                <div key={size} className="flex flex-col items-center">
                                                                                                    <div className="flex items-center gap-1 mb-2">
                                                                                                        <span className="text-xs font-medium text-purple-700">{size}</span>
                                                                                                    </div>
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        min={0}
                                                                                                        max={typeof remaining === "number" ? remaining : undefined}
                                                                                                        value={jerseys[size] ?? ""}
                                                                                                        onChange={(e) => updateJersey(size, e.target.value === "" ? "" : Number(e.target.value))}
                                                                                                        className="jersey-input shift-right accent-purple-500 border-purple-300 focus:border-purple-500"
                                                                                                        placeholder="0"
                                                                                                        inputMode="numeric"
                                                                                                        aria-label={`Count for size ${size}`}
                                                                                                        disabled={soldOut}
                                                                                                    />
                                                                                                    {soldOut ? (
                                                                                                        <span className="text-[10px] text-red-600 font-semibold mt-1">Sold Out</span>
                                                                                                    ) : (typeof remaining === "number" ? (
                                                                                                        <span className="text-[10px] text-gray-500 mt-1">{remaining} left</span>
                                                                                                    ) : null)}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                          </div>
                                        </div>

                                        <p className="text-xs text-gray-500 mt-3 text-center">
                                            Total: {Object.values(jerseys).reduce<number>((sum, val) => sum + Number(val || 0), 0)} / {participants || 0}
                                        </p>
                                    </div>

                                    {/* Dynamic Pricing Display with Discount and Jersey Charges */}
                                    {Number(participants || 0) > 0 && (
                                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-300 rounded-lg">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-sm font-semibold text-gray-700">Price per person:</span>
                                                <div className="flex items-center gap-3">
                                                    {discountInfo && (
                                                        <>
                                                            <span className="text-sm text-gray-400 line-through">
                                                                Rp {discountInfo.basePrice.toLocaleString("id-ID")}
                                                            </span>
                                                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                                                                -{discountInfo.discountPercent}%
                                                            </span>
                                                        </>
                                                    )}
                                                    <span className="text-lg font-bold text-emerald-700">
                                                        Rp {currentPrice.toLocaleString("id-ID")}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-emerald-200">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        Base subtotal ({participants} people{getTotalCommunityParticipants() > 0 ? ` + ${getTotalCommunityParticipants()} in cart` : ""}):
                                                    </span>
                                                    <span className="text-base font-bold text-emerald-700">
                                                        Rp {(currentPrice * Number(participants || 0)).toLocaleString("id-ID")}
                                                    </span>
                                                </div>
                                                {calculateJerseyCharges(jerseys) > 0 && (
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm text-orange-600">Extra size charges:</span>
                                                        <span className="text-sm font-semibold text-orange-600">
                                                            +Rp {calculateJerseyCharges(jerseys).toLocaleString("id-ID")}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="pt-2 border-t border-emerald-200">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-gray-700">Grand Total:</span>
                                                        <span className="text-xl font-bold text-emerald-800">
                                                            Rp {currentSubtotal.toLocaleString("id-ID")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isSubmitting || !!getCommunityQuotaError(categoryId, Number(participants || 0))}
                                    className={`w-1/2 md:w-1/3 px-6 py-3 rounded-full font-bold shadow-xl transition-all transform ${
                                        getCommunityQuotaError(categoryId, Number(participants || 0))
                                            ? 'bg-gray-400 cursor-not-allowed opacity-60'
                                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:shadow-2xl hover:scale-105 active:scale-95'
                                    } text-white shadow-xl`}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        "Add to Cart"
                                    )}
                                </button>
                            </div>

                            {/* Add Checkout Button for Cart Items */}
                            {cart.length > 0 && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg">
                                    <div className="text-center mb-3">
                                        <p className="text-sm font-semibold text-gray-700">
                                            You have {cart.length} item{cart.length > 1 ? 's' : ''} in your cart
                                        </p>
                                    </div>
                                    <CheckoutButton />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Individual layout */}
                    {type === "individual" && (
                        <div className="space-y-4 mt-6">
                            <div className="grid gap-3">
                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Categories</label>
                                <select
                                    value={categoryId ?? ""}
                                    onChange={(e) => setCategoryId(Number(e.target.value))}
                                    className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 focus:border-blue-500 focus:outline-none transition-colors text-base cursor-pointer"
                                >
                                    {categories.map((cat) => {
                                        const isDisabled = isCategorySoldOut(cat);
                                        const slotInfo = getCategorySlotInfo(cat);
                                        return (
                                            <option key={cat.id} value={cat.id} disabled={isDisabled}>
                                                {cat.name} {isDisabled ? "(Sold Out!)" : (slotInfo ? `(${slotInfo.remaining} slots left)` : "")} - Rp {Number(cat.basePrice).toLocaleString("id-ID")}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="text-xs text-gray-500">
                                {type === "individual" && selectedCategory?.earlyBirdRemaining && selectedCategory?.earlyBirdRemaining > 0

                                    ? `Early-bird automatically applied (${selectedCategory?.earlyBirdRemaining} slots remaining).`
                                   
                                    : null}
                            </div>

                            {/* Jersey Size Selection with Extra Size Indicator */}
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Jersey Size</label>
                                    <button
                                        type="button"
                                        onClick={() => openSizeChart()}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                        Size Guide
                                    </button>
                                </div>
                                <select
                                    value={selectedJerseySize}
                                    onChange={(e) => setSelectedJerseySize(e.target.value)}
                                    className="w-full px-4 py-3 border-b-2 border-gray-200 bg-transparent text-gray-800 focus:border-blue-500 focus:outline-none transition-colors text-base cursor-pointer"
                                >
                                    <optgroup label="Adult Sizes">
                                        {adultJerseys.map((jersey) => {
                                            const soldOut = isSizeSoldOut(jersey.size);
                                            const remaining = getSelectableMaxForSize(jersey.size);
                                            return (
                                                <option key={jersey.size} value={jersey.size} disabled={soldOut}>
                                                    {jersey.size}
                                                    {jersey.isExtraSize ? ` (+Rp ${Number(jersey.price).toLocaleString("id-ID")})` : ''}
                                                    {soldOut ? " (Sold Out)" : (typeof remaining === "number" ? ` (${remaining} left)` : "")}
                                                </option>
                                            );
                                        })}
                                    </optgroup>
                                    <optgroup label="Kids Sizes">
                                        {kidsJerseys.map((jersey) => {
                                            const soldOut = isSizeSoldOut(jersey.size);
                                            const remaining = getSelectableMaxForSize(jersey.size);
                                            return (
                                                <option key={jersey.size} value={jersey.size} disabled={soldOut}>
                                                    {jersey.size}
                                                    {soldOut ? " (Sold Out)" : (typeof remaining === "number" ? ` (${remaining} left)` : "")}
                                                </option>
                                            );
                                        })}
                                    </optgroup>
                                </select>

                                {(() => {
                                    const remaining = getSelectableMaxForSize(selectedJerseySize);
                                    if (typeof remaining !== "number") return null;
                                    return (
                                        <p className="text-xs text-gray-500">
                                            Remaining quota for {selectedJerseySize}: {remaining}
                                        </p>
                                    );
                                })()}
                                
                                {/* Extra Size Notice */}
                                {jerseyOptions.find(j => j.size === selectedJerseySize)?.isExtraSize && (
                                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                        <p className="text-xs text-orange-700">
                                            <strong>ℹ️ Extra Size:</strong> This size requires an additional charge of Rp {calculateIndividualJerseyCharge(selectedJerseySize).toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Price Display with Jersey Charges - FIXED */}
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg">
                                <div className="space-y-2">
                                    <span className="text-sm font-semibold text-gray-700 block">Price breakdown:</span>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Base price:</span>
                                            <div className="text-right">
                                                {discountInfo ? (
                                                    <>
                                                        <div className="text-sm text-gray-400 line-through">
                                                            Rp {discountInfo.basePrice.toLocaleString("id-ID")}
                                                        </div>
                                                        <div className="text-lg font-bold text-blue-700">
                                                            Rp {currentPrice.toLocaleString("id-ID")}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-lg font-bold text-blue-700">
                                                        Rp {currentPrice.toLocaleString("id-ID")}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Discount badge / savings */}
                                        {discountInfo && (
                                            <div className="flex items-center justify-between">
                                                <div />
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                                        -{discountInfo.discountPercent}%
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        {/* Extra size charge */}
                                        {calculateIndividualJerseyCharge(selectedJerseySize) > 0 && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Extra size charge:</span>
                                                <span className="text-sm font-semibold text-orange-600">
                                                    +Rp {calculateIndividualJerseyCharge(selectedJerseySize).toLocaleString("id-ID")}
                                                </span>
                                            </div>
                                        )}

                                        <div className="pt-2 border-t border-blue-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-700">Total:</span>
                                                <span className="text-lg font-bold text-emerald-800">
                                                    Rp {(currentPrice + calculateIndividualJerseyCharge(selectedJerseySize)).toLocaleString("id-ID")}
                                               </span>
                                            </div>
                                        </div>
                                     </div>
                                 </div>
                             </div>
                            {/* Buy Now Button */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-4">

                                <button
                                    onClick={handleCheckout}
                                    disabled={isSubmitting}
                                    className={`flex-1 px-6 py-3 rounded-full font-bold shadow-xl transition-all transform ${
                                        isSubmitting
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white hover:shadow-2xl'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        "Buy Now"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* Terms and Conditions Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col terms-modal">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                            <h3 className="text-2xl font-bold text-white text-center">
                                Terms & Conditions
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 text-gray-700 terms-content">
                            <h1 className="text-lg md:text-xl font-extrabold text-gray-900">
                              TERMS AND CONDITIONS FOR PARTICIPANTS OF UNIVERSITAS CIPUTRA COLOR RUN 2026
                            </h1>

                            <p className="text-sm">
                              <strong>By registering as a participant in Universitas Ciputra Color Run 2026, the participant fully accepts and agrees to comply with the rules and conditions below.</strong>
                            </p>

                            <h2 className="mt-4 font-bold">SECTION 1: GENERAL EVENT INFORMATION</h2>
                            <ul className="list-disc pl-6 text-sm">
                              <li><strong>Event Name:</strong> Universitas Ciputra Color Run 2026</li>
                              <li><strong>Event Date:</strong> April 12, 2026</li>
                              <li><strong>Event Time:</strong> 04:00 - 09:30 WIB</li>
                              <li><strong>Event Location:</strong> Ciputra University Surabaya</li>
                            </ul>

                            <h2 className="mt-4 font-bold">SECTION 2: REGISTRATION & PARTICIPANT CATEGORIES</h2>
                            {/* Remove type="1" and use a custom class to force decimal numbering */}
                            <ol className="pl-6 text-sm space-y-2 terms-ol-numbered">
                              <li>
                                <strong>Identification Card Definition:</strong>
                                <ol className="pl-6 mt-1 space-y-1 terms-ol-roman">
                                  <li>
                                    Identification Card as referred to in these terms and conditions is an official personal identification document issued by an authorized agency and is still valid.
                                  </li>
                                  <li>
                                    Documents that can be used for registration, data verification, and race pack collection include:
                                    {/* Use alphabetic list for documents */}
                                    <ol
                                      className="pl-6 mt-1 space-y-1 terms-ol-alpha"
                                      style={{ listStyleType: "lower-alpha" }}
                                    >
                                      <li><strong>Adult Indonesian Citizen: </strong> Resident Identity Card (KTP), Driver's License (SIM), Digital Population Identity (IKD), or other official identification cards issued by the Government of the Republic of Indonesia.</li>
                                      <li><strong>Child Participants (under 17 years old):</strong> Child Identity Card (KIA), Birth Certificate, Student Card, or other official documents.</li>
                                      <li><strong>Foreign Citizens (WNA):</strong> Passport, Limited Stay Permit Card (KITAS), Permanent Stay Permit Card (KITAP), or other internationally recognized official identification documents.</li>
                                    </ol>
                                  </li>
                                </ol>
                              </li>

                              <li>
                                <strong>Participants:</strong>
                                <ol className="pl-6 mt-1 space-y-1 terms-ol-roman">
                                  <li>This event is open to the General Public, Indonesian Citizens (WNI), and Foreign Citizens (WNA).</li>
                                  <li>Incorrect data entry that results in discrepancies during verification may lead to registration cancellation.</li>
                                  <li>Participants under the age of 13 must be accompanied by a guardian who is at least 17 years old throughout the entire event, including during race pack collection and while on the event premises. The guardian is fully responsible for the safety, security, and actions of the participant during the event.</li>
                                </ol>
                              </li>
                              <li>
                                <strong>Registration Period: </strong>
                                <ol className="pl-6 mt-1 space-y-1 terms-ol-roman">
                                  Registration is opened from 1 December 2025 until the maximum quota has been fulfilled.
                                </ol>
                              </li>
                              <li>
                                <strong>Registration Platform: </strong>
                                <ol className="pl-6 mt-1 space-y-1 terms-ol-roman">
                                  <li>Participants can register through the official Universitas Ciputra Color Run 2026 website at <a href="https://ciputrarun.com" className="text-blue-600 underline">https://ciputracolorrun.com</a>.</li>
                                  <li>Event organizers are not responsible for any consequences resulting from purchases made outside the official platform.</li>
                                </ol>
                              </li>
                              <li>
                                <strong>Categories & Pricing: </strong>
                                <ol className="pl-6 mt-1 space-y-1 terms-ol-roman">
                                    <li>The registration fee is categorized based on the distance covered, as follows:
                                        <ol type = "a" className="pl-6 mt-1 space-y-1 terms-ol-alpha">
                                            <li>3 KM: Rp 130.000,- (Early Bird) | Rp 150.000,- (Normal Price)</li>
                                            <li>5 KM: Rp 180.000,- (Early Bird) | Rp 200.000,- (Normal Price)</li>
                                            <li>10 KM: Rp 220.000,- (Early Bird) | Rp 250.000,- (Normal Price)</li>
                                        </ol>
                                    </li>
                                </ol>
                              </li>
                              <li>
                                <strong>Registration Status: </strong>
                                 Registration will be declared successful and valid after the participant has made full payment. The organizer will send a confirmation email as proof of ticket purchase.
                              </li>
                              <li>
                                <strong>Data Accuracy: </strong>
                                <ol className="pl-6 mt-1 space-y-1 terms-ol-roman">
                                    <li>
                                        Participants are required to complete the registration form with accurate personal information, including but not limited to name, date of birth, email address, and phone number. Once the registration is submitted, the data cannot be changed under any circumstances.
                                    </li>
                                    <li>
                                        Errors in data entry that result in the cancellation of results or prizes are entirely the responsibility of the participants.
                                    </li>
                                </ol>
                              </li>
                              <li>
                                <strong>Quota: </strong>
                                The organizer reserves the right to close ticket sales if the quota has been met without prior notice.
                              </li>
                              <li>
                                <strong>Ticket Transfer: </strong>
                                Reselling tickets is prohibited.
                              </li>
                              <li>
                                <strong>Category Changes: </strong>
                                Participants are not allowed to change the distance category.
                              </li>
                            </ol>
                            <h2 className="mt-4 font-bold">SECTION 3: CANCELLATION & REFUND POLICY</h2>
                            <ol type="1" className="pl-6 text-sm space-y-2 terms-ol-decimal">
                              <li>
                                <strong>Final: </strong>
                                Registration that has been successful is final and cannot be canceled.
                                </li>
                                <li>
                                <strong>Non-Refundable: </strong>
                                Registration fees that have been paid are <strong>non-refundable</strong> for any reason, including if the participant does not attend the event.
                              </li>
                              <li>
                                <strong>Force Majeure: </strong>
                                If the event is forcefully canceled due to conditions beyond the organizer's control (such as heavy rain, storms, natural disasters, demonstrations, government policies), the organizer is <strong>not obligated to refund the registration fee.</strong>
                              </li>
                              <li>
                                <strong>Changes of schedule/location: </strong>
                                If there are changes to the event date or location, purchased tickets remain valid for the new schedule or location. Participants are not entitled to a refund.
                              </li>
                            </ol>
                            <h2 className = "mt-4 font-bold">SECTION 4: RACE PACK CLAIM</h2>
                            <ol type="1" className="pl-6 text-sm space-y-2 terms-ol-decimal">
                                <li>
                                    <strong>Race Pack Contents: </strong>
                                    Every registered participant is entitled to a Race Pack, which includes a Running Jersey and a Bib Number. 
                                </li>
                                <li>
                                    <strong>Collection Schedule:</strong>
                                    <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>
                                            <strong>Date: </strong>9-11 April 2026
                                        </li>
                                        <li>
                                            <strong>Location: </strong>Corepreneur, 1st Floor UC Tower, Universitas Ciputra Surabaya
                                        </li>
                                        <li>
                                             <strong>Operational Hours: </strong>To be announced (TBA)
                                        </li>
                                    </ol>
                                </li>
                                <li>
                                    <strong>Late Collection (Race Day): </strong>
                                    Participants unable to collect during the main schedule are permitted to collect on the event day (April 12, 2026) at the event location, no later than 05:00 WIB.
                                </li>
                                <li>
                                    <strong>Collection Requirements: </strong>
                                    <ol type="a" className="pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>
                                            <strong>Self Collection: </strong>Participants must present the purchase QR Code (print or digital) and a valid Identity Card (ID Card).
                                        </li>
                                        <li>
                                            <strong>Collection via Representative: </strong>
                                            Collection may be delegated provided the Representative (Proxy) brings:
                                            <ol type="i" className="pl-6 mt-1 space-y-1">
                                                <li>The QR Code from the registrant’s account.</li>
                                                <li>A Power of Attorney (Surat Kuasa) signed by the participant (Grantor).</li>
                                                <li>A photocopy of the Participant's ID Card.</li>
                                                <li>The Representative must show their original ID Card, which matches the name on the Power of Attorney</li>
                                            </ol>
                                        </li>
                                    </ol> 
                                </li>
                                <li>
                                    <strong>Jersey Sizes: </strong>
                                    <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>Jersey sizes are provided according to the selection made during registration.</li>
                                        <li>Size exchanges are not permitted.</li>
                                    </ol>
                                </li>
                                <li>
                                    <strong>Lateness: </strong>
                                    The Organizer is not responsible for a participant's failure to collect the Race Pack outside the scheduled times and provisions.
                                </li>
                            </ol>
                            <h2 className="mt-4 font-bold">SECTION 5: EVENT DAY REGULATIONS</h2>
                            <ol type="1" className="pl-6 text-sm space-y-2 terms-ol-decimal">
                                <li>
                                    <strong>Route: </strong>Participants are required to run on the designated route and comply with safety standards and traffic regulations.
                                </li>
                                <li>
                                    <strong>Prohibited Items on Route: </strong>Participants are prohibited from bringing pets, bicycles, roller skates, skateboards, or other wheeled objects onto the running course.
                                </li>
                                <li>
                                    <strong>Lateness and Cut-Off Time (COT): </strong>Late participants are allowed to start, but no extra time will be given. The Cut-Off Time for completing the run remains absolute according to the schedule.
                                </li>
                                <li>
                                    <strong>Disqualification: </strong>The Organizer reserves the right to disqualify participants who behave inappropriately, disturb others, or fail to comply with established rules.
                                </li>
                                <li>
                                    <strong>Facilities: </strong>Water Stations will be provided at several points along the route.
                                </li>
                                <li>
                                    <strong>Personal Belongings: </strong>Participants may carry personal items (phones, wallets, keys, meds), <strong>but all risks of security, damage, or loss outside the Drop Bag area are the participant's sole responsibility.</strong>
                                </li>
                                <li>
                                    <strong>Cleanliness: </strong>Participants must maintain cleanliness throughout the event area.
                                </li>
                                <li>
                                    <strong>Prizes/Doorprizes: </strong>Prizes are valid only for officially registered participants (committee members are excluded)
                                </li>
                                <li>
                                    <strong>Baggage Deposit Service (Drop Bag): </strong>
                                    <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>
                                            <strong>Identification Mechanism: </strong>
                                            <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                                <li>
                                                    The organizer will provide baggage services using numbered stickers.
                                                </li>
                                                <li>
                                                    The stickers are matched to the Bib Number of the participants when claiming the baggage back.
                                                </li>
                                            </ol>
                                        </li>
                                        <li>
                                            <strong>Valuables: </strong>
                                            <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                                <li>
                                                    Valuables (phones, wallets, keys, etc.) may be deposited only if placed inside a sealed bag or container before being placed in the box.
                                                </li>
                                                <li>
                                                    Loose, unwrapped items are not accepted .
                                                </li>
                                            </ol>
                                        </li>
                                        <li>
                                            <strong>Prohibited Items: </strong>
                                            The Organizer reserves the right to refuse items that pose a risk or liability, including:
                                            <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                                <li>
                                                    Items with strong odors (e.g. Durian, Items with a strong smell, etc.)
                                                </li>
                                                <li>
                                                    Pets
                                                </li>
                                                <li>
                                                    Sharp objects, weapons, or explosives
                                                </li>
                                                <li>
                                                    Consumables prone to leaking or rotting
                                                </li>
                                            </ol>
                                        </li>
                                        <li>
                                            <strong>Liability Limits: </strong>
                                            <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                                <li>
                                                    The Organizer is responsible only for items officially deposited at the Drop Bag Counter.
                                                </li> 
                                            </ol> 
                                        </li>
                                        <li>
                                            <strong>Unclaimed Items: </strong>
                                            If any items remain unclaimed after the event, the organizing committee will attempt to identify the owner through the Bib Number and contact the participant via the registered WhatsApp number for confirmation.
                                        </li>
                                        <li>
                                            <strong>Claim Limits: </strong>
                                            Participants who have been confirmed as the owners of the items are given a maximum period of seven (7) days after the event date to collect the lost items at the designated location.
                                        </li>
                                        <li>
                                            <strong>Unclaimed Items Condition: </strong>
                                            <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                                <li>
                                                    Security guarantees apply only on the event day.
                                                </li>
                                                <li>
                                                    The Organizer is <strong>not liable</strong> for deterioration or damage to items collected after the event day.
                                                </li>
                                            </ol>
                                        </li>
                                    </ol>
                                </li>     
                            </ol>
                            <h2 className="mt-4 font-bold">SECTION 6: HEALTH, SAFETY & LIABILITY WAIVER</h2>
                            <ol type="1" className="pl-6 text-sm space-y-2 terms-ol-decimal">
                                <li>
                                    <strong>Participant Risk: </strong>
                                    By registering, the participant acknowledges that this activity carries risks (including injury, loss, or life-threatening risks).
                                </li>
                                <li>
                                    <strong>Health Condition: </strong>
                                    <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>
                                            Participants are full responsible for their own health
                                        </li>
                                        <li>
                                            Participants must ensure they are physically fit to participate
                                        </li>
                                    </ol>
                                </li>
                                <li>
                                    <strong>Medical Services: </strong>
                                    <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>
                                            Basic safety and medical services are provided.
                                        </li>
                                        <li>
                                           Medical staff reserve the right to stop a participant if they are deemed medically unfit to continue.
                                        </li>
                                        <li>
                                            Only generic medications are provided by the organizers
                                        </li>
                                    </ol>
                                </li>
                                <li>
                                    <strong>Liability Waiver: </strong>The organizer is <strong>NOT </strong> responsible for:
                                    <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>
                                           Accidents and/or death experienced by participants during the event.
                                        </li>
                                        <li>
                                           Injuries, illnesses, or congenital diseases if the participant failed to declare them in the medical history field.
                                        </li>
                                        <li>
                                           The Organizer is only responsible for first aid for declared conditions.
                                        </li>
                                        <li>
                                            Drug allergies if not declared in the medication allergy field.
                                        </li>
                                        <li>
                                            Loss or theft of personal belongings.
                                        </li>
                                        <li>
                                            Participant Lateness
                                        </li>
                                    </ol>
                                </li>
                            </ol>
                            <h2 className="mt-4 font-bold">SECTION 7: WINNER PROVISIONS AND PRIZE COLLECTION</h2>
                            <ol type="1" className="pl-6 text-sm space-y-2 terms-ol-decimal">
                                <li>
                                    <strong>Winner Determination: </strong>Winners are determined based on arrival order at the finish line (Gun Time) as recorded by the system or official judges. Winners must complete the full route and pass all checkpoints.
                                </li>
                                <li>
                                    <strong>Foreign National (WNA) Provisions: </strong>
                                    <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>
                                            The Winner/Podium Category is a Closed Category applicable only to Indonesian Citizens (WNI).
                                        </li>
                                        <li>
                                            Foreign Nationals (WNA) are not entitled to champion titles, podium positions, or any prizes, even if they finish first.
                                        </li>
                                        <li>
                                            Position determination will be based on the arrival order of WNI participants.
                                        </li>
                                    </ol>
                                </li>
                                <li>
                                    <strong>Winner Verification: </strong>
                                    Potential podium winners must verify their data immediately upon finishing by showing:
                                    <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>
                                            The physical Bib Number still attached and intact.
                                        </li>
                                        <li>
                                            An original ID Card matching registration data .
                                        </li>
                                    </ol>
                                </li>
                                <li>
                                    <strong>Disqualification: </strong>Winner status may be revoked if the participant:
                                    <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>
                                            Cuts the course/does not complete the route
                                        </li>
                                        <li>
                                            Uses mobility aids
                                        </li>
                                    </ol>
                                </li>
                                <li>
                                    <strong>Award Ceremony: </strong>Winners must be present at the main stage for the announcement. If absent after being called 3 (three) times, podium ceremony rights may be forfeited.
                                </li>
                                <li>
                                    <strong>Jury Decision: </strong>All decisions by the jury and committee regarding winners are absolute, final, and incontestable.
                                </li>
                                <li>
                                    <strong>Prize Collection: </strong>Physical prizes must be collected at the venue. Cash prizes (if any) will be transferred to the winner's account within a maximum of 14 (fourteen) working days.
                                </li>
                            </ol>
                            <h2 className="mt-4 font-bold">SECTION 8: MEDIA USAGE & INTELLECTUAL PROPERTY RIGHTS</h2>
                            <ol type="1" className="pl-6 text-sm space-y-2 terms-ol-decimal">
                                <li>
                                    Participants agree that all photos, videos, and media recordings taken during the event may be used by the Organizer for promotional and marketing purposes across various platforms (social media, web, print) without obligation to provide compensation to the participant.
                                </li>
                                <li>
                                    All photo and video materials are the intellectual property of Universitas Ciputra Color Run 2026 and its network.
                                </li>
                            </ol>
                            <h2 className="mt-4 font-bold">SECTION 9: SPECIAL PROVISIONS FOR RUNNING COMMUNITIES</h2>
                            <ol type="1" className="pl-6 text-sm space-y-2 terms-ol-decimal">
                                <li>
                                    <strong>Community Definition: </strong>
                                    <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>
                                            A Community is defined as a group registering collectively under one group identity (e.g., running club, hobby community, company, school) with a clear structure or Person in Charge (PIC).
                                        </li>
                                        <li>
                                            A minimum of 10 (ten) participants is required.
                                        </li>
                                    </ol>
                                </li>
                                <li>
                                    <strong>PIC Responsibilities: </strong>
                                    <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>
                                            Each community must appoint 1 (one) PIC to act as a liaison.
                                        </li>
                                        <li>
                                            The PIC is responsible for conveying all official information and rules to members.
                                        </li>
                                    </ol>
                                </li>
                                <li>
                                    <strong>Collective Race Pack Collection: </strong>
                                    <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>
                                            Can be done by the PIC/Representative
                                        </li>
                                        <li>
                                            Requirements:
                                            <ol type="i" className="pl-6 mt-1 space-y-1">
                                                <li>
                                                    QR Code from the registered accounts from the website for race pack collection
                                                </li>
                                                <li>
                                                    Power of Attorney signed by the representative
                                                </li>
                                                <li>
                                                    Copy of ID cards
                                                </li>
                                                <li>
                                                    Once handed over to the PIC, internal distribution is the community's responsibility. The Organizer is not liable for loss/shortage after the goods leave the collection area.
                                                </li>
                                            </ol>
                                        </li>
                                    </ol>
                                </li>
                                <li>
                                    <strong>Route Etiquette: </strong>
                                    <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>
                                            Members are prohibited from forming barricades that block the entire road, preventing other runners from passing.
                                        </li>
                                        <li>
                                            Attributes (flags/banners) are allowed if they do not endanger others or obstruct views.
                                        </li>
                                        <li>
                                            Excessive commotion that disturbs the concentration or safety of others is prohibited.
                                        </li>
                                    </ol>
                                </li>
                                <li>
                                    <strong>Podium Rules: </strong>
                                    <ol type = "a" className = "pl-6 mt-1 space-y-1 terms-ol-alpha">
                                        <li>
                                            Only the individual winner may ascend the podium.
                                        </li>
                                        <li>
                                            PIC is responsible for the validity and submission of their member's data declared as winners during the event.
                                        </li>
                                        <li>
                                            Excessive celebrations on stage are strictly prohibited, including:
                                            <ol type="i" className="pl-6 mt-1 space-y-1">
                                                <li>
                                                    Bringing other members onto the stage
                                                </li>
                                                <li>
                                                    Representation by others (unless in a medical emergency)
                                                </li>
                                                <li>
                                                    blocking sponsors/documentation with community banners .
                                                </li>
                                            </ol>
                                        </li>
                                        <li>
                                            Community photo sessions must take place off-stage or at designated photobooths after the official ceremony.
                                        </li>
                                    </ol>
                                </li>
                                <li>
                                    <strong>Rendezvous Point (Basecamp): </strong>Communities may gather in the Bazaar area but are prohibited from setting up private tents, permanent banners, or blocking public access without written permission.
                                </li>
                            </ol>
                            <h2 className="mt-4 font-bold">SECTION 10: CLOSING</h2>
                            <ol type="1" className="pl-6 text-sm space-y-2 terms-ol-decimal">
                                <li>
                                    The Organizer reserves the right to amend or add to these rules and regulations at any time without prior notice.
                                </li>
                                <li>
                                    Matters not listed in these Terms and Conditions (T&C) are fully under the authority of the event Organizer.
                                </li>
                            </ol>
                        </div>

                        <div className="border-t border-gray-200 px-6 py-4 space-y-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="mt-1 w-5 h-5 accent-[#e687a4] cursor-pointer"
                                />
                                <span className="text-sm text-gray-700">
                                    I have read and agree to the Terms & Conditions and confirm that all information provided is accurate.
                                </span>
                            </label>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setAgreedToTerms(false);
                                    }}
                                    className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeCheckout}
                                    disabled={!agreedToTerms}
                                    className={`flex-1 px-6 py-3 rounded-full font-semibold transition-all transform ${
                                        agreedToTerms
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    Confirm & Continue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tutorial Modal - New Addition */}
            {showTutorial && (
                <TutorialModal
                    isOpen={showTutorial}
                    steps={tutorialSteps}
                    onClose={() => setShowTutorial(false)}
                />
            )}

            {/* Size Chart Modal - Updated to show both charts side by side */}
            {showSizeChart && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-white">
                                    Jersey Size Charts
                                </h3>
                                <button
                                    onClick={() => setShowSizeChart(false)}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Responsive grid: 2 columns on desktop, 1 column on mobile */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Adult Size Chart */}
                                <div className="flex flex-col">
                                    <h4 className="text-lg font-bold text-emerald-700 mb-3 text-center">Adult Sizes</h4>
                                    {/* <img
                                        src="/assets/sizes/dewasa.jpg"
                                        alt="Adult size chart"
                                        className="w-full h-auto rounded-lg shadow-md object-contain"
                                    /> */}
                                    {/* EXTRA: detailed measurements table (Length x Width) */}
                                    <div className="mt-4 overflow-x-auto">
                                      <table className="w-full text-sm bg-white shadow-sm rounded-md border border-gray-200">
                                        <thead>
                                          <tr className="bg-gray-50">
                                            <th className="px-3 py-2 text-left text-gray-700 font-medium">Size</th>
                                            <th className="px-3 py-2 text-left text-gray-700 font-medium">Length (cm)</th>
                                            <th className="px-3 py-2 text-left text-gray-700 font-medium">Width (cm)</th>
                                          </tr>
                                        </thead>
                                        <tbody className="text-gray-700">
                                          {/* Standard adult sizes */}
                                          <tr className="border-t">
                                            <td className="px-3 py-2">S</td>
                                            <td className="px-3 py-2">63</td>
                                            <td className="px-3 py-2">45</td>
                                          </tr>
                                          <tr className="border-t">
                                            <td className="px-3 py-2">M</td>
                                            <td className="px-3 py-2">67</td>
                                            <td className="px-3 py-2">48</td>
                                          </tr>
                                          <tr className="border-t">
                                            <td className="px-3 py-2">L</td>
                                            <td className="px-3 py-2">71</td>
                                            <td className="px-3 py-2">52</td>
                                          </tr>
                                          <tr className="border-t">
                                            <td className="px-3 py-2">XL</td>
                                            <td className="px-3 py-2">75</td>
                                            <td className="px-3 py-2">56</td>
                                          </tr>
                                          <tr className="border-t">
                                            <td className="px-3 py-2">XXL</td>
                                            <td className="px-3 py-2">77</td>
                                            <td className="px-3 py-2">58</td>
                                          </tr>
                                          {/* Larger sizes kept after standard sizes */}
                                          <tr className="border-t">
                                            <td className="px-3 py-2">XXXL</td>
                                            <td className="px-3 py-2">80</td>
                                            <td className="px-3 py-2">61</td>
                                          </tr>
                                          <tr className="border-t">
                                            <td className="px-3 py-2">4L</td>
                                            <td className="px-3 py-2">82</td>
                                            <td className="px-3 py-2">63</td>
                                          </tr>
                                          <tr className="border-t">
                                            <td className="px-3 py-2">5L</td>
                                            <td className="px-3 py-2">84</td>
                                            <td className="px-3 py-2">65</td>
                                          </tr>
                                          <tr className="border-t">
                                            <td className="px-3 py-2">6L</td>
                                            <td className="px-3 py-2">86</td>
                                            <td className="px-3 py-2">67</td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                </div>

                                {/* Kids Size Chart */}
                                <div className="flex flex-col">
                                    <h4 className="text-lg font-bold text-purple-700 mb-3 text-center">Kids Sizes</h4>
                                    <img
                                        src="/assets/sizes/anak.jpg"
                                        alt="Kids size chart"
                                        className="w-full h-auto rounded-lg shadow-md object-contain"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setShowSizeChart(false)}
                                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-full transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
