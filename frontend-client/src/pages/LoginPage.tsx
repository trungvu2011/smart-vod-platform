import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Play } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "ADMIN" ? "/admin/dashboard" : "/", {
        replace: true,
      });
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setErrorMessage("Invalid email or password.");
        } else if (err.response?.status === 400) {
          setErrorMessage("Please enter both email and password.");
        } else {
          setErrorMessage("Sign in failed. Please try again.");
        }
      } else {
        setErrorMessage("Sign in failed. Please try again.");
      }
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
          {errorMessage ? (
            <div className="rounded-wp border border-red-500/25 bg-red-500/12 px-3 py-2 text-sm text-red-300">
              {errorMessage}
            </div>
          ) : null}

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
