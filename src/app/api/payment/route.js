import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { tier, userId } = await req.json(); 
    
    // 1. Map your exact tier pricing (Free is handled app-side, so no need to charge KES 0)
    const pricing = {
      basic: 299,
      plus: 499,
      premium: 799
    };

    const amount = pricing[tier.toLowerCase()];

    if (!amount) {
      return NextResponse.json({ error: "Invalid or Free tier selected" }, { status: 400 });
    }

    // 2. Authenticate with Pesapal
    const authResponse = await fetch("https://pay.pesapal.com/v3/api/Auth/RequestToken", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumer_key: process.env.PESAPAL_KEY,
        consumer_secret: process.env.PESAPAL_SECRET
      })
    });
    const authData = await authResponse.json();
    if (!authData.token) throw new Error("Pesapal authentication failed");

    // 3. Submit Order Request with exact details
    const orderResponse = await fetch("https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest", {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${authData.token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        id: `PENDO-${userId || Date.now()}-${Date.now()}`,
        currency: "KES",
        amount: amount,
        description: `PendoMatch ${tier.toUpperCase()} Subscription`,
        callback_url: "https://yourdomain.com/dashboard", // Replace with your live domain
        notification_id: "YOUR_IPN_ID_HERE" // Put your generated IPN registration ID here
      })
    });
    const orderData = await orderResponse.json();
    
    return NextResponse.json({ checkoutUrl: orderData.redirect_url });

  } catch (error) {
    return NextResponse.json({ error: "Payment setup failed" }, { status: 500 });
  }
}