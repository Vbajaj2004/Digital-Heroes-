import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-[#07111f]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight">
            DIGITAL<span className="text-emerald-400">.</span>HEROES
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#how-it-works"
              className="text-sm text-white/70 transition hover:text-white"
            >
              How It Works
            </a>

            <a
              href="#charity"
              className="text-sm text-white/70 transition hover:text-white"
            >
              Charity
            </a>

            <a
              href="#plans"
              className="text-sm text-white/70 transition hover:text-white"
            >
              Plans
            </a>
          </div>

          <Link
            href="/auth/login"
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_35%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center lg:py-32">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
              Golf with a purpose
            </div>

            <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Play.
              <br />
              Score.
              <br />
              <span className="text-emerald-400">Give back.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">
              Turn your golf performance into opportunities to win while
              supporting charities that matter to you.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#plans"
                className="rounded-full bg-emerald-400 px-7 py-3.5 font-semibold text-[#07111f] transition hover:bg-emerald-300"
              >
                Become a Hero
              </a>

              <a
                href="#how-it-works"
                className="rounded-full border border-white/15 px-7 py-3.5 font-semibold transition hover:bg-white/10"
              >
                How it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-8 text-sm text-white/55">
              <div>
                <p className="text-2xl font-bold text-white">5</p>
                <p>Latest scores tracked</p>
              </div>

              <div>
                <p className="text-2xl font-bold text-white">3</p>
                <p>Prize match levels</p>
              </div>

              <div>
                <p className="text-2xl font-bold text-white">10%</p>
                <p>Minimum charity share</p>
              </div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/5 p-8">
                <p className="text-sm text-white/50">MONTHLY DRAW</p>

                <p className="mt-3 text-5xl font-bold">₹2,50,000</p>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[72%] rounded-full bg-emerald-400" />
                </div>

                <div className="mt-3 flex justify-between text-sm text-white/50">
                  <span>Prize pool</span>
                  <span>72% funded</span>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/5 p-4 text-center">
                    <p className="text-xl font-bold">5</p>
                    <p className="mt-1 text-xs text-white/50">Match</p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4 text-center">
                    <p className="text-xl font-bold">4</p>
                    <p className="mt-1 text-xs text-white/50">Match</p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4 text-center">
                    <p className="text-xl font-bold">3</p>
                    <p className="mt-1 text-xs text-white/50">Match</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 rounded-2xl border border-white/10 bg-[#101c2d] px-5 py-4 shadow-xl">
              <p className="text-xs text-white/45">CHARITY CONTRIBUTION</p>
              <p className="mt-1 text-xl font-bold text-emerald-400">
                10%+
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-white/10 bg-[#0a1626]"
      >
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Simple flow
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              Four steps. One purpose.
            </h2>

            <p className="mt-5 text-white/60">
              Subscribe, keep your latest scores updated, enter the monthly
              draw and support a charity you care about.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                number: "01",
                title: "Subscribe",
                text: "Choose a monthly or yearly membership plan.",
              },
              {
                number: "02",
                title: "Score",
                text: "Add and maintain your latest five Stableford scores.",
              },
              {
                number: "03",
                title: "Draw",
                text: "Take part in monthly prize draws.",
              },
              {
                number: "04",
                title: "Give back",
                text: "Direct part of your subscription to your chosen charity.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <p className="text-sm font-bold text-emerald-400">
                  {item.number}
                </p>

                <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>

                <p className="mt-3 text-sm leading-6 text-white/55">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charity */}
      <section id="charity" className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Your impact
              </p>

              <h2 className="mt-4 text-4xl font-bold md:text-5xl">
                Your subscription can support a cause.
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-white/60">
                Choose a charity when you join. The platform is designed so
                charitable contribution is part of the experience, not an
                afterthought.
              </p>

              <a
                href="#plans"
                className="mt-8 inline-block rounded-full border border-white/15 px-6 py-3 font-semibold transition hover:bg-white/10"
              >
                Explore membership
              </a>
            </div>

            <div className="rounded-3xl border border-emerald-400/15 bg-emerald-400/5 p-8">
              <p className="text-sm text-white/45">FEATURED IMPACT</p>

              <p className="mt-4 text-6xl font-bold text-emerald-400">
                10%+
              </p>

              <p className="mt-3 text-lg text-white/75">
                Minimum contribution from a subscription.
              </p>

              <div className="mt-8 h-px bg-white/10" />

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm text-white/50">
                  Increase your contribution
                </span>
                <span className="font-semibold">Your choice</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="border-t border-white/10 bg-[#0a1626]">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Membership
            </p>

            <h2 className="mt-4 text-4xl font-bold md:text-5xl">
              Choose your plan.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-white/60">
              Start with the plan that fits you. We’ll connect the real
              subscription flow later.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <p className="text-sm text-white/50">MONTHLY</p>

              <h3 className="mt-4 text-3xl font-bold">₹499</h3>
              <p className="mt-2 text-sm text-white/50">per month</p>

              <div className="my-8 h-px bg-white/10" />

              <ul className="space-y-3 text-sm text-white/65">
                <li>✓ Monthly draw participation</li>
                <li>✓ Score tracking</li>
                <li>✓ Charity selection</li>
                <li>✓ User dashboard</li>
              </ul>

              <a
                href="#"
                className="mt-8 block rounded-full border border-white/15 px-5 py-3 text-center font-semibold transition hover:bg-white/10"
              >
                Choose monthly
              </a>
            </div>

            <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/[0.07] p-8">
              <div className="flex items-center justify-between">
                <p className="text-sm text-emerald-300">YEARLY</p>

                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  DISCOUNTED
                </span>
              </div>

              <h3 className="mt-4 text-3xl font-bold">₹4,999</h3>
              <p className="mt-2 text-sm text-white/50">per year</p>

              <div className="my-8 h-px bg-white/10" />

              <ul className="space-y-3 text-sm text-white/65">
                <li>✓ Everything in monthly</li>
                <li>✓ Lower effective monthly cost</li>
                <li>✓ Continuous participation</li>
                <li>✓ Charity contribution</li>
              </ul>

              <a
                href="#"
                className="mt-8 block rounded-full bg-emerald-400 px-5 py-3 text-center font-semibold text-[#07111f] transition hover:bg-emerald-300"
              >
                Choose yearly
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-white/45 md:flex-row md:items-center md:justify-between">
          <p>
            © 2026 digital.HEROES. Built for golfers who want to give back.
          </p>

          <div className="flex gap-6">
            <a href="#how-it-works" className="hover:text-white">
              How it works
            </a>
            <a href="#charity" className="hover:text-white">
              Charity
            </a>
            <a href="#plans" className="hover:text-white">
              Plans
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}