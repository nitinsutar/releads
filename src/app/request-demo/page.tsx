import Link from "next/link";

export default function RequestDemoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="card w-full max-w-lg p-8">
        <p className="text-sm font-semibold text-brand-600">For real estate builders</p>
        <h1 className="mt-2 text-3xl font-semibold">Request a guided demo</h1>
        <p className="mt-3 text-sm text-slate-500">Leave your business details and our platform team will contact you. Submission is a placeholder in this MVP.</p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <input className="field" placeholder="Your name" />
          <input className="field" placeholder="Company name" />
          <input className="field sm:col-span-2" type="email" placeholder="Business email" />
          <input className="field sm:col-span-2" placeholder="Mobile number" />
        </div>
        <button className="btn-primary mt-5 w-full">Request demo</button>
        <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-brand-600">Return to login</Link>
      </div>
    </main>
  );
}
