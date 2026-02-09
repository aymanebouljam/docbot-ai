"use client";

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: RootErrorProps) {
  console.error(error);

  return (
    <main className="grid min-h-screen place-items-center bg-base-200 px-6 py-12">
      <div className="w-full max-w-xl rounded-[2rem] border border-warning/30 bg-base-100 p-8 shadow-xl">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-warning">
          Something Went Wrong
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          DocBot AI hit an unexpected error.
        </h1>
        <p className="mt-4 text-sm leading-7 text-base-content/70">
          Please try reloading the conversation. If the problem continues, try
          again in a moment.
        </p>
        <button
          type="button"
          className="btn btn-warning mt-6 rounded-full px-6"
          onClick={reset}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
