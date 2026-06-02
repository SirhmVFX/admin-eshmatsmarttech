import { NextResponse } from "next/server";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY must be set in environment variables.");
}

function getCallbackUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.origin}/cart/payment-success`;
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const email = typeof payload?.email === "string" ? payload.email.trim() : "";
  const amount = Number(payload?.amount);
  const callbackUrl = typeof payload?.callbackUrl === "string" ? payload.callbackUrl : getCallbackUrl(request);
  const metadata = typeof payload?.metadata === "object" && payload?.metadata !== null ? payload.metadata : {};

  if (!email || !amount || amount <= 0) {
    return NextResponse.json(
      { error: "Invalid payment request. A valid email and amount are required." },
      { status: 400 }
    );
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount,
      callback_url: callbackUrl,
      metadata,
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.status) {
    return NextResponse.json(
      { error: data?.message || "Paystack initialization failed." },
      { status: response.status || 500 }
    );
  }

  return NextResponse.json({
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  });
}
