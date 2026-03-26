import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Repeat, Calendar, CheckCircle } from "lucide-react";
import { Layout } from "@/components/Layout";

type Subscription = {
  id: string;
  name: string;
  amount: number;
  category: string;
  billingCycle: string;
  lastPaymentDate: string;
  nextPaymentDate: string;
};

export default function SubscriptionsPage() {
  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
  });
  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/me"] });
  const sym = user?.currencySymbol || "$";

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscriptions Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Automatically detected recurring payments</p>
        </div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-8 border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-violet-500/10"
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 bg-indigo-500 transform translate-x-1/2 -translate-y-1/2" />
          
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Monthly Spend</p>
              <h2 className="text-4xl font-bold text-foreground mb-1">
                {sym}{totalMonthly.toFixed(2)}
              </h2>
              <p className="text-sm text-foreground/80 flex items-center gap-2">
                <Repeat size={14} className="text-indigo-400" />
                Across {subscriptions.length} active subscriptions
              </p>
            </div>
          </div>
        </motion.div>

        {/* Subscriptions List */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Active Subscriptions</h2>
          
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-12 bg-card border border-card-border rounded-2xl">
              <Repeat size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-foreground font-medium">No subscriptions detected</p>
              <p className="text-sm text-muted-foreground mt-1">Recurring identical payments will automatically appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptions.map((sub, i) => {
                const isUpcoming = new Date(sub.nextPaymentDate).getTime() < new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
                
                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card border border-card-border rounded-2xl p-5 hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Repeat size={24} />
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{sym}{sub.amount.toFixed(2)}</p>
                        <p className="text-xs font-medium text-muted-foreground uppercase">{sub.billingCycle}</p>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-foreground text-lg mb-1">{sub.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{sub.category}</p>
                    
                    <div className="bg-accent/50 rounded-xl p-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-muted-foreground" />
                        <span className="text-muted-foreground">Next payment</span>
                      </div>
                      <span className={`font-semibold ${isUpcoming ? "text-orange-400" : "text-foreground"}`}>
                        {new Date(sub.nextPaymentDate).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
