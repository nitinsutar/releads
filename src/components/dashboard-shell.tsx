"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { Bell, BriefcaseBusiness, Building2, CalendarClock, ChevronDown, CircleUserRound, FileText, FolderOpen, Home, LogOut, Settings, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { roleLabels, Role } from "@/lib/types";

const navigation: Record<Role, { label: string; href: string; icon: typeof Home }[]> = {
  super_admin: [
    { label: "Platform Dashboard", href: "/dashboard", icon: Home },
    { label: "Builder Companies", href: "/dashboard/companies", icon: Building2 },
    { label: "Users", href: "/dashboard/users", icon: Users },
    { label: "Subscriptions", href: "/dashboard/subscriptions", icon: FileText },
    { label: "Global Settings", href: "/dashboard/settings", icon: Settings }
  ],
  builder_admin: [
    { label: "Company Dashboard", href: "/dashboard", icon: Home },
    { label: "Projects", href: "/dashboard/projects", icon: Building2 },
    { label: "Leads", href: "/dashboard/leads", icon: BriefcaseBusiness },
    { label: "Sales Team", href: "/dashboard/team", icon: Users },
    { label: "Brokers", href: "/dashboard/brokers", icon: CircleUserRound },
    { label: "Settings", href: "/dashboard/settings", icon: Settings }
  ],
  sales: [
    { label: "My Dashboard", href: "/dashboard", icon: Home },
    { label: "My Leads", href: "/dashboard/leads", icon: BriefcaseBusiness },
    { label: "Future Follow-ups", href: "/dashboard/followups", icon: CalendarClock }
  ],
  broker: [
    { label: "Broker Dashboard", href: "/dashboard", icon: Home },
    { label: "Add / My Leads", href: "/dashboard/leads", icon: BriefcaseBusiness },
    { label: "Project Resources", href: "/dashboard/resources", icon: FolderOpen },
    { label: "Broker Profile", href: "/dashboard/settings", icon: Settings }
  ],
  customer: [
    { label: "Customer Dashboard", href: "/dashboard", icon: Home },
    { label: "My Enquiry", href: "/dashboard/leads", icon: BriefcaseBusiness },
    { label: "Booking Status", href: "/dashboard/bookings", icon: FileText },
    { label: "Documents", href: "/dashboard/documents", icon: FolderOpen }
  ]
};

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading workspace...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-100 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 px-7 text-lg font-semibold">
          <span className="rounded-xl bg-brand-50 p-2 text-brand-600"><Building2 className="h-6 w-6" /></span>
          EstateFlow
        </div>
        <div className="px-4 pb-4">
          <p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">{roleLabels[user.role]}</p>
          <nav className="space-y-1">
            {navigation[user.role].map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
                  <Icon className="h-[18px] w-[18px]" /> {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto border-t border-slate-100 p-4">
          <button onClick={() => void signOut().then(() => router.replace("/login"))} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50">
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </button>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-100 bg-white/90 px-5 backdrop-blur sm:px-8">
          <div>
            <p className="text-sm text-slate-400">Real Estate Lead Management CRM</p>
            <p className="font-semibold text-slate-900">Welcome, {user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-slate-100 p-2.5 text-slate-500"><Bell className="h-5 w-5" /></button>
            <div className="hidden items-center gap-2 rounded-xl border border-slate-100 py-2 pl-3 pr-2 sm:flex">
              <CircleUserRound className="h-5 w-5 text-brand-600" />
              <span className="text-sm font-medium">{user.name}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </header>
        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
