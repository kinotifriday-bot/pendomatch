import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // Dynamically grab email if passed from the frontend view
    const { tier, userId, email } = await req.json(); 
    
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
      console.error("Payment Error: Secret Pesapal credentials missing from environment configuration.");
      return NextResponse.json({ error: "Gateway credentials missing in environment" }, { status: 500 });
    }

    // FIXED: Adjusted sandbox domain spelling to hit Pesapal's official servers
    const isProduction = process.env.PESAPAL_URL === 'production' || !consumerKey.includes('sb-');
    const baseUrl = isProduction ? "https://pay.pesapal.com/v3" : "https://cybersandbox.pesapal.com/v3";

    // 1. Authenticate with Pesapal
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

    // 2. DYNAMIC AUTO-REGISTRATION: Fetch or generate the IPN ID automatically
    let validIpnId = "";
    try {
      const ipnResponse = await fetch(`${baseUrl}/api/URLSetup/RegisterIPN`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authData.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: "https://mingle-pink.vercel.app/api/callback",
          ipn_notification_type: "GET"
        })
      });
      
      const ipnData = await ipnResponse.json();
      validIpnId = ipnData.ipn_id;
    } catch (ipnError) {
      console.error("Dynamic IPN Registration Fallback triggered:", ipnError);
    }

    // Final structural fallback just in case the API drops the field altogether
    if (!validIpnId) {
      validIpnId = process.env.PESAPAL_IPN_ID || "00000000-0000-0000-0000-000000000000";
    }

    // 3. Clean Order Generation Payload
    const uniqueOrderId = `PENDO-${userId || 'GUEST'}-${Date.now()}`;

    const payload = {
      id: uniqueOrderId,
      currency: "KES",
      amount: amount,
      description: `PendoMatch ${tier.toUpperCase()} Subscription`,
      callback_url: "https://mingle-pink.vercel.app/dashboard",
      redirect_mode: "TOP_WINDOW",
      notification_id: validIpnId,
      
      billing_address: {
        email_address: email || "customer@pendomatch.com",
        phone_number: "0700000000", 
        country_code: "KE",
        first_name: "PendoMatch",
        last_name: "User"
      }
    };

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
      return NextResponse.json({ error: orderData.message || "Checkout URL missing from schema generation" }, { status: 400 });
    }
    
    return NextResponse.json({ checkoutUrl: orderData.redirect_url });

  } catch (error) {
    console.error("Global Payment API Pipeline Exception:", error.message);
    return NextResponse.json({ error: `Payment gateway error: ${error.message}` }, { status: 500 });
  }
}