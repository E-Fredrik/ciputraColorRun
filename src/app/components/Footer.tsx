"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import "../styles/homepage.css";

export default function Footer() {
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).AOS) {
      try {
        // if AOS already initialized in layout, refresh; otherwise init with defaults
        if (typeof (window as any).AOS.init === "function") {
          (window as any).AOS.init({
            duration: 800,
            once: false,
            mirror: true,
            offset: 100,
          });
        } else if (typeof (window as any).AOS.refresh === "function") {
          (window as any).AOS.refresh();
        }
      } catch (e) {
        // silent
      }
    }
  }, []);

  const sponsorLogosBesar = [
    "/images/sponsor/besar/wahyu-redjo-logo-besar.png",
    "/images/sponsor/besar/alganos-logo-besar.png",
    "/images/sponsor/besar/isoplus-logo-besar.jpeg",
    "/images/sponsor/besar/aquaviva-logo-besar.png",
    "/images/sponsor/besar/entretive-logo-besar.png",
  ];

  const sponsorLogosSedang = [
    "/images/sponsor/sedang/azzura-logo-sedang.png",
    "/images/sponsor/sedang/cihos-logo-sedang.png",
    "/images/sponsor/sedang/DRM-logo.png",
    "/images/sponsor/sedang/nuvo-logo-sedang.png",
    "/images/sponsor/sedang/pewangi-edp-logo-sedang.png",
    "/images/sponsor/sedang/poise-logo-sedang.png",
    "/images/sponsor/sedang/rsot-logo-sedang.png",
    "/images/sponsor/sedang/sofresh-logo-sedang.png",
    "/images/sponsor/sedang/soklin-logo-sedang.png",
    "/images/sponsor/sedang/wizz-logo-sedang.png",
    "/images/sponsor/sedang/wiyung-logo-sedang.png",
    "/images/sponsor/sedang/jete-sedang.png",
    "/images/sponsor/sedang/greensm-sedang.png"
  ];

  const sponsorLogosKecil = [
    "/images/sponsor/kecil/amh-logo-kecil.png",
    "/images/sponsor/kecil/deorex-logo-kecil.png",
    "/images/sponsor/kecil/fithub-logo.png",
    "/images/sponsor/kecil/ALFAGIFT-kecil.png",
    "/images/sponsor/kecil/oxygan-samator-kecil.png",
  ];

  return (
    <footer className="bg-transparent">
      {/* Premium Sponsors - BESAR - Wahyu Redjo JUMBO */}
      <div className="bg-white py-10 px-6 md:px-16 lg:px-24 text-center" data-aos="fade-up">
        <h3 className="text-gradient-supported font-extrabold text-lg mb-6">Supported By</h3>
        <div className="flex justify-center mb-8">
          <div className="relative w-80 h-32 sm:w-120 sm:h-60">
            <Image
              src={sponsorLogosBesar[0]}
              alt={`Premium Sponsor Wahyu Redjo`}
              fill
              className="object-contain opacity-80 hover:opacity-100 transition"
            />
          </div>
        </div>

        <div className="flex justify-center flex-wrap gap-8">
          {sponsorLogosBesar.slice(1).map((logo, index) => (
            <div key={`besar-${index + 1}`} className="relative w-48 h-40 sm:w-50 sm:h-48">
              <Image
                src={logo}
                alt={`Premium Sponsor ${index + 2}`}
                fill
                className="object-contain opacity-80 hover:opacity-100 transition"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Main Sponsors - SEDANG */}
      <div className="bg-white py-10 px-6 md:px-16 lg:px-24 text-center" data-aos="fade-up" data-aos-delay="100">
        {/* <h3 className="text-gradient-supported font-extrabold text-lg mb-6">Main Sponsors</h3> */}
        <div className="flex justify-center">
          <div className="w-full max-w-7xl flex justify-center items-center gap-6 flex-wrap">
            {sponsorLogosSedang.map((logo, index) => (
              <div 
                key={`sedang-${index}`} 
                className={
                  logo.includes("wiyung") 
                    ? "relative w-48 h-24 sm:w-64 sm:h-28"
                    : logo.includes("greensm")
                    ? "relative w-44 h-44 sm:w-52 sm:h-52"
                    : "relative w-32 h-32 sm:w-36 sm:h-32"
                }
              >
                <Image
                  src={logo}
                  alt={`Main Sponsor ${index + 1}`}
                  fill
                  className="object-contain opacity-80 hover:opacity-100 transition"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Supported By - KECIL */}
      <div className="bg-white py-10 px-6 md:px-16 lg:px-24 text-center" data-aos="fade-up" data-aos-delay="200">
        {/* <h3 className="text-gradient-supported font-extrabold text-lg mb-6">Supported By</h3> */}
        <div className="flex justify-center items-center gap-4 flex-wrap">
          {sponsorLogosKecil.map((logo, index) => (
            <div key={`kecil-${index}`} className="relative w-12 h-16 sm:w-20 sm:h-20">
              <Image
                src={logo}
                alt={`Supporter ${index + 1}`}
                fill
                className="object-contain opacity-80 hover:opacity-100 transition"
              />
            </div>
          ))}
        </div>
      </div>
      {/* Contact Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 py-8 sm:py-12 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2" data-aos="fade-right">
            <h3 className="text-lg sm:text-2xl font-bold mb-2 tracking-wider">
              Need help or further information? Feel free to contact us!
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div>
                <p className="text-sm sm:text-lg font-semibold mb-0.5">Abel</p>
                <p className="text-xs sm:text-base opacity-90">
                  WhatsApp: 0895410319676
                </p>
              </div>

              <div>
                <p className="text-sm sm:text-lg font-semibold mb-0.5">
                  Elysian
                </p>
                <p className="text-xs sm:text-base opacity-90">
                  WhatsApp: 0811306658
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className="text-pink-400"
              >
                <path
                  d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17.5 6.5h.01"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div>
                <div className="text-sm sm:text-base font-semibold">
                  Find out more on our Instagram
                </div>
                <a
                  href="https://instagram.com/ciputrarun.uc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base text-white/90 underline hover:text-white"
                  aria-label="Instagram @ciputrarun.uc"
                >
                  @ciputrarun.uc
                </a>
              </div>
            </div>
          </div>

          <div
            className="flex items-center justify-center md:justify-end"
            data-aos="fade-left"
            aria-hidden
          >
            <div className="relative w-28 h-28 sm:w-40 sm:h-40 lg:w-48 lg:h-48 overflow-hidden bg-transparent p-0">
              <Image
                src="/images/logoWajib.png"
                alt="Universitas Ciputra Color Run Logo"
                fill
                className="object-contain opacity-100"
              />
            </div>
          </div>
        </div>
      </div>

      

      {/* Copyright */}
      <div className="bg-gray-900 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-gray-300 text-xs sm:text-sm">
          &copy; 2026 Universitas Ciputra Color Run. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
