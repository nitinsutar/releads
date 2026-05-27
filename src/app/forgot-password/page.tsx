import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="card w-full max-w-md p-8">
        <p className="text-sm font-semibold text-brand-600">Account access</p>
        <h1 className="mt-2 text-2xl font-semibold">Reset your password</h1>
        <p className="mt-3 text-sm text-slate-500">Password reset email delivery is a placeholder for the MVP. Connect Supabase Auth email templates to activate this flow.</p>
        <input type="email" className="field mt-7" placeholder="Work email address" />
        <button className="btn-primary mt-4 w-full">Send reset link</button>
        <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-brand-600">Back to sign in</Link>
      </div>
    </main>
  );
}
