export default function PricingLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-zinc-400 text-sm animate-pulse">
        Planlar yükleniyor, lütfen bekleyin...
      </p>
    </div>
  );
}
