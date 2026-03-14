"use client";

import { useRouter } from "next/navigation";
import { Download, FileText } from "lucide-react";

export default function AuthorizationLetterPage() {
    const router = useRouter();
    
    // Google Docs document ID extracted from the edit URL
    const documentId = "1KrqzgyS-GOOq7mhv5fuxSVtQf8fQrVLc";
    
    // Convert Google Docs edit URL to PDF export URL
    const pdfDownloadUrl = `https://docs.google.com/document/d/${documentId}/export?format=pdf`;
    
    const handleDownload = () => {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = pdfDownloadUrl;
        link.download = 'Surat_Kuasa_Pengambilan_Race_Pack.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
            <div className="mx-auto w-full max-w-4xl px-4">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                        <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
                            Surat Kuasa Pengambilan Race Pack
                        </h1>
                        <p className="text-white/90 text-center text-sm mt-2">
                            Universitas Ciputra Color Run 2026
                        </p>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-8 space-y-6">
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                    <FileText className="w-10 h-10 text-emerald-600" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Download Authorization Letter Template
                                </h2>
                                <p className="text-gray-600 text-sm max-w-2xl mx-auto">
                                    Download the Power of Attorney (Surat Kuasa) template document. 
                                    This document is required if you need someone else to collect your race pack on your behalf.
                                </p>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleDownload}
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <Download className="w-5 h-5" />
                                    <span>Download PDF</span>
                                </button>
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                    <strong>Note:</strong> Please fill out the downloaded document with your details, 
                                    sign it, and provide it along with a copy of your ID card when collecting your race pack via a representative.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                        <button
                            onClick={() => router.back()}
                            className="w-full px-6 py-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-full transition-all shadow-md hover:shadow-lg"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

