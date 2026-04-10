"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RegistrationClosedPage() {
    useEffect(() => {
        if (typeof window !== "undefined" && (window as any).AOS) {
            (window as any).AOS.refresh();
        }
    }, []);

    return (
        <main
            className="min-h-screen flex items-center justify-center bg-cover bg-center relative overflow-hidden"
            style={{
                backgroundImage:
                    "linear-gradient(rgba(152,232,206,0.7) 0%, rgba(255,225,196,0.55) 50%, rgba(238,150,157,0.65) 100%), url('/images/generalBg.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Decorative floating assets */}
            <img
                src="/assets/asset10.svg"
                alt=""
                aria-hidden
                className="absolute top-[8%] left-[5%] w-16 sm:w-24 opacity-40 pointer-events-none"
                style={{ animation: "floatY 5s ease-in-out infinite" }}
            />
            <img
                src="/assets/asset4.svg"
                alt=""
                aria-hidden
                className="absolute bottom-[10%] right-[6%] w-20 sm:w-32 opacity-30 pointer-events-none"
                style={{ animation: "floatYSlow 7s ease-in-out infinite" }}
            />
            <img
                src="/assets/asset10.svg"
                alt=""
                aria-hidden
                className="absolute top-[60%] left-[80%] w-12 sm:w-16 opacity-25 pointer-events-none hidden sm:block"
                style={{
                    animation: "drift 6s ease-in-out infinite",
                    transform: "rotate(45deg)",
                }}
            />

            <div
                className="relative z-10 max-w-lg w-full mx-4 pt-20 pb-5"
                data-aos="zoom-in"
                data-aos-duration="800"
            >
                {/* Glassmorphism card */}
                <div
                    className="rounded-3xl p-8 sm:p-10 text-center shadow-2xl border border-white/20"
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.65) 100%)",
                        backdropFilter: "blur(16px) saturate(1.2)",
                        WebkitBackdropFilter: "blur(16px) saturate(1.2)",
                    }}
                >
                    {/* Lock icon with gradient circle */}
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 rounded-full mx-auto mb-6"
                        style={{
                            background:
                                "linear-gradient(135deg, #91DCAC 0%, #F581A4 100%)",
                            boxShadow: "0 8px 32px rgba(145,220,172,0.35)",
                        }}
                        data-aos="zoom-in"
                        data-aos-delay="200"
                    >
                        <svg
                            width="36"
                            height="36"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                fill="white"
                                stroke="white"
                                strokeWidth="1.5"
                            />
                            <path
                                d="M7 11V7a5 5 0 0 1 10 0v4"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                            <circle cx="12" cy="16" r="1.5" fill="#1F6251" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1
                        className="font-moderniz text-2xl sm:text-3xl font-extrabold mb-3"
                        style={{
                            background:
                                "linear-gradient(90deg, #1F6251 0%, #4D9D56 40%, #a52d5d 80%, #F581A4 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                        data-aos="fade-up"
                        data-aos-delay="300"
                    >
                        Registration Closed
                    </h1>

                    {/* Description */}
                    <p
                        className="font-mustica text-[#3d5c52] text-sm sm:text-base leading-relaxed mb-2"
                        data-aos="fade-up"
                        data-aos-delay="400"
                    >
                        Thank you for your incredible interest in{" "}
                        <strong className="text-[#1F6251]">
                            Universitas Ciputra Color Run 2026
                        </strong>
                        ! Registration has officially closed.
                    </p>

                    <p
                        className="font-mustica text-[#5a706a] text-xs sm:text-sm leading-relaxed mb-6 font-bold"
                        data-aos="fade-up"
                        data-aos-delay="500"
                    >
                        <strong className="text-[#1F6251]">(10K RACE CATEGORY ONLY)</strong> Offline registration is still available at Corepreneur 1st Floor, Universitas Ciputra Surabaya.
                    </p>

                    {/* Map embed */}
                    <div
                        className="w-full mb-6 rounded-2xl overflow-hidden shadow-lg"
                        style={{
                            border: "2px solid rgba(145,220,172,0.35)",
                        }}
                        data-aos="fade-up"
                        data-aos-delay="520"
                    >
                        <div className="relative">
                            {/* Location badge */}
                            <div
                                className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#1F6251] shadow-md"
                                style={{
                                    background: "rgba(255,255,255,0.92)",
                                    backdropFilter: "blur(8px)",
                                    WebkitBackdropFilter: "blur(8px)",
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1F6251" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                Universitas Ciputra
                            </div>
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.6060363277597!2d112.62902407551327!3d-7.28558547160606!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7fde455555555%3A0xd7e2611ae591f046!2sUniversitas%20Ciputra%20Surabaya!5e0!3m2!1sen!2sid!4v1775814271182!5m2!1sen!2sid"
                                className="w-full aspect-video"
                                style={{ border: 0, display: "block", minHeight: "220px" }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Universitas Ciputra Surabaya Location"
                            />
                        </div>
                    </div>

                    {/* Event date highlight */}
                    <div
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
                        style={{
                            background:
                                "linear-gradient(90deg, rgba(145,220,172,0.25) 0%, rgba(245,129,164,0.25) 100%)",
                            border: "1.5px solid rgba(31,98,81,0.15)",
                        }}
                        data-aos="fade-up"
                        data-aos-delay="550"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#1F6251"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                            />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span className="font-moderniz text-[#1F6251] text-sm font-bold">
                            Race Day: April 12, 2026
                        </span>
                    </div>

                    {/* Buttons */}
                    <div
                        className="flex flex-col sm:flex-row gap-3 justify-center"
                        data-aos="fade-up"
                        data-aos-delay="600"
                    >
                        <Link
                            href="/"
                            className="px-6 py-2.5 rounded-full font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 text-sm sm:text-base"
                            style={{
                                background:
                                    "linear-gradient(90deg, #1F6251 0%, #4D9D56 100%)",
                            }}
                        >
                            Back to Home
                        </Link>

                        <a
                            href="https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.instagram.com/ciputrarun.uc/&ved=2ahUKEwiYqOuQ_eKTAxWMxTgGHSQbNrQQFnoECCIQAQ&usg=AOvVaw2R7fNs6JxWS4-AeXKQ8Y9P"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-2.5 rounded-full font-semibold text-[#1F6251] border-2 border-[#1F6251]/30 hover:bg-[#1F6251]/5 transition-all duration-200 hover:-translate-y-0.5 text-sm sm:text-base"
                        >
                            Follow Updates
                        </a>
                    </div>

                    {/* Footer note */}
                    <p
                        className="mt-6 text-xs text-[#7a918b]"
                        data-aos="fade-up"
                        data-aos-delay="700"
                    >
                        Have questions? Contact us at{" "}
                        <a
                            href="https://www.instagram.com/ciputrarun.uc/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-[#4D9D56] hover:text-[#1F6251] transition-colors"
                        >
                            @ciputrarun.uc
                        </a>
                    </p>
                </div>
            </div>
        </main>
    );
}