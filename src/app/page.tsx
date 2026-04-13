"use client";

import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";

export default function Home() {
	const [loading, setLoading] = useState(true);

	// Confetti burst function
	const fireConfetti = useCallback(() => {
		const duration = 4000;
		const end = Date.now() + duration;

		// Color palette matching the Ciputra Color Run brand
		const colors = ["#91DCAC", "#F581A4", "#4EF9CD", "#FFD700", "#73E9DD", "#ff6b9d", "#c084fc"];

		// Initial big burst
		confetti({
			particleCount: 100,
			spread: 100,
			origin: { y: 0.4 },
			colors,
			startVelocity: 45,
			gravity: 0.8,
			ticks: 300,
		});

		// Continuous side cannons
		const interval = setInterval(() => {
			if (Date.now() > end) {
				clearInterval(interval);
				return;
			}

			// Left cannon
			confetti({
				particleCount: 3,
				angle: 60,
				spread: 55,
				origin: { x: 0, y: 0.65 },
				colors,
				startVelocity: 35,
				gravity: 1,
				ticks: 200,
			});

			// Right cannon
			confetti({
				particleCount: 3,
				angle: 120,
				spread: 55,
				origin: { x: 1, y: 0.65 },
				colors,
				startVelocity: 35,
				gravity: 1,
				ticks: 200,
			});
		}, 60);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		// Simulate initial load
		const timer = setTimeout(() => {
			setLoading(false);
		}, 800);
		return () => clearTimeout(timer);
	}, []);

	// Fire confetti after loading completes
	useEffect(() => {
		if (!loading) {
			// Small delay for the page to render before confetti
			const timer = setTimeout(() => {
				fireConfetti();
			}, 400);
			return () => clearTimeout(timer);
		}
	}, [loading, fireConfetti]);

	// Refresh AOS animations
	useEffect(() => {
		if (!loading && typeof window !== "undefined" && (window as any).AOS) {
			(window as any).AOS.refresh();
		}
	}, [loading]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
					<p className="text-gray-600 font-semibold text-lg">
						Loading Universitas Ciputra Color Run...
					</p>
				</div>
			</div>
		);
	}

	return (
		<main className="min-h-screen relative overflow-hidden">
			{/* Background */}
			<div
				className="absolute inset-0 z-0"
				style={{
					backgroundImage:
						"linear-gradient(rgba(152,232,206,0.7) 0%, rgba(255,225,196,0.55) 50%, rgba(238,150,157,0.65) 100%), url('/images/generalBg.jpg')",
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			/>

			{/* Animated floating decorative elements */}
			<img
				src="/assets/asset10.svg"
				alt=""
				aria-hidden
				className="absolute top-[6%] left-[4%] w-14 sm:w-20 opacity-30 pointer-events-none z-[1]"
				style={{ animation: "floatY 5s ease-in-out infinite" }}
			/>
			<img
				src="/assets/asset4.svg"
				alt=""
				aria-hidden
				className="absolute bottom-[8%] right-[5%] w-16 sm:w-28 opacity-25 pointer-events-none z-[1]"
				style={{ animation: "floatYSlow 7s ease-in-out infinite" }}
			/>
			<img
				src="/assets/asset10.svg"
				alt=""
				aria-hidden
				className="absolute top-[55%] left-[85%] w-10 sm:w-14 opacity-20 pointer-events-none z-[1] hidden sm:block"
				style={{
					animation: "drift 6s ease-in-out infinite",
					transform: "rotate(45deg)",
				}}
			/>
			<img
				src="/assets/asset4.svg"
				alt=""
				aria-hidden
				className="absolute top-[20%] right-[15%] w-12 sm:w-16 opacity-15 pointer-events-none z-[1] hidden md:block"
				style={{ animation: "floatY 8s ease-in-out infinite 1s" }}
			/>
			<img
				src="/assets/asset10.svg"
				alt=""
				aria-hidden
				className="absolute bottom-[25%] left-[10%] w-8 sm:w-12 opacity-20 pointer-events-none z-[1] hidden sm:block"
				style={{ animation: "drift 9s ease-in-out infinite 0.5s" }}
			/>

			{/* Main Content */}
			<div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
				{/* Logo */}
				<img
					src="/images/logo.png"
					alt="Universitas Ciputra Color Run Logo"
					className="w-40 sm:w-52 md:w-60 mb-6 drop-shadow-xl"
					data-aos="zoom-in"
					data-aos-duration="1000"
					data-aos-delay="100"
				/>

				{/* Glassmorphism Card */}
				<div
					className="max-w-2xl w-full rounded-3xl p-8 sm:p-12 text-center shadow-2xl border border-white/20"
					style={{
						background:
							"linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.68) 100%)",
						backdropFilter: "blur(18px) saturate(1.3)",
						WebkitBackdropFilter: "blur(18px) saturate(1.3)",
					}}
					data-aos="fade-up"
					data-aos-duration="1000"
					data-aos-delay="300"
				>
					{/* Celebration Icon */}
					<div
						className="inline-flex items-center justify-center w-20 h-20 rounded-full mx-auto mb-6"
						style={{
							background:
								"linear-gradient(135deg, #91DCAC 0%, #4EF9CD 50%, #F581A4 100%)",
							boxShadow: "0 8px 32px rgba(145,220,172,0.4)",
						}}
						data-aos="zoom-in"
						data-aos-delay="500"
					>
						<svg
							width="40"
							height="40"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							{/* Party popper / celebration icon */}
							<path
								d="M5.8 11.3L2 22l10.7-3.8"
								stroke="white"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01M22 2L13.2 6.4a1.28 1.28 0 00-.4 1.78l3.02 3.02a1.28 1.28 0 001.78-.4L22 2z"
								stroke="white"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M9 12a1 1 0 001 1 1 1 0 001-1 1 1 0 00-1-1 1 1 0 00-1 1z"
								fill="white"
							/>
						</svg>
					</div>

					{/* Title */}
					<h1
						className="font-moderniz text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 leading-tight"
						style={{
							background:
								"linear-gradient(90deg, #1F6251 0%, #4D9D56 35%, #a52d5d 70%, #F581A4 100%)",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
							backgroundClip: "text",
						}}
						data-aos="fade-up"
						data-aos-delay="600"
					>
						Thank You!
					</h1>

					{/* Subtitle */}
					<h2
						className="font-moderniz text-lg sm:text-xl md:text-2xl font-bold text-[#1F6251] mb-6"
						data-aos="fade-up"
						data-aos-delay="700"
					>
						Universitas Ciputra Color Run 2026 Has Been Completed! 🎉
					</h2>

					{/* Description */}
					<p
						className="font-mustica text-[#3d5c52] text-sm sm:text-base leading-relaxed mb-3"
						data-aos="fade-up"
						data-aos-delay="800"
					>
						Thank you to every runner, volunteer, sponsor, and supporter who made this event an
						unforgettable celebration of health, happiness, and color! Your energy and excitement
						made this the most vibrant Color Run yet.
					</p>

					<p
						className="font-mustica text-[#5a706a] text-sm leading-relaxed mb-8"
						data-aos="fade-up"
						data-aos-delay="900"
					>
						We couldn&apos;t have done it without each and every one of you. 
						From the starting line to the final color burst — you made it truly special. 💚
					</p>

					{/* Divider */}
					<div
						className="w-24 h-1 mx-auto rounded-full mb-8"
						style={{
							background:
								"linear-gradient(90deg, #91DCAC 0%, #F581A4 100%)",
						}}
						data-aos="fade-up"
						data-aos-delay="950"
					/>

					{/* Stay Tuned Badge */}
					<div
						className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-8"
						style={{
							background:
								"linear-gradient(90deg, rgba(145,220,172,0.2) 0%, rgba(245,129,164,0.2) 100%)",
							border: "1.5px solid rgba(31,98,81,0.15)",
						}}
						data-aos="fade-up"
						data-aos-delay="1000"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="#1F6251"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
							<path d="M13.73 21a2 2 0 0 1-3.46 0" />
						</svg>
						<span className="font-moderniz text-[#1F6251] text-sm sm:text-base font-bold">
							Stay Tuned for Further Updates!
						</span>
					</div>

					{/* CTA Buttons */}
					<div
						className="flex flex-col sm:flex-row gap-3 justify-center"
						data-aos="fade-up"
						data-aos-delay="1100"
					>
						<a
							href="https://www.instagram.com/uc.colorrun/"
							target="_blank"
							rel="noopener noreferrer"
							className="px-7 py-3 rounded-full font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 text-sm sm:text-base flex items-center justify-center gap-2"
							style={{
								background:
									"linear-gradient(90deg, #1F6251 0%, #4D9D56 100%)",
							}}
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
							</svg>
							Follow @uc.colorrun
						</a>

						<button
							onClick={() => fireConfetti()}
							className="px-7 py-3 rounded-full font-semibold text-[#1F6251] border-2 border-[#1F6251]/30 hover:bg-[#1F6251]/5 transition-all duration-200 hover:-translate-y-0.5 text-sm sm:text-base cursor-pointer"
						>
							🎊 Celebrate Again!
						</button>
					</div>
				</div>

				{/* Footer note */}
				<p
					className="mt-8 text-xs text-[#5a706a] text-center max-w-md"
					data-aos="fade-up"
					data-aos-delay="1200"
					style={{
						textShadow: "0 1px 4px rgba(255,255,255,0.6)",
					}}
				>
					Follow us on Instagram for event highlights, photos, and exciting announcements!
					<br />
					<a
						href="https://www.instagram.com/uc.colorrun/"
						target="_blank"
						rel="noopener noreferrer"
						className="underline font-bold text-[#1F6251] hover:text-[#4D9D56] transition-colors"
					>
						@uc.colorrun
					</a>
				</p>
			</div>

			{/* CSS Animations */}
			<style jsx>{`
				@keyframes floatY {
					0%, 100% { transform: translateY(0); }
					50% { transform: translateY(-18px); }
				}
				@keyframes floatYSlow {
					0%, 100% { transform: translateY(0); }
					50% { transform: translateY(-12px); }
				}
				@keyframes drift {
					0%, 100% { transform: translateX(0) translateY(0) rotate(45deg); }
					33% { transform: translateX(8px) translateY(-10px) rotate(50deg); }
					66% { transform: translateX(-6px) translateY(-5px) rotate(40deg); }
				}
			`}</style>
		</main>
	);
}
