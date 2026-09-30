"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

type Plan = "monthly" | "yearly";

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill: {
    email: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
};

declare global {
  interface Window {
    Razorpay: new (
      options: RazorpayOptions
    ) => {
      open: () => void;
    };
  }
}

export default function SubscribePage() {
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] =
    useState<Plan | null>(null);

  const [loading, setLoading] = useState(false);
  const [checkoutLoaded, setCheckoutLoaded] =
    useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  function showMessage(
    text: string,
    type: "success" | "error"
  ) {
    setMessage(text);
    setMessageType(type);
  }

  async function handleContinue() {
    if (!selectedPlan) {
      showMessage(
        "Please select a subscription plan.",
        "error"
      );
      return;
    }

    if (!checkoutLoaded) {
      showMessage(
        "Payment system is still loading. Please wait a moment.",
        "error"
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/create-subscription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: selectedPlan,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create subscription."
        );
      }

      const razorpayOptions: RazorpayOptions = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "DIGITAL.HEROES",
        description:
          selectedPlan === "monthly"
            ? "Digital Heroes Monthly Membership"
            : "Digital Heroes Yearly Membership",
        prefill: {
          email: data.email,
        },
        theme: {
          color: "#34d399",
        },

        handler: async (paymentResponse) => {
          showMessage(
            "Payment received. Verifying subscription...",
            "success"
          );

          try {
            const verifyResponse = await fetch(
              "/api/verify-subscription",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(
                  paymentResponse
                ),
              }
            );

            const verifyData =
              await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.error ||
                  "Unable to verify payment."
              );
            }

            showMessage(
              "Payment verified. Your subscription is now active!",
              "success"
            );

            setTimeout(() => {
              router.push("/protected");
            }, 1200);
          } catch (error) {
            console.error(
              "Verification error:",
              error
            );

            showMessage(
              error instanceof Error
                ? error.message
                : "Payment verification failed.",
              "error"
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);

            showMessage(
              "Payment window closed. Your subscription has not been activated.",
              "error"
            );
          },
        },
      };

      const razorpay =
        new window.Razorpay(
          razorpayOptions
        );

      razorpay.open();
    } catch (error) {
      console.error(
        "Subscription checkout error:",
        error
      );

      showMessage(
        error instanceof Error
          ? error.message
          : "Unable to start payment.",
        "error"
      );

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setCheckoutLoaded(true)}
        onError={() =>
          showMessage(
            "Unable to load Razorpay Checkout.",
            "error"
          )
        }
      />

      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-xl font-bold tracking-tight"
          >
            DIGITAL
            <span className="text-emerald-400">.</span>
            HEROES
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/protected")
            }
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
          >
            Dashboard
          </button>
        </div>
      </nav>

      {/* Heading */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Membership
        </p>

        <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-6xl">
          Choose your plan.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/60">
          Choose your membership plan and
          continue to secure Razorpay test
          checkout.
        </p>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">

          {/* Monthly */}
          <button
            type="button"
            onClick={() =>
              setSelectedPlan("monthly")
            }
            className={`text-left rounded-3xl border p-8 transition ${
              selectedPlan === "monthly"
                ? "border-emerald-400 bg-emerald-400/[0.08]"
                : "border-white/10 bg-white/[0.03] hover:border-white/25"
            }`}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-white/45">
              Monthly
            </p>

            <h2 className="mt-4 text-3xl font-bold">
              ₹499 / month
            </h2>

            <p className="mt-4 leading-7 text-white/55">
              Flexible monthly membership with
              access to Digital Heroes
              subscription features.
            </p>

            <div className="mt-8 space-y-3 text-sm text-white/65">
              <p>✓ Monthly participation</p>
              <p>✓ Golf score tracking</p>
              <p>✓ Charity selection</p>
              <p>✓ Subscriber dashboard</p>
            </div>

            <div className="mt-8">
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                  selectedPlan === "monthly"
                    ? "bg-emerald-400 text-[#07111f]"
                    : "border border-white/15"
                }`}
              >
                {selectedPlan === "monthly"
                  ? "Selected"
                  : "Select monthly"}
              </span>
            </div>
          </button>

          {/* Yearly */}
          <button
            type="button"
            onClick={() =>
              setSelectedPlan("yearly")
            }
            className={`text-left rounded-3xl border p-8 transition ${
              selectedPlan === "yearly"
                ? "border-emerald-400 bg-emerald-400/[0.08]"
                : "border-white/10 bg-white/[0.03] hover:border-white/25"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-400">
                Yearly
              </p>

              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                DISCOUNTED
              </span>
            </div>

            <h2 className="mt-4 text-3xl font-bold">
              ₹4,999 / year
            </h2>

            <p className="mt-4 leading-7 text-white/55">
              Discounted yearly membership for
              continuous participation.
            </p>

            <div className="mt-8 space-y-3 text-sm text-white/65">
              <p>✓ Everything in monthly</p>
              <p>✓ Year-round participation</p>
              <p>✓ Golf score tracking</p>
              <p>✓ Charity selection</p>
            </div>

            <div className="mt-8">
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                  selectedPlan === "yearly"
                    ? "bg-emerald-400 text-[#07111f]"
                    : "border border-white/15"
                }`}
              >
                {selectedPlan === "yearly"
                  ? "Selected"
                  : "Select yearly"}
              </span>
            </div>
          </button>
        </div>

        {/* Continue */}
        <div className="mx-auto mt-10 max-w-xl">
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="w-full rounded-full bg-emerald-400 px-6 py-4 text-lg font-semibold text-[#07111f] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Continue to payment"}
          </button>

          <p className="mt-4 text-center text-xs text-white/35">
            Test Mode — no real payment will be charged.
          </p>

          {message && (
            <div
              className={`mt-5 rounded-2xl border px-5 py-4 text-center text-sm ${
                messageType === "error"
                  ? "border-red-400/20 bg-red-400/10 text-red-300"
                  : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}