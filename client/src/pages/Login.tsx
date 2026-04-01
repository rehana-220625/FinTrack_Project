import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Wallet, ArrowRight, AlertCircle } from "lucide-react";
import { login } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      toast({ title: "Welcome back!", description: "You're now logged in." });
      navigate("/dashboard");
    } catch (err: any) {
      setError("Invalid email or password. Try alex@walletwatch.app / demo123");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-6 py-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
                <Wallet size={20} className="text-white" />
              </div>
              <span className="font-bold text-xl text-foreground">walletWatch</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to your account to continue</p>
        </motion.div>

        {/* Demo hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center"
        >
          <p className="text-xs text-blue-400">
            Demo account: <strong>alex@walletwatch.app</strong> / <strong>demo123</strong>
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-card-border rounded-3xl p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Email Address
              </label>
              <div className={`relative rounded-xl border transition-all duration-200 ${
                focused === "email" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-input"
              } bg-background`}>
                <input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none rounded-xl"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <div className={`relative rounded-xl border transition-all duration-200 ${
                focused === "password" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-input"
              } bg-background`}>
                <input
                  id="password"
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none rounded-xl"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  data-testid="button-toggle-password"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              data-testid="button-login"
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Register link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 text-sm text-muted-foreground"
        >
          Don't have an account?{" "}
          <Link href="/register">
            <span data-testid="link-register" className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer transition-colors">
              Create one free
            </span>
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
