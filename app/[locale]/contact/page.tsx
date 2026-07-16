"use client";

import { FormEvent, useState } from "react";

import Navbar from "@/components/navigation/navbar";

import Section from "@/components/ui/section";
import Heading from "@/components/ui/heading";
import PageGlow from "@/components/ui/page-glow";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!name || !email || !message) {
      return;
    }

    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <Navbar />

      <Section>
        <PageGlow variant="violet" />
        <div className="mx-auto max-w-2xl">

          <Heading
            badge="Contact"
            title="Get in touch"
            description="Questions about a template, a purchase, or anything else? Send a message and you'll hear back by email."
            align="center"
            accent="violet"
          />

          <Card className="mt-12 p-8 hover:-translate-y-0 hover:border-white/10">

            {status === "sent" ? (
              <div className="py-8 text-center">
                <p className="text-lg font-semibold text-cyan-300">
                  Message sent — thanks for reaching out.
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  You should hear back by email soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">

                <div>
                  <label htmlFor="contact-name" className="mb-2 block text-sm text-slate-300">
                    Name
                  </label>

                  <Input
                    id="contact-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="mb-2 block text-sm text-slate-300">
                    Email
                  </label>

                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="mb-2 block text-sm text-slate-300">
                    Message
                  </label>

                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help?"
                    rows={5}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 backdrop-blur-xl transition-all duration-300 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  />
                </div>

                {status === "error" && (
                  <p className="text-sm text-red-400">
                    Something went wrong sending your message. Please try
                    again in a moment.
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Sending..." : "Send Message"}
                </Button>

              </form>
            )}

          </Card>

        </div>
      </Section>
    </>
  );
}
