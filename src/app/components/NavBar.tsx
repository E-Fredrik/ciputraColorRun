"use client";

import Link from "next/link";
import Image from "next/image";
import { User, Menu, X, HelpCircle, MessageCircle, PenTool, ShoppingCart, FileText } from "lucide-react";
import { useState, useEffect, useRef, useContext } from "react";
import { createPortal } from "react-dom";
import { CartContext } from "@/context/CartContext";

import { useRouter, usePathname } from "next/navigation";

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isAuthorizationModalOpen, setIsAuthorizationModalOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { cart, toggleCart } = useContext(CartContext);

    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // hide on scroll down, show on scroll up
    const [isNavHidden, setIsNavHidden] = useState(false);

    // accumulate small scroll deltas so slow scrolls are detected reliably
    const scrollAccRef = useRef(0);
    const lastYRef = useRef<number | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let ticking = false;

        const MIN_HIDE_DELTA = 6;  // immediate hide on fast scroll down
        const MIN_SHOW_DELTA = -2; // show on small upward movement
        const ACC_SHOW_THRESHOLD = -12; // accumulated upward delta to force-show
        const ACC_HIDE_THRESHOLD = 20;  // accumulated downward delta to force-hide

        function onScroll() {
            const currentY = window.scrollY || 0;
            const lastY = lastYRef.current ?? currentY;
            const delta = currentY - lastY;

            if (!ticking) {
                window.requestAnimationFrame(() => {
                    // always show when near top
                    if (currentY <= 40) {
                        scrollAccRef.current = 0;
                        setIsNavHidden(false);
                        lastYRef.current = currentY;
                        ticking = false;
                        return;
                    }

                    // accumulate small deltas so slow pacing still triggers
                    if (Math.abs(delta) < MIN_HIDE_DELTA) {
                        scrollAccRef.current = (scrollAccRef.current + delta);
                        // clamp accumulation
                        scrollAccRef.current = Math.max(-100, Math.min(100, scrollAccRef.current));
                    } else {
                        // large movement resets to that delta
                        scrollAccRef.current = delta;
                    }

                    // Decide: fast downward scroll -> hide immediately
                    if (delta > MIN_HIDE_DELTA || scrollAccRef.current > ACC_HIDE_THRESHOLD) {
                        setIsNavHidden(true);
                    }
                    // Any noticeable upward scroll or accumulated upward movement -> show
                    else if (delta < MIN_SHOW_DELTA || scrollAccRef.current < ACC_SHOW_THRESHOLD) {
                        setIsNavHidden(false);
                    }

                    lastYRef.current = currentY;
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Track auth status (null=unknown, false=not logged in, true=logged in)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(false);

    // Check authentication status
    const checkAuth = async () => {
        if (isCheckingAuth) return; // Prevent multiple simultaneous checks
        setIsCheckingAuth(true);
        
        try {
            const res = await fetch("/api/user", { 
                credentials: "include",
                cache: 'no-store' // Prevent caching
            });
            
            if (res.ok) {
                const body = await res.json().catch(() => ({}));
                setIsAuthenticated(true);
                const name = body?.user?.name ?? body?.name ?? null;
                setUserName(name);
            } else {
                setIsAuthenticated(false);
                setUserName(null);
            }
        } catch (e) {
            setIsAuthenticated(false);
            setUserName(null);
        } finally {
            setIsCheckingAuth(false);
        }
    };

    // Check auth on mount
    useEffect(() => {
        checkAuth();
    }, []);

    // Re-check auth when pathname changes (after navigation)
    useEffect(() => {
        // Small delay to allow cookie changes to propagate
        const timer = setTimeout(() => {
            checkAuth();
        }, 100);
        
        return () => clearTimeout(timer);
    }, [pathname]);

    const goToProfile = () => {
        setIsMenuOpen(false);
        if (isAuthenticated === true) {
            router.push("/profilePage");
        } else if (isAuthenticated === false) {
            router.push("/auth/login");
        } else {
            // Unknown state - check then route
            checkAuth().then(() => {
                if (isAuthenticated) {
                    router.push("/profilePage");
                } else {
                    router.push("/auth/login");
                }
            });
        }
    };

    // Logout: call logout endpoint and force re-check
    const logout = async () => {
        try {
            // Call server logout endpoint
            await fetch("/api/auth/logout", { 
                method: "POST", 
                credentials: "include" 
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local state immediately
            setIsAuthenticated(false);
            setUserName(null);
            
            // Navigate home
            router.push("/");
            
            // Force re-check after navigation
            setTimeout(() => {
                checkAuth();
            }, 200);
        }
    };

    const authorizationModal =
        isClient && isAuthorizationModalOpen
            ? createPortal(
                  <div className="fixed inset-0 z-300 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-zoomIn">
                          <button
                              onClick={() => setIsAuthorizationModalOpen(false)}
                              className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                              aria-label="Close authorization modal"
                          >
                              <X size={20} />
                          </button>
                          <div className="p-6 space-y-5">
                              <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                      <FileText size={24} className="text-emerald-600" />
                                  </div>
                                  <div>
                                      <h3 className="text-lg font-semibold text-gray-900">
                                          Authorization Letter (Surat Kuasa)
                                      </h3>
                                      <p className="text-sm text-gray-600">
                                          Go to the authorization letter page to download the official template
                                          for authorizing someone else to collect your race pack.
                                      </p>
                                  </div>
                              </div>

                              <button
                                  onClick={() => {
                                      setIsAuthorizationModalOpen(false);
                                      setIsHelpOpen(false);
                                      setIsMenuOpen(false);
                                      router.push("/authorization-letter");
                                  }}
                                  className="w-full px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-full transition-all shadow-lg hover:shadow-xl"
                              >
                                  Go to Authorization Letter Page
                              </button>

                              <button
                                  onClick={() => setIsAuthorizationModalOpen(false)}
                                  className="w-full mt-2 px-6 py-3 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium rounded-full transition-all"
                              >
                                  Maybe later
                              </button>
                          </div>
                      </div>
                  </div>,
                  document.body
              )
            : null;

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 nav-glass border-b font-moderniz ${isNavHidden ? "nav-hidden" : ""}`}>
            <div className="max-w-7xl mx-auto px-4 py-2">
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

                    {/* DESKTOP MENU */}
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
                        {/* 👇 TAMBAHAN BARU: Terms & Conditions */}
                        <Link
                            href="/terms-and-conditions"
                            className="text-white font-bold text-lg hover:text-white/80 transition-colors tracking-wide"
                        >
                            T&C
                        </Link>

                        {/* Auth: show LOGIN when not logged in; show icon + name + logout when logged in */}
                        {isAuthenticated === null ? (
                            // Loading state
                            <div className="w-20 h-8 bg-white/10 rounded animate-pulse"></div>
                        ) : isAuthenticated ? (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={goToProfile}
                                    className="flex items-center text-white hover:text-white/80 transition-colors gap-2"
                                    aria-label="User Profile"
                                >
                                    <User size={26} strokeWidth={2.2} />
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
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => router.push("/auth/login")}
                                    className="text-white font-bold"
                                >
                                    LOGIN
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsHelpOpen(!isHelpOpen)}
                                        className="relative p-2 rounded-full hover:bg-white/10 transition-colors group"
                                        aria-label="Help"
                                    >
                                        <HelpCircle size={24} strokeWidth={2} className="text-white" />
                                        <span className="invisible group-hover:visible absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap">
                                            Help
                                        </span>
                                    </button>

                                    {/* DESKTOP / RESPONSIVE HELP PANEL */}
                                    {isHelpOpen && (
                                        <div
                                            className={
                                                // mobile-first: full width and scrollable; on md+ use compact card anchored to right
                                                "absolute left-0 right-0 mt-2 md:right-0 md:left-auto w-full md:w-80 max-w-full md:max-w-none bg-white rounded-t-2xl md:rounded-2xl shadow-2xl p-4 md:p-6 z-50 border border-gray-200 max-h-[70vh] overflow-y-auto"
                                            }
                                        >
                                            <button
                                                onClick={() => setIsHelpOpen(false)}
                                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                                aria-label="Close help"
                                            >
                                                <X size={20} />
                                            </button>

                                            <div className="space-y-4 pt-2">
                                                <div>
                                                    <button
                                                        onClick={() =>
                                                            window.open(
                                                            "https://www.instagram.com/reel/DTKAD_mEiGz/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
                                                            "_blank"
                                                            )
                                                        }
                                                        className="text-lg font-semibold flex items-center gap-2"
                                                        >
                                                        <PenTool size={20} className="text-purple-600" />
                                                        <span className="register-loading">
                                                            <h4 className = "text-black">How to Register</h4>
                                                        </span>
                                                    </button>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                                                        <MessageCircle size={20} className="text-green-600" />
                                                        <span style={{ marginLeft: "10px" }}>Contact Person</span>
                                                    </h3>
                                                    <div className="flex pl-10 gap-10">
                                                        <a
                                                            href="https://wa.me/895410319676"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-black"
                                                        >
                                                            <span className="contact-loading font-medium">
                                                            Abel
                                                            </span>
                                                        </a>

                                                        <a
                                                            href="https://wa.me/811306658"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-black"
                                                        >
                                                            <span className="contact-loading font-medium">
                                                            Elysian
                                                            </span>
                                                        </a>
                                                    </div>
                                                    {/* Authorization Letter entry (desktop help) */}
                                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                                        <button
                                                            onClick={() => setIsAuthorizationModalOpen(true)}
                                                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-sm font-semibold transition-colors"
                                                        >
                                                            <span>Authorization Letter (Surat Kuasa)</span>
                                                            <FileText size={18} className="text-emerald-600" />
                                                        </button>
                                                        <p className="mt-2 text-xs text-gray-500">
                                                            Use this if someone else will collect your race pack for you.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <button onClick={toggleCart} className="relative text-white p-2">
                            <ShoppingCart size={22} />
                            {isClient && cart.length > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="flex items-center md:hidden">
                        <button onClick={toggleCart} className="relative text-white p-2">
                            <ShoppingCart size={22} />
                            {isClient && cart.length > 0 && (
                                <span className="absolute top-1 right-1 text-xs bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-white p-2"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>

                    {/* MOBILE MENU */}
                    {isMenuOpen && (
                        <div className="absolute top-full left-0 right-0 md:hidden">
                            <div className="nav-glass backdrop-blur-lg border-b ">
                                <div className="flex flex-col items-end px-6 py-6 gap-6">

                                    {/* Mobile: visible Help button */}
                                    <div className="w-full flex justify-end">
                                        <button
                                            onClick={() => setIsHelpOpen(!isHelpOpen)}
                                            className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-white z-50 pointer-events-auto"
                                            aria-label="Help"
                                            tabIndex={0}
                                        >
                                            <HelpCircle size={24} strokeWidth={2} className="text-white" />
                                        </button>
                                    </div>

                                    <nav className="flex flex-col items-end gap-4 w-full">
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
                                        {/* 👇 TAMBAHAN BARU: Terms & Conditions di Mobile */}
                                        <Link
                                            href="/terms-and-conditions"
                                            className="text-white font-bold text-lg hover:text-white/80 transition-colors tracking-wide w-full text-right"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            TERMS & CONDITIONS
                                        </Link>

                                        {/* Bottom actions: auth (right aligned) */}
                                        <div className="flex items-center gap-4 pt-4 border-t border-white/10 w-full justify-end">

                                            {isAuthenticated === null ? (
                                                <div className="w-20 h-8 bg-white/10 rounded animate-pulse"></div>
                                            ) : isAuthenticated ? (
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
                                                    <b>LOGIN</b>
                                                </button>
                                            )}
                                        </div>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MOBILE HELP PANEL - Fixed positioning to viewport */}
                    {isMenuOpen && isHelpOpen && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 md:hidden pt-32">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-y-auto">
                                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex items-center justify-between rounded-t-2xl z-10">
                                    <h3 className="text-lg font-semibold text-gray-800">Help & Support</h3>
                                    <button
                                        onClick={() => setIsHelpOpen(false)}
                                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex-shrink-0"
                                        aria-label="Close help"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-4 space-y-4">
                                    <div>
                                        <button
                                            onClick={() => {
                                                window.open(
                                                    "https://www.instagram.com/reel/DTKAD_mEiGz/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==",
                                                    "_blank"
                                                );
                                            }}
                                            className="text-lg font-semibold flex items-center gap-2 text-blue-600 hover:text-blue-700 w-full"
                                        >
                                            <PenTool size={20} />
                                            How to Register
                                        </button>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <MessageCircle size={18} />
                                            Contact Person
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <p className="font-semibold text-gray-800 mb-1">Abel</p>
                                                <a
                                                    href="https://wa.me/6289541031967"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                                                >
                                                    WhatsApp
                                                </a>
                                            </div>
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                <p className="font-semibold text-gray-800 mb-1">Elysian</p>
                                                <a
                                                    href="https://wa.me/6281283494950"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                                                >
                                                    WhatsApp
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Authorization Letter entry (mobile help) */}
                                    <div className="pt-2 border-t border-gray-200">
                                        <button
                                            onClick={() => setIsAuthorizationModalOpen(true)}
                                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-sm font-semibold transition-colors"
                                        >
                                            <span>Authorization Letter (Surat Kuasa)</span>
                                            <FileText size={18} className="text-emerald-600" />
                                        </button>
                                        <p className="mt-2 text-xs text-gray-500">
                                            Learn how to authorize someone else to collect your race pack.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {authorizationModal}
        </nav>
    );
}