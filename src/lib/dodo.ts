const baseUrl = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
  ? "https://live.dodopayments.com"
  : "https://test.dodopayments.com";

export async function dodoRequest(path: string, init?: RequestInit) {
  const key = process.env.DODO_PAYMENTS_API_KEY;
  if (!key) throw new Error("DODO_PAYMENTS_API_KEY is not configured.");
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? payload.error ?? "Dodo Payments request failed.");
  return payload;
}

export async function createDodoCheckout(input: Record<string, unknown>) {
  return dodoRequest("/checkouts", { method: "POST", body: JSON.stringify(input) });
}
