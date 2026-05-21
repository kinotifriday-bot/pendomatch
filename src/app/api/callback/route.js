import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const orderTrackingId = searchParams.get("OrderTrackingId");
  const merchantReference = searchParams.get("OrderMerchantReference");

  // 1. Extract the tier/user from the merchantReference if needed
  // 2. Safely update Firebase tier fields here
  
  return NextResponse.json({ status: "Webhook logged. System automated." });
}