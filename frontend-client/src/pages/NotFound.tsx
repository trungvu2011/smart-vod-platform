import { Link } from "react-router-dom";
import { Video, Home } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 text-center px-4">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-surface-dark shadow-2xl shadow-black/50">
        <Video className="h-12 w-12 text-text-secondary" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-6xl font-black text-white tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold text-white">Page not found</h2>
        <p className="text-text-secondary max-w-md mt-2">
          The page you are looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link
        to="/"
        className="mt-4 flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
      >
        <Home className="h-5 w-5" />
        Back to Home
      </Link>
    </div>
  );
}
