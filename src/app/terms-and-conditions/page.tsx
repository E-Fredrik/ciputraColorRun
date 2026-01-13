"use client";

import { useRouter } from "next/navigation";

export default function TermsAndConditionsPage() {
    const router = useRouter();

    return (
        <main
            className="min-h-screen pt-28 pb-16"
            style={{
                backgroundImage: "url('/images/generalBg.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className="mx-auto w-full max-w-2xl px-4">
                <section className="bg-white rounded-lg shadow-2xl overflow-hidden" data-aos="zoom-in">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-6">
                        <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
                            Terms & Conditions
                        </h2>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="px-6 py-6 max-h-[500px] overflow-y-auto">
                        <h3 className="font-bold text-lg text-gray-900 mb-4">Registration Agreement</h3>
                        
                        <p className="text-sm text-gray-700 mb-6">
                            By proceeding with this registration, you acknowledge and agree to the following terms and conditions for participating in the Ciputra Color Run event:
                        </p>

                        <div className="space-y-4 text-sm text-gray-700">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">1. Participant Information</h4>
                                <p>All information provided must be accurate and complete. False information may result in disqualification.</p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">2. Health & Safety</h4>
                                <p>Participants must be in good health and physically fit to participate. Those with medical conditions should consult a physician before registering.</p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">3. Payment & Refunds</h4>
                                <p>Registration fees are non-refundable. Payment must be completed within 24 hours of registration submission.</p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">4. Event Rules</h4>
                                <p>Participants must follow all event rules and instructions from organizers and staff. Failure to comply may result in removal from the event.</p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">5. Liability Waiver</h4>
                                <p>The organizer is not responsible for any injury, loss, or damage during the event. Participants join at their own risk.</p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">6. Media Release</h4>
                                <p>Participants consent to the use of their photos/videos taken during the event for promotional purposes.</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer with Back Button */}
                    <div className="border-t border-gray-200 px-6 py-5 bg-gray-50">
                        <button
                            onClick={() => router.back()}
                            className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
                        >
                            Back
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}