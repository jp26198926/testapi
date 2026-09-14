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

export function toPayPalAmount(v: string | number): string {
  return Number(v).toFixed(2);
}

export type CreatedOrder = { id: string; approvalUrl: string };

export async function createOrder(params: {
  amount: string;
  currency: string;
  customId: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<CreatedOrder> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: params.currency,
            value: params.amount,
          },
          description: params.description,
          custom_id: params.customId,
        },
      ],
      application_context: {
        brand_name: "TESTAPI",
        user_action: "PAY_NOW",
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(
      `PayPal createOrder failed: ${res.status} ${await res.text()}`
    );
  }

  const data = await res.json();
  const approvalUrl = data.links?.find(
    (l: { rel: string }) => l.rel === "approve"
  )?.href;

  if (!data.id || !approvalUrl) {
    throw new Error("PayPal createOrder: missing id or approval URL");
  }

  return { id: data.id, approvalUrl };
}

export type CapturedOrder = {
  id: string;
  status: string;
  custom_id?: string;
  purchase_units?: Array<{
    custom_id?: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { value: string; currency_code: string };
      }>;
    };
  }>;
};

export async function getOrder(orderId: string): Promise<CapturedOrder> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(
      `PayPal getOrder failed: ${res.status} ${await res.text()}`
    );
  }
  return res.json();
}

export async function captureOrder(orderId: string): Promise<CapturedOrder> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const text = await res.text();
  let data: CapturedOrder & { details?: Array<{ issue?: string }> };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`PayPal captureOrder parse failed: ${res.status}`);
  }

  if (!res.ok) {
    const issue = data.details?.[0]?.issue;
    if (issue === "ORDER_ALREADY_CAPTURED") {
      throw new Error("ORDER_ALREADY_CAPTURED");
    }
    throw new Error(`PayPal captureOrder failed: ${res.status} ${text}`);
  }

  return data;
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
