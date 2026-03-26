import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Wallet, ArrowRight, AlertCircle, CheckCircle2, Globe } from "lucide-react";
import { register } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES, getCurrencyByCountry } from "@/lib/currencies";

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    country: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const passwordStrength = (pw: string) => {
    if (pw.length === 0) return 0;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = passwordStrength(form.password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Excellent"][strength] || "";
  const strengthColor = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"][strength] || "";

  const selectedCurrency = form.country ? getCurrencyByCountry(form.country) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.username || !form.password || !form.country) {
      setError("Please fill in all fields including your country.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register({
        name: form.name,
        email: form.email,
        username: form.username,
        password: form.password,
        country: form.country
      });

      toast({
        title: "Account created!",
        description: "Welcome to walletWatch!"
      });

      navigate("/dashboard");

    } catch (err: any) {
      setError("Username already taken. Try another.");
    } finally {
      setLoading(false);
    }
  };

  const textFields = [
    { key: "name", label: "Full Name", type: "text", placeholder: "John Doe", autoComplete: "name" },
    { key: "email", label: "Email Address", type: "email", placeholder: "john@example.com", autoComplete: "email" },
    { key: "username", label: "Username", type: "text", placeholder: "johndoe", autoComplete: "username" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-12">

      <div className="relative w-full max-w-md px-6">

        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
                <Wallet size={20} className="text-white" />
              </div>
              <span className="font-bold text-xl text-foreground">walletWatch</span>
            </div>
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
          <p className="text-muted-foreground">Start your financial journey today</p>
        </div>

        <div className="bg-card border border-card-border rounded-3xl p-8 shadow-2xl">

          <form onSubmit={handleSubmit} className="space-y-4">

            {textFields.map(field => (
              <div key={field.key} className="space-y-1.5">

                <label className="text-sm font-medium text-foreground">
                  {field.label}
                </label>

                <input
                  type={field.type}
                  value={(form as any)[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 border rounded-xl bg-white text-black"
                />

              </div>
            ))}

            {/* COUNTRY SELECTOR */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-foreground">
                Country
              </label>

              <select
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full px-4 py-3 border rounded-xl bg-white text-black"
              >

                <option value="">Select your country</option>

                {COUNTRIES.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}

              </select>

              {selectedCurrency && (
                <p className="text-xs text-muted-foreground">
                  Currency: {selectedCurrency.code} ({selectedCurrency.symbol})
                </p>
              )}

            </div>

            {/* PASSWORD */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-foreground">
                Password
              </label>

              <div className="relative">

                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-3 border rounded-xl bg-white text-black"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-foreground">
                Confirm Password
              </label>

              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className="w-full px-4 py-3 border rounded-xl bg-white text-black"
              />

            </div>

            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

          </form>

        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground">

          Already have an account?

          <Link href="/login">
            <span className="text-blue-500 cursor-pointer ml-1">
              Sign in
            </span>
          </Link>

        </p>

      </div>

    </div>
  );
}