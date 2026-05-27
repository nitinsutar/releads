import { Heading } from "@/components/ui";

export default function FollowupsPage() {
  return (
    <>
      <Heading title="Follow-up Workspace" description="Placeholder reserved for Phase 2 follow-up queues." />
      <section className="card max-w-2xl p-7">
        <p className="text-sm font-semibold text-brand-600">Future phase placeholder</p>
        <h2 className="mt-2 text-xl font-semibold">Today&apos;s and overdue follow-ups</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">Phase 1 stores a follow-up date on each lead. The dedicated today/overdue follow-up queue will be built in Phase 2.</p>
      </section>
    </>
  );
}
