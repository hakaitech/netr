import { ErrorBoundary } from "solid-js";
import Dashboard from "./shell/Dashboard";

function ErrorFallback(err: unknown) {
  return (
    <div class="flex h-screen w-screen items-center justify-center bg-surface-0 text-text-primary">
      <div class="max-w-md rounded-lg border border-danger bg-surface-1 p-6">
        <h1 class="mb-2 text-lg font-semibold text-danger">
          Something went wrong
        </h1>
        <p class="text-sm text-text-secondary">
          {err instanceof Error ? err.message : "An unexpected error occurred."}
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallback={(err) => <ErrorFallback {...err} />}>
      <Dashboard />
    </ErrorBoundary>
  );
}
