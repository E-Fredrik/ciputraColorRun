"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";

export default function NavBar() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const router = useRouter();
	const { totalItems } = useCart();

	// new: track auth status (null=unknown, false=not logged in, true=logged in)
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
	const [userName, setUserName] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		// call server endpoint to check cookie-based login
		(async () => {
			try {
				const res = await fetch("/api/user", { credentials: "include" });
				if (!mounted) return;
				if (res.ok) {
					const body = await res.json().catch(() => ({}));
					setIsAuthenticated(true);
					// Expecting { user: { name, ... } } or { name: ... }
					const name = body?.user?.name ?? body?.name ?? null;
					setUserName(name);
				} else {
					setIsAuthenticated(false);
					setUserName(null);
				}
			} catch (e) {
				if (!mounted) return;
				setIsAuthenticated(false);
				setUserName(null);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const goToProfile = () => {
		setIsMenuOpen(false);
		// if unknown, optimistically go to profile (server will redirect/401) — but prefer explicit mapping
		if (isAuthenticated === true) {
			router.push("/profilePage");
		} else if (isAuthenticated === false) {
			router.push("/auth/login");
		} else {
			// still unknown — fetch once and then route
			(async () => {
				try {
					const res = await fetch("/api/user", { credentials: "include" });
					if (res.ok) router.push("/profilePage");
					else router.push("/auth/login");
				} catch {
					router.push("/auth/login");
				}
			})();
		}
	};

	// Logout: call logout endpoint (if present) and reset local state
	const logout = async () => {
		try {
			// attempt server-side logout; if endpoint missing this will fail silently
			await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
		} finally {
			setIsAuthenticated(false);
			setUserName(null);
			// navigate home after logout
			router.push("/");
		}
	};

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 nav-glass border-b font-moderniz">
             <div className="max-w-7xl mx-auto px-6 py-4">
                 <div className="flex items-center justify-between">
					<Link href="/" className="flex items-center">
						<Image
							src="/images/logo.png"
							alt="Ciputra Color Run Logo"
							width={60}
							height={60}
							className="object-contain"
						/>
					</Link>

					<div className="hidden md:flex items-center gap-12">
						<Link
							href="/"
							className="text-white font-bold text-lg hover:text-white/80 transition-colors tracking-wide"
						>
							HOME
						</Link>
						<Link
							href="/registration"
							className="text-white font-bold text-lg hover:text-white/80 transition-colors tracking-wide"
						>
							REGISTER
						</Link>

						{/* Icons */}
						<div className="flex items-center gap-6">
                             {/* Cart */}
                             <button
								onClick={() => router.push("/cart")}
								className="relative text-white hover:text-white/80 transition-colors mr-2"
                                 aria-label="Shopping Cart"
                             >
                                 <ShoppingCart size={32} strokeWidth={2.5} />
                                 {totalItems > 0 && (
                                     <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                         {totalItems}
                                     </span>
                                 )}
                             </button>
 
                             {/* Auth: show LOGIN when not logged in; show icon + name + logout when logged in */}
                             {isAuthenticated ? (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={goToProfile}
                                        className="flex items-center text-white hover:text-white/80 transition-colors gap-2"
                                        aria-label="User Profile"
                                    >
                                        <User size={28} strokeWidth={2.5} />
                                        <span className="hidden sm:inline font-medium">{userName ?? "Profile"}</span>
                                    </button>
                                    <button
                                        onClick={logout}
                                        className="text-white/90 hover:text-white px-3 py-1 border border-white/10 rounded-md text-sm"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => router.push("/auth/login")}
                                    className="text-white font-semibold"
                                >
                                    LOGIN
                                </button>
                            )}
						</div>
					</div>

					<button
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						className="md:hidden text-white hover:text-white/80 transition-colors"
						aria-label="Toggle Menu"
					>
						{isMenuOpen ? (
							<X size={32} strokeWidth={2.5} />
						) : (
							<Menu size={32} strokeWidth={2.5} />
						)}
					</button>

					{/* Mobile Menu: right-side overlay with close button on top */}
					{isMenuOpen && (
						<div className="md:hidden">
							{/* backdrop (lighter so glass effect is visible) */}
							<div
								className="fixed inset-0 bg-black/12 backdrop-blur-sm z-40"
								onClick={() => setIsMenuOpen(false)}
							/>

							{/* full-screen panel, content aligned to the right and text right-aligned */}
							<div className="fixed inset-0 z-50 flex justify-end">
								{/* glassmorphic panel (matches desktop nav glass) */}
								<div className="w-full max-w-md bg-white/10 dark:bg-black/28 backdrop-blur-lg backdrop-saturate-150 border border-white/10 p-6 flex flex-col items-end min-h-screen font-moderniz">
                                     {/* Close button on top-right of panel */}
                                     <button
                                         onClick={() => setIsMenuOpen(false)}
                                         className="text-white hover:text-white/90 mb-4"
                                         aria-label="Close Menu"
                                     >
                                         <X size={28} strokeWidth={2.5} />
                                     </button>
 
                                     {/* Menu items (right-aligned) */}
                                     <nav className="w-full flex flex-col gap-4 mt-2 items-end text-right">
										<Link
											href="/"
											className="text-white font-bold text-lg hover:text-white/80 transition-colors tracking-wide w-full text-right"
											onClick={() => setIsMenuOpen(false)}
										>
											HOME
										</Link>
										<Link
											href="/registration"
											className="text-white font-bold text-lg hover:text-white/80 transition-colors tracking-wide w-full text-right"
											onClick={() => setIsMenuOpen(false)}
										>
											REGISTER
										</Link>

										{/* bottom actions: cart + auth (right aligned) */}
										<div className="flex items-center gap-4 pt-4 border-t border-white/10 w-full justify-end">
											<button
												onClick={() => {
													setIsMenuOpen(false);
													router.push("/cart");
												}}
												className="relative text-white hover:text-white/80 transition-colors"
												aria-label="Shopping Cart"
											>
												<ShoppingCart size={28} strokeWidth={2.5} />
												{totalItems > 0 && (
													<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
														{totalItems}
													</span>
												)}
											</button>

											{isAuthenticated ? (
												<div className="flex items-center gap-3">
													<button
														onClick={() => {
															setIsMenuOpen(false);
															goToProfile();
														}}
														className="flex items-center gap-2 text-white font-medium"
														aria-label="User Profile"
													>
														<User size={28} strokeWidth={2.5} />
														<span>{userName ?? "Profile"}</span>
													</button>
													<button
														onClick={() => {
															setIsMenuOpen(false);
															logout();
														}}
														className="text-white/90 hover:text-white px-3 py-1 border border-white/10 rounded-md text-sm"
													>
														Logout
													</button>
												</div>
											) : (
												<button
													onClick={() => {
														setIsMenuOpen(false);
														router.push("/auth/login");
													}}
													className="text-white font-semibold"
												>
													LOGIN
												</button>
											)}
										</div>
									</nav>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</nav>
	);
 }
