import Link from "next/link";

export default function BillingReturnPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="card max-w-lg p-8 text-center">
        <p className="text-sm font-semibold text-brand-600">Dodo Payments</p>
        <h1 className="mt-2 text-2xl font-semibold">Payment submitted</h1>
        <p className="mt-3 text-sm text-slate-500">If the charge succeeds, your company plan will switch to Active after the Dodo webhook arrives.</p>
        <Link href="/dashboard/subscriptions" className="btn-primary mt-6 inline-flex">Back to subscriptions</Link>
      </div>
    </main>
  );
}
