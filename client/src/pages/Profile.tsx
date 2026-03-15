import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Mail, Lock, LogOut, Save, Edit3, Camera, Check, Eye, EyeOff, Globe, DollarSign } from "lucide-react";
import { Layout } from "@/components/Layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { logout } from "@/lib/auth";
import { useLocation } from "wouter";
import { COUNTRIES, getCurrencyByCountry } from "@/lib/currencies";

export default function Profile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: user, isLoading } = useQuery<any>({ queryKey: ["/api/auth/me"] });

  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", country: "" });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/api/auth/profile", data).then(r => r.json()),
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      setEditing(false);
      toast({ title: "Profile updated!", description: "Your profile has been saved." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" }),
  });

  const handleEditStart = () => {
    setProfileForm({ name: user?.name || "", email: user?.email || "", country: user?.country || "" });
    setEditing(true);
  };

  const selectedCurrency = profileForm.country ? getCurrencyByCountry(profileForm.country) : null;

  const handleSaveProfile = () => {
    if (!profileForm.name || !profileForm.email) return;
    updateMutation.mutate({ name: profileForm.name, email: profileForm.email, country: profileForm.country || undefined });
  };

  const handleSavePassword = () => {
    if (passwordForm.password !== passwordForm.confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match.", variant: "destructive" });
      return;
    }
    if (passwordForm.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ password: passwordForm.password });
    setPasswordForm({ password: "", confirmPassword: "" });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast({ title: "Logged out", description: "See you soon!" });
  };

  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        {/* Avatar card */}
        <motion.div
          data-gravity
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-card-border rounded-2xl p-6"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                {initials}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={20} className="text-white" />
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-foreground" data-testid="text-user-name">{user?.name}</h2>
              <p className="text-muted-foreground text-sm mt-0.5" data-testid="text-user-email">{user?.email}</p>
              <p className="text-muted-foreground text-xs mt-1">@{user?.username}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                <span className="text-xs text-emerald-400 font-medium">Active Account</span>
              </div>
            </div>
            <button
              data-testid="button-logout-profile"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all text-sm font-medium"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {(["profile", "security"] as const).map(tab => (
            <button
              key={tab}
              data-testid={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "profile" ? "Profile Info" : "Security"}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === "profile" && (
          <motion.div
            data-gravity
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-card-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-foreground">Personal Information</h3>
              {!editing ? (
                <button
                  data-testid="button-edit-profile"
                  onClick={handleEditStart}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all text-sm"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-2 rounded-xl border border-input text-muted-foreground hover:bg-accent text-sm"
                  >
                    Cancel
                  </button>
                  <motion.button
                    data-testid="button-save-profile"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSaveProfile}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold shadow-lg"
                  >
                    {updateMutation.isPending ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : <Save size={14} />}
                    Save
                  </motion.button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User size={14} />
                  Full Name
                </label>
                {editing ? (
                  <input
                    data-testid="input-profile-name"
                    value={profileForm.name}
                    onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <p className="px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm">{user?.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail size={14} />
                  Email Address
                </label>
                {editing ? (
                  <input
                    data-testid="input-profile-email"
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <p className="px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm">{user?.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User size={14} />
                  Username
                </label>
                <p className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm">@{user?.username}</p>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Globe size={14} />
                  Country
                </label>
                {editing ? (
                  <div>
                    <select
                      data-testid="select-profile-country"
                      value={profileForm.country}
                      onChange={e => setProfileForm(f => ({ ...f, country: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select country</option>
                      {COUNTRIES.map(c => (
                        <option key={c.country} value={c.country}>{c.country}</option>
                      ))}
                    </select>
                    {selectedCurrency && (
                      <p className="text-xs text-muted-foreground mt-1 pl-1">
                        Currency will change to{" "}
                        <span className="font-semibold text-blue-400">
                          {selectedCurrency.name} ({selectedCurrency.symbol})
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm">{user?.country || "Not set"}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign size={14} />
                  Currency
                </label>
                <div className="px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm flex items-center gap-2">
                  <span className="font-bold text-blue-400 text-base">{user?.currencySymbol || "$"}</span>
                  <span>{user?.currency || "USD"}</span>
                  {user?.country && (
                    <span className="text-muted-foreground text-xs">— {user?.country}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Security tab */}
        {activeTab === "security" && (
          <motion.div
            data-gravity
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-card-border rounded-2xl p-6"
          >
            <h3 className="font-semibold text-foreground mb-5">Change Password</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New Password</label>
                <div className="relative">
                  <input
                    data-testid="input-new-password"
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.password}
                    onChange={e => setPasswordForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-2.5 pr-12 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                <div className="relative">
                  <input
                    data-testid="input-confirm-new-password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Repeat your new password"
                    className="w-full px-4 py-2.5 pr-12 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  {passwordForm.confirmPassword && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {passwordForm.confirmPassword === passwordForm.password
                        ? <Check size={15} className="text-emerald-400" />
                        : <span className="text-xs text-destructive">!</span>
                      }
                    </div>
                  )}
                </div>
              </div>
              <motion.button
                data-testid="button-change-password"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSavePassword}
                disabled={!passwordForm.password || updateMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <Lock size={15} />}
                Update Password
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Danger zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-destructive/20 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-foreground mb-1">Sign Out</h3>
          <p className="text-sm text-muted-foreground mb-4">You'll need to sign in again to access your account.</p>
          <button
            data-testid="button-logout"
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-all text-sm font-medium"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </motion.div>
      </div>
    </Layout>
  );
}
