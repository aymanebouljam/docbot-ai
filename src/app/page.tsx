const suggestedPrompts = [
  "What are the symptoms of anemia?",
  "What does elevated ALT usually mean?",
  "How is high blood pressure managed?",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#e0f2fe_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between rounded-box border border-info/20 bg-base-100/80 px-5 py-4 shadow-sm backdrop-blur">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-info">
              DocBot AI
            </p>
            <h1 className="text-2xl font-semibold text-base-content">
              Medical-only chat assistant
            </h1>
          </div>
          <span className="badge badge-outline badge-info">Slice 0</span>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-xl shadow-sky-100/80">
            <div className="mb-6 space-y-3">
              <p className="text-sm font-medium text-info">Safety-first experience</p>
              <h2 className="text-4xl font-semibold tracking-tight text-balance">
                Ask about symptoms, medications, conditions, prevention, or lab results.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-base-content/70">
                DocBot AI is being built as a focused medical chatbot. It should
                not replace a clinician, and urgent symptoms should be evaluated
                by emergency services or a licensed medical professional.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="card border border-base-200 bg-base-200/60">
                <div className="card-body gap-3">
                  <h3 className="card-title text-lg">Supported topics</h3>
                  <p className="text-sm leading-6 text-base-content/70">
                    Symptoms, diagnoses, medications, prevention, lab concepts,
                    anatomy, and public-health questions framed medically.
                  </p>
                </div>
              </article>
              <article className="card border border-warning/30 bg-warning/10">
                <div className="card-body gap-3">
                  <h3 className="card-title text-lg">Important disclaimer</h3>
                  <p className="text-sm leading-6 text-base-content/80">
                    This app provides educational guidance only and does not
                    diagnose or replace professional medical care.
                  </p>
                </div>
              </article>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-base-300 bg-base-100/95 p-6 shadow-lg">
            <div className="mb-5">
              <p className="text-sm font-medium text-info">Suggested prompts</p>
              <h2 className="mt-2 text-xl font-semibold">Smoke-test home screen</h2>
            </div>

            <div className="space-y-3">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="btn btn-outline btn-info h-auto min-h-0 justify-start whitespace-normal px-4 py-3 text-left font-normal"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="divider" />

            <div className="rounded-box border border-base-200 bg-base-200/60 p-4">
              <p className="text-sm font-medium text-base-content">
                Scope reminder
              </p>
              <p className="mt-2 text-sm leading-6 text-base-content/70">
                Non-medical questions will be redirected to a gentle fallback in
                later slices so the product stays focused and safe.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
