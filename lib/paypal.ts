const PAYPAL_API =
  process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new Error("PayPal credentials not configured.");
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function createSubscription(planId?: string): Promise<{
  id: string;
  approvalUrl: string;
}> {
  const token = await getAccessToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: planId || process.env.PAYPAL_PLAN_ID,
      application_context: {
        brand_name: "TESTAPI",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${appUrl}/billing?success=true`,
        cancel_url: `${appUrl}/billing?cancelled=true`,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal subscription creation failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  const approvalUrl = data.links?.find(
    (l: { rel: string }) => l.rel === "approve"
  )?.href;

  return { id: data.id, approvalUrl };
}
