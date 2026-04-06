"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useContext } from "react";
import TutorialModal from "../../components/TutorialModal";
import { showToast } from "../../../lib/toast";
// import { uploadFileInChunks } from "@/lib/fileUpload";
import { CartContext } from "@/context/CartContext"; // Add this import

export default function ConfirmPaymentClient() {
    const [showPopup, setShowPopup] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [proofSenderName, setProofSenderName] = useState<string>("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const search = useSearchParams();
    const router = useRouter();
    const { clearCart } = useContext(CartContext); // Add this line

    // Load registration data from session storage
    const [registrationData, setRegistrationData] = useState<any>(null);

    useEffect(() => {
        const storedData = sessionStorage.getItem("currentRegistration");
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                
                // CRITICAL: Ensure ID card URL is properly set from all possible sources
                const idCardUrl = 
                    parsed.existingIdCardPhotoUrl ||
                    parsed.idCardUrl ||
                    parsed.userDetails?.existingIdCardPhotoUrl ||
                    parsed.userDetails?.idCardUrl ||
                    sessionStorage.getItem("reg_existingIdCardPhotoUrl") ||
                    null;
                
                // Update the parsed data with the resolved ID card URL
                if (idCardUrl) {
                    parsed.existingIdCardPhotoUrl = idCardUrl;
                    parsed.idCardUrl = idCardUrl;
                    if (parsed.userDetails) {
                        parsed.userDetails.existingIdCardPhotoUrl = idCardUrl;
                        parsed.userDetails.idCardUrl = idCardUrl;
                    }
                }
                
                setRegistrationData(parsed);
                console.log("[ConfirmPaymentClient] Loaded registration data:", parsed);
                console.log("[ConfirmPaymentClient] Resolved ID card URL:", idCardUrl);
            } catch (e) {
                console.error("Failed to parse registration data:", e);
            }
        }
    }, []);

    // Calculate total price from registration data
    const totalPrice = registrationData
        ? registrationData.type === "cart"
            ? registrationData.items.reduce((total: number, item: any) => {
                const itemPrice = (item.type === "community" || item.type === "family")
                    ? Number(item.price || 0) * Number(item.participants || 0)
                    : Number(item.price || 0);
                return total + itemPrice + Number(item.jerseyCharges || 0);
              }, 0)
            : (registrationData.type === "individual"
                ? registrationData.price + (registrationData.jerseyCharges || 0)
                : registrationData.type === "family"
                ? (registrationData.price * registrationData.participants) + (registrationData.jerseyCharges || 0)
                : (registrationData.price * registrationData.participants) + (registrationData.jerseyCharges || 0))
        : 0;

    // Convert registration data to items array for compatibility with API
    const items = registrationData
        ? registrationData.type === "cart"
            ? registrationData.items
            : [registrationData]
        : [];

    const [fullName, setFullName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [birthDate, setBirthDate] = useState<string>("");
    const [gender, setGender] = useState<string>("");
    const [currentAddress, setCurrentAddress] = useState<string>("");
    const [nationality, setNationality] = useState<string>("");
    const [emergencyPhone, setEmergencyPhone] = useState<string>("");
    const [medicalHistory, setMedicalHistory] = useState<string>("");
    const [medicationAllergy, setMedicationAllergy] = useState<string>("");
    const [groupName, setGroupName] = useState<string>("");
    const [showUploadTutorial, setShowUploadTutorial] = useState(false);

    const [proofFile, setProofFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>("");

    const uploadTutorialSteps = [
      {
        title: "Upload Payment Confirmation",
        description: "Upload an image of the proof of payment (PNG, JPG, JPEG). Make sure the amount and sender name are visible.",
        image: "/images/tutorial/tut5.jpg",
        tip: "Make sure to send the payment to the correct address and include the sender name as shown on the transfer."
      }
    ];

    useEffect(() => {
        // Load registration data from session storage
        const savedData = sessionStorage.getItem("currentRegistration");
        if (!savedData) {
            router.push("/registration");
            return;
        }
        
        try {
            const data = JSON.parse(savedData);
            setRegistrationData(data);
            
            // Load user details from registration data
            if (data.userDetails) {
                setFullName(data.userDetails.fullName || "");
                setEmail(data.userDetails.email || "");
                setPhone(data.userDetails.phone || "");
                setBirthDate(data.userDetails.birthDate || "");
                setGender(data.userDetails.gender || "male");
                setCurrentAddress(data.userDetails.currentAddress || "");
                setNationality(data.userDetails.nationality || "WNI");
                setEmergencyPhone(data.userDetails.emergencyPhone || "");
                setMedicalHistory(data.userDetails.medicalHistory || "");
                setMedicationAllergy(data.userDetails.medicationAllergy || "");
                setGroupName(data.userDetails.groupName || data.groupName || "");
            }
        } catch (error) {
            console.error("Failed to load registration data:", error);
            router.push("/registration");
        }
    }, [router]);

    // Convert File to base64
    async function fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Upload file in chunks
    async function uploadFileInChunks(file: File, subDir: string = "proofs"): Promise<string> {
        const CHUNK_SIZE = 200 * 1024; // 200KB chunks
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const prefix = subDir === "id-cards" ? "id" : "proof";
        const newFileName = `${uploadId}_${prefix}.${fileExt}`;
        
        console.log(`[uploadFileInChunks] Uploading ${file.name} to ${subDir} in ${totalChunks} chunks`);
        
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
            
            setUploadStatus(`Uploading ${subDir}... ${Math.round((chunkIndex + 1) / totalChunks * 100)}%`);
            
            const res = await fetch('/api/payments/upload-chunk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chunk: chunkBase64,
                    fileName: newFileName,
                    chunkIndex,
                    totalChunks,
                    uploadId,
                    subDir, // Pass the subdirectory
                }),
            });
            
            if (!res.ok) {
                throw new Error(`Chunk ${chunkIndex + 1} upload failed`);
            }
            
            const result = await res.json();
            
            if (chunkIndex === totalChunks - 1 && result.fileUrl) {
                return result.fileUrl;
            }
        }
        
        throw new Error('Upload failed - no file URL returned');
    }

    // Handle file selection - no compression, just accept the file
    async function handleProofSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Max 20MB
        if (file.size > 20_000_000) {
            setProofFile(null);
            setFileName(null);
            showToast("File too large. Maximum size is 20MB.", "error");
            return;
        }

        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setProofFile(null);
            setFileName(null);
            showToast("Invalid file type. Please upload PNG, JPG, JPEG, or PDF.", "error");
            return;
        }

        setProofFile(file);
        setFileName(`${file.name} (${(file.size / 1024).toFixed(0)}KB)`);
    }

    async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!proofFile) {
            showToast("Please upload a payment proof image.", "error");
            return;
        }

        setShowConfirmModal(true);
    }

    // Try FormData first, if 413 error, fallback to base64 JSON endpoint
    async function handleConfirmedSubmit() {
        if (!proofFile) {
            showToast("Please upload a payment proof image.", "error");
            return;
        }

        if (!navigator.onLine) {
            showToast("No internet connection. Please check your connection and try again.", "error");
            return;
        }

        setIsSubmitting(true);
        setShowConfirmModal(false);
        setUploadStatus("Preparing upload...");

        try {
            // declare here so both branches can safely reference
            let proofUrl: string | undefined = undefined;
            let idCardUrl: string | undefined = undefined;

            // idCardPhoto may be a File (if preserved) — otherwise check for an existing uploaded URL
            const idCardPhoto = registrationData?.userDetails?.idCardPhoto;
            
            // CRITICAL: Get ID card URL from ALL possible sources
            const existingIdCardUrl = 
                registrationData?.existingIdCardPhotoUrl ||
                registrationData?.idCardUrl ||
                registrationData?.userDetails?.existingIdCardPhotoUrl || 
                registrationData?.userDetails?.idCardUrl || 
                sessionStorage.getItem("reg_existingIdCardPhotoUrl") || 
                undefined;
            
            console.log("[handleConfirmedSubmit] existingIdCardUrl:", existingIdCardUrl);
            console.log("[handleConfirmedSubmit] idCardPhoto:", idCardPhoto);
            console.log("[handleConfirmedSubmit] registrationData:", registrationData);
            
            // Ensure we propagate existing URL if no File is present
            let resolvedIdCardUrl: string | undefined = existingIdCardUrl;

            // CRITICAL: Validate that we have an ID card URL for cart registrations
            if (registrationData?.type === "cart" && !resolvedIdCardUrl && !(idCardPhoto instanceof File)) {
                showToast("ID card photo is missing. Please go back to the registration form and upload your ID card.", "error");
                setIsSubmitting(false);
                return;
            }

            // Get groupName from registration data
            const resolvedGroupName =
                (registrationData.groupName && String(registrationData.groupName).trim()) ||
                (registrationData.userDetails?.groupName && String(registrationData.userDetails.groupName).trim()) ||
                (groupName && String(groupName).trim()) ||
                undefined;

            // Ensure registration carries the resolved groupName
            const itemsToSend = registrationData.type === "cart" 
                ? registrationData.items.map((item: any) => ({
                    ...item,
                    groupName: item.groupName || resolvedGroupName || undefined,
                  }))
                : [{
                    type: registrationData.type,
                    categoryId: registrationData.categoryId,
                    categoryName: registrationData.categoryName,
                    price: registrationData.price,
                    participants: registrationData.participants || 1,
                    jerseys: registrationData.jerseys || {},
                    jerseySize: registrationData.jerseySize || null,
                    jerseyCharges: registrationData.jerseyCharges || 0,
                    groupName: resolvedGroupName || undefined,
                  }];

            console.log("[handleConfirmedSubmit] Items to send:", itemsToSend);

            // ALWAYS use base64 endpoint for reliability
            setUploadStatus("Uploading payment proof...");
            proofUrl = await uploadFileInChunks(proofFile, "proofs");
            console.log("[handleConfirmedSubmit] Proof uploaded:", proofUrl);

            // Upload ID card if it's a File
            if (idCardPhoto instanceof File) {
                setUploadStatus("Uploading ID card...");
                idCardUrl = await uploadFileInChunks(idCardPhoto, "id-cards");
                console.log("[handleConfirmedSubmit] ID card uploaded:", idCardUrl);
            } else if (resolvedIdCardUrl) {
                // reuse previously uploaded id card URL stored in session
                idCardUrl = resolvedIdCardUrl;
                console.log("[handleConfirmedSubmit] Reusing existing ID card URL:", idCardUrl);
            }

            // Final validation - ensure we have an ID card URL
            if (!idCardUrl) {
                showToast("ID card photo is required. Please go back and upload your ID card.", "error");
                setIsSubmitting(false);
                return;
            }

            setUploadStatus("Saving registration...");

            // Get personal details from registration data
            const fullName = registrationData.userDetails?.fullName || sessionStorage.getItem("reg_fullName") || "";
            const email = registrationData.userDetails?.email || sessionStorage.getItem("reg_email") || "";
            const phone = registrationData.userDetails?.phone || sessionStorage.getItem("reg_phone") || "";
            const birthDate = registrationData.userDetails?.birthDate || sessionStorage.getItem("reg_birthDate") || "";
            const gender = registrationData.userDetails?.gender || sessionStorage.getItem("reg_gender") || "male";
            const currentAddress = registrationData.userDetails?.currentAddress || sessionStorage.getItem("reg_currentAddress") || "";
            const nationality = registrationData.userDetails?.nationality || sessionStorage.getItem("reg_nationality") || "WNI";
            const emergencyPhone = registrationData.userDetails?.emergencyPhone || sessionStorage.getItem("reg_emergencyPhone") || "";
            const medicalHistory = registrationData.userDetails?.medicalHistory || sessionStorage.getItem("reg_medicalHistory") || "";
            const medicationAllergy = registrationData.userDetails?.medicationAllergy || sessionStorage.getItem("reg_medicationAllergy") || "";

            const payload: any = {
                 proofUrl,
                 idCardUrl: idCardUrl, // This should now always have a value
                 items: itemsToSend,
                 amount: totalPrice,
                 fullName,
                 email,
                 phone,
                 birthDate,
                 gender,
                 currentAddress,
                 nationality,
                 emergencyPhone,
                 medicalHistory,
                 medicationAllergy: medicationAllergy || "",
                 registrationType: registrationData.type || "individual",
                 proofSenderName: proofSenderName,
                 groupName: resolvedGroupName || undefined,
                 forceCreate: false,
            };

            console.log("[handleConfirmedSubmit] Sending payload to /api/payments/base64:", payload);
            console.log("[handleConfirmedSubmit] ID Card URL in payload:", payload.idCardUrl);

            let res: Response = await fetch("/api/payments/base64", { 
                method: "POST", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include"
            });

            let body: any = await res.json().catch(() => ({}));
            console.log("[handleConfirmedSubmit] Response from server:", body);

            if (res.status === 409 && body?.error === "EMAIL_NAME_MISMATCH") {
                const proceed = window.confirm(`The email you provided (${email}) is already associated with the account name "${body.existingName}". It's recommended to login first. Press OK to continue registering with this email anyway, or Cancel to login.`);
                if (!proceed) {
                    router.push("/auth/login");
                    return;
                }

                // Retry with forceCreate
                payload.forceCreate = true;
                res = await fetch("/api/payments/base64", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    credentials: "include"
                });
                body = await res.json().catch(() => ({}));
            }

            if (!res.ok) {
                if (body?.code === "JERSEY_QUOTA_EXCEEDED" && Array.isArray(body?.details)) {
                    const details = body.details
                        .map((d: any) => `${d.size}: requested ${d.requested}, remaining ${d.remaining}`)
                        .join("; ");
                    throw new Error(
                        details
                            ? `Some jersey sizes are no longer available (${details}). Please go back to registration and adjust your sizes.`
                            : "Some jersey sizes are no longer available. Please go back to registration and adjust your sizes."
                    );
                }
                throw new Error(body?.error || `Submission failed (${res.status})`);
            }

            setUploadStatus("Registration complete!");
            setSubmitted(true);
            setShowPopup(true);

            // Clear cart using context function
            clearCart();

            // Clear ALL registration-related session storage
            sessionStorage.removeItem("currentRegistration");
            sessionStorage.removeItem("reg_formData");
            
            // Clear personal details
            sessionStorage.removeItem("reg_fullName");
            sessionStorage.removeItem("reg_email");
            sessionStorage.removeItem("reg_phone");
            sessionStorage.removeItem("reg_emergencyPhone");
            sessionStorage.removeItem("reg_birthDate");
            sessionStorage.removeItem("reg_gender");
            sessionStorage.removeItem("reg_currentAddress");
            sessionStorage.removeItem("reg_nationality");
            sessionStorage.removeItem("reg_medicalHistory");
            sessionStorage.removeItem("reg_medicationAllergy");
            sessionStorage.removeItem("reg_groupName");
            
            // Clear ID card related data
            sessionStorage.removeItem("reg_idCardPhotoName");
            sessionStorage.removeItem("reg_existingIdCardPhotoUrl");
            
            // Clear registration UI state
            sessionStorage.removeItem("reg_type");
            sessionStorage.removeItem("reg_registrationType");
            sessionStorage.removeItem("reg_categoryId");
            sessionStorage.removeItem("reg_participants");
            sessionStorage.removeItem("reg_selectedJerseySize");
            sessionStorage.removeItem("reg_jerseys");

            // setTimeout(() => {
            //     setShowPopup(false);
            //     router.push("/");
            // }, 3000);

        } catch (error: any) {
            console.error("[handleConfirmedSubmit] Error:", error);
            setUploadStatus("");
            showToast(error.message || "Failed to submit registration. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
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
            <div className="mx-auto w-full max-w-2xl px-4">
                <h1 className="text-4xl md:text-6xl text-center font-bold mb-8 tracking-wide confirm-payment-title drop-shadow-lg">
                    UNIVERSITAS CIPUTRA COLOR RUN
                </h1>

                <section className="bg-white/95 backdrop-blur-md rounded-lg p-8 md:p-10 shadow-lg text-gray-800">
                    <h2 className="text-2xl font-bold text-center mb-1">
                        PAYMENT CONFIRMATION
                    </h2>
                    <p className="text-center text-sm text-gray-600 mb-6">
                        Upload your payment proof to complete registration.
                    </p>

                    {/* Order Summary */}
                    <div className="mb-6">
                        <h3 className="font-semibold mb-3">Order Summary:</h3>
                        <div className="space-y-2">
                            {items.map((item: any, idx: number) => {
    const itemKey = item.id ?? `item-${idx}`;

    // If community/family, build JSX list of pairs with keys
    let secondaryLabel: React.ReactNode = "";
    if (item.type === "community" || item.type === "family") {
        const jerseysObj: Record<string, number> = item.jerseys || {};
        const pairs = Object.entries(jerseysObj).filter(([, cnt]) => Number(cnt) > 0);
        if (pairs.length > 0) {
            secondaryLabel = (
                <>
                    {pairs.map(([size, cnt], i) => (
                        <span key={size}>
                            {`${size}(${cnt})`}
                            {(size === "XXL" || size === "3L" || size === "4L" || size === "5L") && (
                                <span className="text-orange-500 text-[10px]">+10k</span>
                            )}
                            {size === "6L" && (
                                <span className="text-red-500 text-[10px]">+20k</span>
                            )}
                            {i < pairs.length - 1 ? ", " : ""}
                        </span>
                    ))}
                </>
            );
        } else {
            secondaryLabel = `${item.participants || 0} participants`;
        }
    } else {
        const size = item.jerseySize || "—";
        secondaryLabel = (
            <>
                Size {size}
                {(size === "XXL" || size === "3L" || size === "4L" || size === "5L") && (
                    <span className="text-orange-500 text-xs ml-1">(+10k)</span>
                )}
                {size === "6L" && (
                    <span className="text-red-500 text-xs ml-1">(+20k)</span>
                )}
            </>
        );
    }

    const basePrice = (item.type === "community" || item.type === "family")
        ? Number(item.price) * Number(item.participants || 0)
        : Number(item.price);
    
    const jerseyCharges = Number(item.jerseyCharges || 0);
    const itemTotal = basePrice + jerseyCharges;

    return (
        <div key={itemKey} className="border-b border-gray-300 pb-2">
            <div className="flex justify-between">
                <div>
                    <p className="font-semibold text-gray-900">{item.categoryName}</p>
                    <p className="text-gray-600 text-xs">{secondaryLabel}</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-gray-900">
                        Rp {basePrice.toLocaleString("id-ID")}
                    </p>
                    {jerseyCharges > 0 && (
                        <p className="text-orange-600 text-xs">
                            +Rp {jerseyCharges.toLocaleString("id-ID")}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
})}
                        </div>

                        <div className="flex justify-between font-bold text-lg pt-2">
                            <span>Total:</span>
                            <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
                        </div>
                    </div>

                    {/* Personal Info Display */}
                    <div className="mb-6 p-4 bg-gray-50 rounded">
                        <h3 className="font-semibold mb-2">Participant Information:</h3>
                        <div className="text-sm space-y-1">
                            <p><span className="font-medium">Name:</span> {fullName}</p>
                            <p><span className="font-medium">Email:</span> {email}</p>
                            <p><span className="font-medium">Phone:</span> {phone}</p>
                            <p><span className="font-medium">Birth Date:</span> {birthDate}</p>
                            <p><span className="font-medium">Nationality:</span> {nationality}</p>
                            {emergencyPhone && <p><span className="font-medium">Emergency Contact:</span> {emergencyPhone}</p>}
                        </div>
                    </div>

                    {/* Upload Form */}
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        {/* Transfer Address Section */}
                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg mb-4">
                            <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Transfer Destination
                            </h3>
                            <div className="space-y-1">
                                <p className="text-sm text-gray-700">
                                    <span className="font-semibold">Bank Name:</span> BCA
                                </p>
                                <p className="text-sm text-gray-700">
                                    <span className="font-semibold">Account Number:</span> 8620762491
                                </p>
                                <p className="text-sm text-gray-700">
                                    <span className="font-semibold">Account Name:</span> LOUIE NATHANIEL CHRISTOPHER
                                </p>
                                <p className="text-xs text-emerald-700 mt-2 font-medium">
                                    ⚠️ Please transfer the exact amount and upload clear proof of payment below
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Sender&apos;s Name (as shown on transfer) <strong className="text-red-500">*</strong></label>
                            <input
                                type="text"
                                value={proofSenderName}
                                onChange={(e) => setProofSenderName(e.target.value)}
                                className="w-full px-4 py-3 border rounded-md"
                                placeholder="e.g. PT. Example / John Doe"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Upload Payment Proof <strong className="text-red-500">*</strong>
                            </label>

                            <label
                                htmlFor="proofUpload"
                                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 transition-colors flex items-center justify-center gap-3"
                            >
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span className="text-sm text-gray-600">
                                    {uploadStatus || fileName || "Click to upload payment proof (PNG, JPG, JPEG, PDF)"}
                                </span>
                            </label>
                            <input
                                id="proofUpload"
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,application/pdf"
                                className="hidden"
                                onChange={handleProofSelect}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Max 20MB. Large files will be uploaded via alternative method.</p>

                           {showUploadTutorial && (
                             <TutorialModal
                               isOpen={showUploadTutorial}
                               steps={uploadTutorialSteps}
                               onClose={() => setShowUploadTutorial(false)}
                             />
                           )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`flex-1 px-6 py-3 rounded-full font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                                    isSubmitting
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md'
                                }`}
                                style={{ letterSpacing: '0.2px' }}
                            >
                                {isSubmitting ? (uploadStatus || "Uploading...") : "Submit Payment"}
                            </button>
                        </div>
                    </form>
                </section>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                            <h3 className="text-2xl font-bold text-white">Confirm Payment Submission</h3>
                        </div>
                        
                        <div className="px-6 py-4 overflow-y-auto flex-1">
                            <div className="space-y-4">
                                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r">
                                    <p className="text-sm text-amber-900 font-medium">
                                        <strong className="font-bold">⚠️ Important:</strong> Please verify all information is correct before submitting. You cannot edit this after submission.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-bold text-gray-900 text-base">Payment Details:</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                                        <p className="text-gray-900"><span className="font-semibold text-gray-700">Total Amount:</span> <span className="text-emerald-600 font-bold text-base">Rp {totalPrice.toLocaleString("id-ID")}</span></p>
                                        {proofSenderName && (
                                            <p className="text-gray-900"><span className="font-semibold text-gray-700">Sender Name:</span> <span className="font-medium">{proofSenderName}</span></p>
                                        )}
                                        <p className="text-gray-900"><span className="font-semibold text-gray-700">Payment Proof:</span> <span className="font-medium">{fileName}</span></p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-bold text-gray-900 text-base">Your Information:</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                                        <p className="text-gray-900"><span className="font-semibold text-gray-700">Name:</span> <span className="font-medium">{fullName}</span></p>
                                        <p className="text-gray-900"><span className="font-semibold text-gray-700">Email:</span> <span className="font-medium">{email}</span></p>
                                        <p className="text-gray-900"><span className="font-semibold text-gray-700">Phone:</span> <span className="font-medium">{phone}</span></p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-bold text-gray-900 text-base">Order Summary:</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                                        {items.map((item: any, idx: number) => {
    const itemKey = item.id ?? `item-${idx}`;

    // If community/family, build JSX list of pairs with keys
    let secondaryLabel: React.ReactNode = "";
    if (item.type === "community" || item.type === "family") {
        const jerseysObj: Record<string, number> = item.jerseys || {};
        const pairs = Object.entries(jerseysObj).filter(([, cnt]) => Number(cnt) > 0);
        if (pairs.length > 0) {
            secondaryLabel = (
                <>
                    {pairs.map(([size, cnt], i) => (
                        <span key={size}>
                            {`${size}(${cnt})`}
                            {(size === "XXL" || size === "3L" || size === "4L" || size === "5L") && (
                                <span className="text-orange-500 text-[10px]">+10k</span>
                            )}
                            {size === "6L" && (
                                <span className="text-red-500 text-[10px]">+20k</span>
                            )}
                            {i < pairs.length - 1 ? ", " : ""}
                        </span>
                    ))}
                </>
            );
        } else {
            secondaryLabel = `${item.participants || 0} participants`;
        }
    } else {
        const size = item.jerseySize || "—";
        secondaryLabel = (
            <>
                Size {size}
                {(size === "XXL" || size === "3L" || size === "4L" || size === "5L") && (
                    <span className="text-orange-500 text-xs ml-1">(+10k)</span>
                )}
                {size === "6L" && (
                    <span className="text-red-500 text-xs ml-1">(+20k)</span>
                )}
            </>
        );
    }

    const basePrice = (item.type === "community" || item.type === "family")
        ? Number(item.price) * Number(item.participants || 0)
        : Number(item.price);
    
    const jerseyCharges = Number(item.jerseyCharges || 0);
    const itemTotal = basePrice + jerseyCharges;

    return (
        <div key={itemKey} className="flex justify-between border-b border-gray-300 pb-2">
            <div>
                <p className="font-semibold text-gray-900">{item.categoryName}</p>
                <p className="text-gray-600 text-xs">{secondaryLabel}</p>
            </div>
            <p className="font-semibold text-gray-900">
                Rp {((item.type === "community" || item.type === "family")
                    ? Number(item.price) * Number(item.participants || 0)
                    : Number(item.price)
                ).toLocaleString("id-ID")}
            </p>
        </div>
    );
})}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Review Again
                                </button>
                                <button
                                    onClick={handleConfirmedSubmit}
                                    disabled={isSubmitting}
                                    className={`flex-1 px-6 py-3 rounded-full font-semibold transition-all ${
                                        isSubmitting
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md'
                                    }`}
                                >
                                    {isSubmitting ? "Submitting..." : "Confirm & Submit"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showPopup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-xl animate-fadeIn">
                        <h3 className="text-xl text-[#602d4e] font-bold mb-2">Payment Successful!</h3>
                        <p className="text-[#602d4e]/80 mb-4">
                            Thank you!
                        </p>
                        <p className="text-[#602d4e]/80 mb-4">
                            A confirmation and Access Code has been sent to <strong>{email}</strong>. Since our WhatsApp Group slots are now full, all further details regarding Racepack Collection and Race Day will be shared via registered email (check inbox and spam folder) and our official Instagram @ciputrarun.uc.
                        </p>
                        <p className="text-[#602d4e]/80 mb-4">
                            Make sure to follow us so you don't miss any important announcements!
                        </p>
    
                        <button
                            onClick={() => {
                                setShowPopup(false);
                                router.push("/");
                            }}
                            className="block w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-full font-semibold hover:from-emerald-700 hover:to-teal-700 transition"
                        >
                            I Understand!
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}