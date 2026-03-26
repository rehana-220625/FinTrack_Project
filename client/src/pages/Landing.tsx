import { useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion, useInView, useAnimation } from "framer-motion";
import {
  Wallet, TrendingUp, Shield, PieChart, BarChart3, Smartphone,
  ArrowRight, Star, CheckCircle, Twitter, Github, Linkedin, Globe
} from "lucide-react";
import { ParticleBackground } from "@/components/ParticleBackground";
import { useTheme } from "@/components/ThemeProvider";

function AnimatedCounter({ end, prefix = "", suffix = "" }: { end: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (inView) {
      let start = 0;
      const duration = 2000;
      const step = end / (duration / 16);
      const timer = setInterval(() => {
        start += step;
        if (start >= end) {
          start = end;
          clearInterval(timer);
        }
        if (ref.current) {
          ref.current.textContent = prefix + Math.floor(start).toLocaleString() + suffix;
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [inView, end, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

const features = [
  {
    icon: TrendingUp,
    title: "Smart Analytics",
    description: "Visual charts and insights to understand your spending patterns and trends.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: PieChart,
    title: "Category Breakdown",
    description: "See exactly where your money goes with detailed category analysis.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Shield,
    title: "Budget Control",
    description: "Set monthly budgets and get alerts when you're approaching your limit.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Monthly Reports",
    description: "Export detailed PDF and CSV reports for better financial planning.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: Smartphone,
    title: "Responsive Design",
    description: "Access your finances anytime, anywhere on any device.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Wallet,
    title: "Real-time Updates",
    description: "Instant updates as you add expenses with live balance calculations.",
    gradient: "from-indigo-500 to-blue-500",
  },
];

const stats = [
  { value: 50000, label: "Active Users", suffix: "+" },
  { value: 2, label: "Million in tracked", prefix: "$", suffix: "M+" },
  { value: 98, label: "Satisfaction Rate", suffix: "%" },
  { value: 150, label: "Countries", suffix: "+" },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Freelance Designer",
    text: "walletWatch transformed how I manage my finances. The visualizations are stunning and the insights are incredibly helpful.",
    rating: 5,
    avatar: "SC",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Marcus Williams",
    role: "Software Engineer",
    text: "Finally an expense tracker that actually looks good! The budget alerts saved me from overspending multiple times.",
    rating: 5,
    avatar: "MW",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    name: "Priya Patel",
    role: "Marketing Manager",
    text: "The reports feature is amazing. I can export everything for my accountant in seconds. Highly recommended!",
    rating: 5,
    avatar: "PP",
    gradient: "from-emerald-500 to-teal-500",
  },
];

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ParticleBackground />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Wallet size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">walletWatch</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Stats</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <motion.div
                data-testid="link-login-nav"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-4 py-2"
              >
                Log in
              </motion.div>
            </Link>
            <Link href="/register">
              <motion.div
                data-testid="link-register-nav"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="text-sm font-semibold bg-gradient-to-r from-blue-500 to-violet-600 text-white px-5 py-2 rounded-xl shadow-lg shadow-blue-500/25 cursor-pointer hover:shadow-blue-500/40 transition-all"
              >
                Get Started
              </motion.div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-8"
            >
              <Star size={14} className="fill-current" />
              Rated #1 Budget App of 2026
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight tracking-tight">
              <span className="text-foreground">Take Control of</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Your Expenses
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              The most beautiful and powerful expense tracking app. Visualize spending, crush your budget goals, and achieve financial freedom.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <motion.div
                  data-testid="button-hero-register"
                  whileHover={{ scale: 1.04, boxShadow: "0 20px 40px rgba(59,130,246,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-violet-600 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-blue-500/30 cursor-pointer transition-all w-full sm:w-auto justify-center"
                >
                  Start for Free
                  <ArrowRight size={20} />
                </motion.div>
              </Link>
              <Link href="/login">
                <motion.div
                  data-testid="button-hero-login"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 px-8 py-4 bg-card border border-card-border text-foreground font-semibold text-lg rounded-2xl cursor-pointer hover:border-blue-500/50 transition-all w-full sm:w-auto justify-center"
                >
                  Sign In
                </motion.div>
              </Link>
              <Link href="/login">
                <motion.div
                  data-testid="button-hero-demo"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 px-8 py-4 border border-violet-500/40 bg-violet-500/10 text-violet-400 font-semibold text-lg rounded-2xl cursor-pointer hover:border-violet-500/60 hover:bg-violet-500/20 transition-all w-full sm:w-auto justify-center"
                >
                  Try Demo
                </motion.div>
              </Link>
            </div>
          </motion.div>

          {/* Floating cards preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { label: "Total Expenses", value: "$1,247", change: "+12%", color: "blue" },
                { label: "Monthly Budget", value: "$2,000", change: "62% used", color: "violet" },
                { label: "Savings", value: "$753", change: "+8.3%", color: "emerald" },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="bg-card/80 backdrop-blur-xl border border-card-border rounded-2xl p-4 text-left shadow-xl"
                >
                  <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                  <p className={`text-xl font-bold ${card.color === "blue" ? "text-blue-400" : card.color === "violet" ? "text-violet-400" : "text-emerald-400"}`}>
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-24 relative" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl font-bold text-foreground mb-2">
                  <AnimatedCounter end={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything you need to
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent"> succeed</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to give you complete control over your financial life.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group p-6 bg-card border border-card-border rounded-2xl hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 relative" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">Loved by thousands</h2>
            <p className="text-muted-foreground">See what our users have to say</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="p-6 bg-card border border-card-border rounded-2xl"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-cyan-500/20 border border-blue-500/20 backdrop-blur-xl"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Ready to take control?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of users who have transformed their financial habits.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <motion.div
                  data-testid="button-cta-register"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-violet-600 text-white font-bold rounded-2xl shadow-2xl shadow-blue-500/30 cursor-pointer hover:shadow-blue-500/50 transition-all"
                >
                  <CheckCircle size={20} />
                  Create Free Account
                </motion.div>
              </Link>
              <Link href="/login">
                <motion.div
                  data-testid="button-cta-demo"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-4 border border-white/20 text-foreground font-semibold rounded-2xl cursor-pointer hover:bg-white/5 transition-all"
                >
                  Try Demo (demo / demo123)
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border py-12 relative" style={{ zIndex: 1 }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <Wallet size={14} className="text-white" />
              </div>
              <span className="font-bold text-foreground">walletWatch</span>
              <span className="text-muted-foreground text-sm ml-2">© 2026 All rights reserved</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</a>
            </div>
            <div className="flex items-center gap-3">
              {[Twitter, Github, Linkedin, Globe].map((Icon, i) => (
                <motion.a
                  key={i}
                  whileHover={{ scale: 1.2, y: -2 }}
                  href="#"
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
