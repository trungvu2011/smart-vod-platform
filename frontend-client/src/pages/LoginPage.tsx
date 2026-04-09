import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Play } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-slide-up">
      {/* Mobile logo */}
      <div className="lg:hidden text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-wp-gradient mx-auto flex items-center justify-center mb-4">
          <Play size={22} className="text-wp-on-primary fill-current" />
        </div>
        <h1 className="text-2xl font-bold text-wp-on-surface">WayPoint</h1>
        <p className="text-sm text-wp-on-surface-variant mt-1">
          Enterprise Video Platform
        </p>
      </div>

      <div className="bg-wp-surface-container rounded-wp-xl p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-wp-on-surface">
            Sign in to WayPoint
          </h2>
          <p className="text-sm text-wp-on-surface-variant mt-1">
            Access your organization's video library
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-wp-on-surface-variant mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="elena@waypoint.com"
              className="w-full px-4 py-3 bg-wp-surface-lowest rounded-wp text-sm text-wp-on-surface
                placeholder-wp-outline focus:outline-none focus:bg-wp-surface-container-highest
                focus:shadow-wp-glow transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-wp-on-surface-variant mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-11 bg-wp-surface-lowest rounded-wp text-sm text-wp-on-surface
                  placeholder-wp-outline focus:outline-none focus:bg-wp-surface-container-highest
                  focus:shadow-wp-glow transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-wp-outline hover:text-wp-on-surface"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="text-right mt-1.5">
              <a
                href="#"
                className="text-xs text-wp-primary hover:text-wp-primary-fixed transition-colors"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-wp-on-primary/30 border-t-wp-on-primary rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-wp-outline-variant/15" />
          <span className="text-[11px] text-wp-outline font-medium uppercase tracking-wide">
            or continue with
          </span>
          <div className="h-px flex-1 bg-wp-outline-variant/15" />
        </div>

        {/* Google Sign-In */}
        <button
          onClick={() => {
            // TODO: Implement Google OAuth
            login("google@waypoint.com", "");
            navigate("/");
          }}
          className="w-full flex items-center justify-center gap-3 px-4 py-3
            bg-wp-surface-lowest rounded-wp text-sm font-medium text-wp-on-surface
            hover:bg-wp-surface-container-highest hover:shadow-wp-glow
            transition-all duration-200 active:scale-[0.98]"
        >
          {/* Google "G" Logo */}
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          Sign in with Google
        </button>

        <p className="text-center text-xs text-wp-outline">
          Don't have an account?{" "}
          <a
            href="#"
            className="text-wp-primary hover:text-wp-primary-fixed transition-colors font-medium"
          >
            Contact your IT admin
          </a>
        </p>
      </div>

      <div className="flex justify-center gap-4 mt-6 text-xs text-wp-outline">
        <a
          href="#"
          className="hover:text-wp-on-surface-variant transition-colors"
        >
          Security
        </a>
        <a
          href="#"
          className="hover:text-wp-on-surface-variant transition-colors"
        >
          Privacy Policy
        </a>
        <a
          href="#"
          className="hover:text-wp-on-surface-variant transition-colors"
        >
          Terms of Service
        </a>
      </div>
      <p className="text-center text-[11px] text-wp-outline/50 mt-3">
        © 2026 WayPoint Enterprise Video
      </p>
    </div>
  );
}
