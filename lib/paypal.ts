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
  const resolvedPlanId = planId || process.env.PAYPAL_PLAN_ID;
  if (!resolvedPlanId) {
    throw new Error(
      "No PayPal plan configured. Set plans.paypalPlanId or PAYPAL_PLAN_ID."
    );
  }

  const token = await getAccessToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: resolvedPlanId,
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

export type PayPalSubscription = {
  id: string;
  status: string;
  plan_id?: string;
  start_time?: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { amount?: { value: string; currency_code: string } };
  };
  subscriber?: { email_address?: string };
};

export async function getSubscription(
  subscriptionId: string
): Promise<PayPalSubscription> {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    throw new Error(
      `PayPal getSubscription failed: ${res.status} ${await res.text()}`
    );
  }
  return res.json();
}

export async function cancelSubscription(
  subscriptionId: string,
  reason = "Cancelled by user"
): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    }
  );
  // 204 success; 422 if already cancelled/inactive — treat as idempotent
  if (!res.ok && res.status !== 422) {
    throw new Error(
      `PayPal cancel failed: ${res.status} ${await res.text()}`
    );
  }
}

export async function verifyWebhookSignature(params: {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  webhookId: string;
  webhookEvent: unknown;
}): Promise<boolean> {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_API}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: params.authAlgo,
        cert_url: params.certUrl,
        transmission_id: params.transmissionId,
        transmission_sig: params.transmissionSig,
        transmission_time: params.transmissionTime,
        webhook_id: params.webhookId,
        webhook_event: params.webhookEvent,
      }),
    }
  );
  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === "SUCCESS";
}
