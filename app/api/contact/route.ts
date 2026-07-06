import { NextResponse } from "next/server";
import { Resend } from "resend";

interface ContactBody {
  name: string;
  email: string;
  message: string;
}

export async function POST(request: Request) {
  let body: ContactBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { name, email, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  if (!apiKey || !notifyEmail) {
    console.log("[contact] Email not configured. Message:", {
      name,
      email,
      message,
    });

    return NextResponse.json({ ok: true, emailSent: false });
  }

  try {
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "Nexora Core <onboarding@resend.dev>",
      to: notifyEmail,
      replyTo: email,
      subject: `New contact form message from ${name}`,
      html: `
        <h2>New message from the contact form</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
    });

    return NextResponse.json({ ok: true, emailSent: true });
  } catch (error) {
    console.error("[contact] Failed to send email:", error);

    return NextResponse.json(
      { ok: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
