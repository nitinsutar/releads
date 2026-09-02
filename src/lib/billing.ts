export type BillingPlan = "Trial" | "Growth" | "Pro";

export const billingPlans: {
  id: BillingPlan;
  name: string;
  monthlyInr: number;
  seats: number;
  projects: number;
  description: string;
  envKey: string;
}[] = [
  { id: "Trial", name: "Trial", monthlyInr: 0, seats: 5, projects: 2, description: "14-day guided pilot for one builder team.", envKey: "DODO_PRODUCT_TRIAL" },
  { id: "Growth", name: "Growth", monthlyInr: 4999, seats: 25, projects: 10, description: "Sales + channel partner workspace for active projects.", envKey: "DODO_PRODUCT_GROWTH" },
  { id: "Pro", name: "Pro", monthlyInr: 9999, seats: 100, projects: 50, description: "Multi-project builder group with billing, exports and priority support.", envKey: "DODO_PRODUCT_PRO" }
];

export function productIdForPlan(plan: BillingPlan) {
  const item = billingPlans.find((entry) => entry.id === plan);
  return item ? process.env[item.envKey] ?? "" : "";
}
