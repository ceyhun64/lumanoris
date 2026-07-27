import { Receipt } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import TransactionRow from "./TransactionRow";

export default function TransactionsPanel({ loading, transactions }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl border border-white/5" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-900/20 backdrop-blur-xl">
        <EmptyState
          icon={Receipt}
          title="İşlem Bulunamadı"
          description="Bu kategoride henüz herhangi bir finansal işlem kaydı bulunmuyor."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <TransactionRow key={tx.key} tx={tx} />
      ))}
    </div>
  );
}
