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

    const consumerKey = process.env.PESAPAL_CONSUMER_KEY || process.env.PESAPAL_KEY;
    const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET || process.env.PESAPAL_SECRET;

    if (!consumerKey || !consumerSecret) {
      console.error("Payment Error: Secret Pesapal credentials missing from Vercel configuration.");
      return NextResponse.json({ error: "Gateway credentials missing in environment" }, { status: 500 });
    }

    // Toggle URLs here depending on testing environment (pay.pesapal.com = live, cybersansa.pesapal.com = sandbox)
    const isProduction = !consumerKey.includes('sandbox');
    const baseUrl = isProduction ? "https://pay.pesapal.com/v3" : "https://cybersansa.pesapal.com/preview/v3";

    // 2. Authenticate with Pesapal
    const authResponse = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
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
      return NextResponse.json({ error: authData.message || "Pesapal authorization rejected" }, { status: 401 });
    }

    // 3. Clean Order Generation Payload
    const uniqueOrderId = `PENDO-${userId || 'GUEST'}-${Date.now()}`;
    
    const payload = {
      id: uniqueOrderId,
      currency: "KES",
      amount: amount,
      description: `PendoMatch ${tier.toUpperCase()} Subscription`,
      callback_url: "https://pendomatch.vercel.app/dashboard",
      redirect_mode: "TOP_WINDOW"
    };

    if (process.env.PESAPAL_IPN_ID && process.env.PESAPAL_IPN_ID !== "YOUR_IPN_ID_HERE") {
      payload.notification_id = process.env.PESAPAL_IPN_ID;
    }

    // 4. Submit Order Request
    const orderResponse = await fetch(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
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
      return NextResponse.json({ error: orderData.message || "Checkout URL missing" }, { status: 400 });
    }
    
    return NextResponse.json({ checkoutUrl: orderData.redirect_url });

  } catch (error) {
    console.error("Global Payment API Pipeline Exception:", error.message);
    return NextResponse.json({ error: `Payment gateway error: ${error.message}` }, { status: 500 });
  }
}