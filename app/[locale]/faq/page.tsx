import Navbar from "@/components/navigation/navbar";
import Section from "@/components/ui/section";
import Heading from "@/components/ui/heading";
import PageGlow from "@/components/ui/page-glow";
import Accordion from "@/components/ui/accordion";

const PAYMENT_FAQS = [
  {
    question: "How do I pay with USDT or Bitcoin?",
    answer:
      "On the checkout page, choose USDT or Bitcoin and click \"Generate payment address.\" You'll get a wallet address and an exact amount to send. Send that exact amount from your wallet or exchange — the exact amount is what lets our system detect your payment automatically.",
  },
  {
    question: "Why does the amount have extra decimals, like $49.004231?",
    answer:
      "Each order gets a small, unique fingerprint added to the price. Since crypto payments don't have an \"order number\" field, this tiny difference is how we tell your payment apart from everyone else's — and it's how your download unlocks automatically without anyone reviewing it by hand. Always send the exact amount shown, not a rounded number.",
  },
  {
    question: "How long does confirmation take?",
    answer:
      "USDT (TRC20) is usually detected within a few minutes of the transaction confirming on-chain. Bitcoin can take longer — anywhere from 10 minutes to about an hour, depending on network congestion, since Bitcoin blocks confirm roughly every 10 minutes.",
  },
  {
    question: "What if I send the wrong amount?",
    answer:
      "If the amount doesn't match exactly, our system won't auto-detect it — but your funds aren't lost. Contact us with your transaction hash and order details and we'll verify and unlock it manually.",
  },
  {
    question: "What if I send on the wrong network?",
    answer:
      "This is the one mistake that can't be fixed after the fact. Only send USDT on the TRC20 (Tron) network, and only send BTC on the native Bitcoin network. Funds sent on an unsupported network (e.g. USDT on Ethereum/ERC20, or via a Lightning invoice) generally cannot be recovered.",
  },
  {
    question: "My payment window expired — what now?",
    answer:
      "Each payment address is valid for 45 minutes. If nothing arrives in that window, the order simply expires — no funds are ever at risk since nothing was charged. Just start checkout again for a fresh address and amount.",
  },
  {
    question: "Do you store my payment details?",
    answer:
      "We only store what's needed to process your order: the wallet address you paid to, the amount, and the resulting transaction hash once confirmed. We never ask for private keys, seed phrases, or exchange login credentials — we will never ask you for these, and you should treat any such request as a scam.",
  },
];

const GENERAL_FAQS = [
  {
    question: "What do I get when I buy a template?",
    answer:
      "A complete, ready-to-deploy source code package (Next.js + Tailwind CSS) for the template, downloadable from your dashboard once your payment is confirmed.",
  },
  {
    question: "Can I use a template for a client project?",
    answer:
      "Yes — the license covers use in your own projects and client projects. See the license terms on each template's page for specifics.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Because templates are digital source code delivered instantly on confirmation, we generally don't offer refunds once a download link has been issued. If a template is broken or significantly different from its preview, contact us — we handle that case by case.",
  },
  {
    question: "I didn't get my confirmation email — what should I do?",
    answer:
      "First check your spam folder. If your payment was sent correctly, it will also appear as \"confirmed\" in your dashboard even if the email didn't arrive. If it still shows as pending well past the expected confirmation time, contact us with your order details.",
  },
];

export default function FaqPage() {
  return (
    <>
      <Navbar />

      <Section>
        <PageGlow variant="cyan" />
        <div className="mx-auto max-w-3xl">
          <Heading
            badge="Support"
            title="Frequently Asked Questions"
            description="Everything about paying with crypto, order verification, and using your templates."
            align="center"
            accent="cyan"
          />

          <div className="mt-16">
            <h2 className="mb-6 text-lg font-bold text-white">Crypto Payments</h2>
            <Accordion items={PAYMENT_FAQS} />
          </div>

          <div className="mt-16">
            <h2 className="mb-6 text-lg font-bold text-white">Orders &amp; Licensing</h2>
            <Accordion items={GENERAL_FAQS} />
          </div>
        </div>
      </Section>
    </>
  );
}
