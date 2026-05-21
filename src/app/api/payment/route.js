import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { tier, userId } = await req.json(); 
    
    const pricing = {
      basic: 299,
      plus: 499,
      premium: 799
    };

    const amount = pricing[tier?.toLowerCase()];

    if (!amount) {
      return NextResponse.json({ error: "Invalid or Free tier selected" }, { status: 400 });
    }

    // 1. MATCH THE EXACT ENVIRONMENT VARIABLES FROM YOUR VERCEL DASHBOARD
    const consumerKey = process.env.PESAPAL_CONSUMER_KEY || process.env.PESAPAL_KEY;
    const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET || process.env.PESAPAL_SECRET;

    if (!consumerKey || !consumerSecret) {
      console.error("Payment Error: Secret Pesapal credentials missing from Vercel configuration.");
      return NextResponse.json({ error: "Gateway authentication mismatch" }, { status: 500 });
    }

    // 2. Authenticate with Pesapal
    const authResponse = await fetch("https://pay.pesapal.com/v3/api/Auth/RequestToken", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret
      })
    });
    
    const authData = await authResponse.json();
    if (!authData.token) {
      console.error("Pesapal Token Generation Failed:", authData);
      throw new Error("Pesapal authentication failed");
    }

    // 3. Clean Order Generation Payload
    const uniqueOrderId = `PENDO-${userId || 'GUEST'}-${Date.now()}`;
    
    const payload = {
      id: uniqueOrderId,
      currency: "KES",
      amount: amount,
      description: `PendoMatch ${tier.toUpperCase()} Subscription`,
      callback_url: "https://pendomatch.vercel.app/dashboard", // Set to your live production URL
      redirect_mode: "TOP_WINDOW"
    };

    // Only append notification_id if you have a valid configured one from Pesapal Dashboard
    if (process.env.PESAPAL_IPN_ID && process.env.PESAPAL_IPN_ID !== "YOUR_IPN_ID_HERE") {
      payload.notification_id = process.env.PESAPAL_IPN_ID;
    }

    // 4. Submit Order Request with exact details
    const orderResponse = await fetch("https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest", {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${authData.token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload)
    });
    
    const orderData = await orderResponse.json();
    
    if (!orderData.redirect_url) {
      console.error("Pesapal Placement Error Layout: ", orderData);
      return NextResponse.json({ error: orderData.message || "Checkout link processing failed" }, { status: 400 });
    }
    
    return NextResponse.json({ checkoutUrl: orderData.redirect_url });

  } catch (error) {
    console.error("Global Payment API Pipeline Exception:", error.message);
    return NextResponse.json({ error: "Payment gateway connection error" }, { status: 500 });
  }
}