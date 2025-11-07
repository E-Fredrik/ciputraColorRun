"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function ConfirmPaymentPage() {
	const search = useSearchParams();
	const router = useRouter();
	// expecting ?category=Individual&price=69000 (registrationId removed)
	const category = search.get("category") ?? "Individual";
	const price = search.get("price") ?? "0";

	// capture registration user info from query params (or pass them from registration page)
	const fullName = search.get("fullName") ?? "";
	const email = search.get("email") ?? "";
	const phone = search.get("phone") ?? "";
	const registrationType = search.get("registrationType") ?? "individual";

	const [fileName, setFileName] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		const form = new FormData(e.currentTarget);
		try {
			const res = await fetch("/api/payments", {
				method: "POST",
				body: form,
			});
			if (!res.ok) {
				const json = await res.json();
				throw new Error(json?.error || res.statusText);
			}
			// success
			router.push(`/registration/confirm?status=success`);
		} catch (err: any) {
			setError(err.message || "Upload failed");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main className="flex bg-gradient-to-br from-emerald-100/30 via-transparent to-rose-100/30 min-h-screen pt-28 pb-16">
			<div className="mx-auto w-full max-w-2xl px-4">
				<h1 className="text-4xl md:text-6xl text-center font-bold mb-8 tracking-wide text-white drop-shadow-lg">
					CIPUTRA COLOR RUN
				</h1>

				<section className="bg-white/95 backdrop-blur-md rounded-lg p-8 md:p-10 shadow-lg text-gray-800">
					<h2 className="text-2xl font-bold text-center mb-1">
						REGISTRATION FORM
					</h2>
					<p className="text-center text-sm text-gray-600 mb-6">
						Enter the details to get going.
					</p>

					{/* Payment details */}
					<div className="mb-6">
						<h3 className="font-semibold mb-3">Detail Payment :</h3>
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div>Kategori :</div>
							<div className="text-right">{category}</div>

							<div>Harga (one ticket) :</div>
							<div className="text-right">
								Rp. {Number(price).toLocaleString("id-ID")}
							</div>

							<div className="col-span-2 border-t my-2" />

							<div>Total yang harus dibayar :</div>
							<div className="text-right font-semibold">
								Rp. {Number(price).toLocaleString("id-ID")}
							</div>
						</div>
					</div>

					<form
						onSubmit={handleSubmit}
						encType="multipart/form-data"
						className="space-y-6"
					>
						{/* include registration user data so API can create Registration when missing */}
						<input type="hidden" name="fullName" value={fullName} />
						<input type="hidden" name="email" value={email} />
						<input type="hidden" name="phone" value={phone} />
						<input type="hidden" name="registrationType" value={registrationType} />

						{/* registrationId removed (API will auto-create / not require) */}
						<input type="hidden" name="category" value={category} />
						<input type="hidden" name="amount" value={price} />

						<label className="block font-semibold">Upload Bukti*</label>

						{/* drag & drop / file input */}
						<label
							htmlFor="proof"
							className="block border border-gray-300 rounded-lg p-8 text-center cursor-pointer"
						>
							<div className="flex flex-col items-center justify-center gap-2">
								<div className="w-12 h-12 text-gray-400">
									<Image
										src="/images/upload-icon.png"
										alt="upload"
										width={48}
										height={48}
									/>
								</div>
								<div className="font-medium">Drag & Drop Files or Browse</div>
								<div className="text-xs text-gray-500">
									Supported formats: PNG, JPG, JPEG — Files size under 5 MB
								</div>
								<div className="mt-4 text-sm text-gray-700">
									{fileName ?? ""}
								</div>
							</div>
							<input
								id="proof"
								name="proof"
								type="file"
								accept="image/png,image/jpeg,image/jpg"
								className="hidden"
								onChange={(ev) => {
									const f = (ev.target as HTMLInputElement).files?.[0];
									setFileName(f?.name ?? null);
								}}
								required
							/>
						</label>

						{error && <div className="text-red-600 text-sm">{error}</div>}

						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full py-3 rounded-full bg-gradient-to-r from-emerald-200 to-emerald-100 text-white font-bold"
						>
							{isSubmitting ? "Uploading..." : "Next"}
						</button>
					</form>
				</section>
			</div>
		</main>
	);
}
