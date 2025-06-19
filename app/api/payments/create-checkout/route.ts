import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-04-30.basil" as any,
  })

  const body = await request.json()
  const { priceId } = body

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${request.headers.get("origin")}/result?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin")}/`,
    })

    return NextResponse.json({ session })
  } catch (e: any) {
    console.log(e)
    return new NextResponse(
      JSON.stringify({
        status: "error",
        message: e.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
