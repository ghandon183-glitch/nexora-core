import { getOrderByToken } from "@/lib/orders/db";
import { getDownloadAssetPath } from "@/lib/data/downloads";
import Navbar from "@/components/navigation/navbar";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let order = null;
  let dbError = false;

  try {
    order = await getOrderByToken(token);
  } catch (error) {
    console.error("[download] Failed to look up order:", error);
    dbError = true;
  }

  const isValid = order && order.status === "confirmed";
  // Download is served through the token-authorized API endpoint — never a
  // direct public `/downloads/<slug>.zip` URL.
  const hasPackage = order ? getDownloadAssetPath(order.template_slug) !== null : false;

  return (
    <>
      <Navbar />

      <main className="flex min-h-screen items-center justify-center bg-[#060B18] px-6 pt-24 pb-20">
        <Card className="w-full max-w-lg p-8 text-center hover:-translate-y-0 hover:border-white/10">
          {dbError && (
            <>
              <p className="text-lg font-bold text-white">Something went wrong</p>
              <p className="mt-2 text-sm text-slate-400">
                We couldn&apos;t look up this download link right now. Please try again in a moment.
              </p>
            </>
          )}

          {!dbError && !order && (
            <>
              <p className="text-lg font-bold text-white">Link not found</p>
              <p className="mt-2 text-sm text-slate-400">
                This download link is invalid or has expired. If you believe this is a mistake,
                please contact support.
              </p>
            </>
          )}

          {!dbError && order && !isValid && (
            <>
              <p className="text-lg font-bold text-white">Not ready yet</p>
              <p className="mt-2 text-sm text-slate-400">
                This order isn&apos;t confirmed yet. If you just paid, please wait a few minutes
                for on-chain confirmation — you&apos;ll get an email as soon as it&apos;s ready.
              </p>
            </>
          )}

          {!dbError && order && isValid && (
            <>
              <p className="text-lg font-bold text-white">
                Your download is ready — {order.template_title}
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Payment confirmed on-chain. Enjoy!
              </p>

              {hasPackage ? (
                <a href={`/api/download/${token}`} download>
                  <Button className="mt-6 w-full">Download source files</Button>
                </a>
              ) : (
                <p className="mt-6 text-sm text-amber-400">
                  This template&apos;s package is being finalized — we&apos;ll email you as soon
                  as it&apos;s ready.
                </p>
              )}
            </>
          )}

          <Link href="/" className="mt-6 inline-block text-sm text-slate-400 hover:text-cyan-400">
            ← Back to home
          </Link>
        </Card>
      </main>
    </>
  );
}
