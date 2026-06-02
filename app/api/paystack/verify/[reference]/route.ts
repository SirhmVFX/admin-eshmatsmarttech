import { NextResponse } from "next/server";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY must be set in environment variables.");
}

export async function GET(
  _request: Request,
  { params }: { params: { reference: string } }
) {
  const reference = params.reference;
  if (!reference) {
    return NextResponse.json({ error: "Missing reference." }, { status: 400 });
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.status) {
    return NextResponse.json(
      { error: data?.message || "Paystack verification failed." },
      { status: response.status || 500 }
    );
  }

  return NextResponse.json({ transaction: data.data });
}
