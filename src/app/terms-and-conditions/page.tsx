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
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 text-gray-700 terms-content">
                            <h1 className="text-lg md:text-xl font-extrabold text-gray-900">
                              TERMS AND CONDITIONS FOR PARTICIPANTS OF CIPUTRA COLOR RUN 2026
                            </h1>

                            <p className="text-sm">
                              <strong>By registering as a participant in Ciputra Color Run 2026, the participant fully accepts and agrees to comply with the rules and conditions below.</strong>
                            </p>

                            <h2 className="mt-4 font-bold">SECTION 1: GENERAL EVENT INFORMATION</h2>
                            <ul className="list-disc pl-6 text-sm">
                              <li><strong>Event Name:</strong> Ciputra Color Run 2026</li>
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
                                  <li>Participants can register through the official Ciputra Color Run 2026 website at <a href="https://ciputrarun.com" className="text-blue-600 underline">https://ciputracolorrun.com</a>.</li>
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
                                    All photo and video materials are the intellectual property of Ciputra Color Run 2026 and its network.
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