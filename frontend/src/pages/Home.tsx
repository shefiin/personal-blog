const Home = () => {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-emerald-50 via-cyan-50 to-white px-4 py-16">
      <section className="mx-auto max-w-4xl rounded-2xl border border-emerald-100 bg-white/80 p-10 shadow-lg backdrop-blur">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          UrbanFresh
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
          Blog Platform, Built With Microservices
        </h1>
        <p className="max-w-2xl text-slate-600">
          A personal publishing space focused on clean writing and thoughtful updates.
        </p>
      </section>
    </main>
  );
};

export default Home;
