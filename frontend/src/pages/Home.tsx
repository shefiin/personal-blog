import { Link } from "react-router-dom";

const Home = () => {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#FBFBFB] px-4 py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#efe8dc] blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#e8eef7] blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-5xl">
        <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-[#dfdfdf] bg-white/80 px-4 py-1.5 text-xs tracking-[0.2em] text-[#444] backdrop-blur">
          CODE & CONTEXT
        </div>

        <div className="grid gap-10 md:grid-cols-[1.35fr_1fr] md:items-end">
          <div>
            <h1 className="max-w-3xl text-5xl leading-[1.08] tracking-tight text-black md:text-6xl">
              Quiet writing for builders, thinkers, and curious minds.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#3e3e3e]">
              Essays on code, systems, and craft. Clean ideas, practical context, and thoughtful perspectives from a
              developer&apos;s desk.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/read"
                className="inline-flex items-center rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#232323]"
              >
                Start reading
              </Link>
              <p className="text-sm text-[#616161]">New articles and long-form notes, updated regularly.</p>
            </div>
          </div>

          <aside className="rounded-2xl border border-[#e2e2e2] bg-white/85 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur">
            <p className="text-xs tracking-[0.2em] text-[#6a6a6a]">WHAT YOU&apos;LL FIND</p>
            <p className="mt-3 text-2xl leading-snug text-black">Clear writing on technology, ideas, and the art of building on the web.</p>
            <div className="mt-6 h-px bg-[#ececec]" />
            <p className="mt-5 text-sm leading-7 text-[#4b4b4b]">
              Thoughtful articles, practical insights, and readable long-form posts designed for focused reading.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default Home;
