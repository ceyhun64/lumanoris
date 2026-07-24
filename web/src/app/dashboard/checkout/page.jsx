"use client"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveCoverSrc } from "@/shared/lib/image";
import {
  ArrowLeft,
  Trash2,
  ShoppingBag,
  ShieldCheck,
  Lock,
  CreditCard,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Clock,
  Zap,
  Info,
  BadgePercent,
} from "lucide-react";

const CURRENCY_SYMBOL = "$";

function luhnCheck(digits) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function validateCard(card) {
  const number = (card.number || "").replace(/\D/g, "");
  const [month, year] = (card.expiry || "").split("/").map((v) => parseInt(v, 10));
  const cvv = (card.cvv || "").replace(/\D/g, "");
  const holderName = (card.holderName || "").trim();

  if (!holderName) return "Cardholder name is required.";
  if (number.length < 13 || number.length > 19 || !luhnCheck(number)) {
    return "Card number is invalid.";
  }
  if (!month || !year || month < 1 || month > 12) return "Expiry date is invalid.";
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return "This card has expired.";
  }
  if (!/^\d{3,4}$/.test(cvv)) return "CVV is invalid.";
  return null;
}

export default function Checkout() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [userId, setUserId] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [confirmedItems, setConfirmedItems] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [cardInfo, setCardInfo] = useState({ number: "", expiry: "", cvv: "", holderName: "" });
  const [cardError, setCardError] = useState(null);
  const [paying, setPaying] = useState(false);

  const showToast = (title, description, variant = "default") => {
    setToastMessage({ title, description, variant });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/sessioncheck.php", { credentials: "include" });
        const result = await res.json();
        setUserId(result.authenticated ? result.user_id : null);
      } catch (err) {
        setUserId(null);
      } finally {
        setSessionChecked(true);
      }
    }
    checkSession();
  }, []);

  useEffect(() => {
    if (!sessionChecked) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    async function fetchCart() {
      try {
        const res = await fetch("/api/marketplace/getcart.php", { credentials: "include" });
        const result = await res.json();
        const rows = Array.isArray(result?.cart) ? result.cart : [];
        setCartItems(
          rows.map((row) => {
            const weeklyPrice = Number(row.price) || 0;
            return {
              id: row.id,
              chatbot_id: row.chatbot_id,
              title: row.title,
              description: row.category ? `Category: ${row.category}` : "",
              image: resolveCoverSrc(row.image),
              price: weeklyPrice,
              monthlyPrice: Number(row.monthlyPrice) || weeklyPrice * 4,
              duration_weeks: Number(row.order_weeks) || 4,
            };
          }),
        );
      } catch (err) {
        console.error("Cart fetch error:", err);
        showToast("Error", "Could not load your cart.", "destructive");
      } finally {
        setLoading(false);
      }
    }
    fetchCart();
  }, [sessionChecked, userId]);

  const handleRemove = async (cartId) => {
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({ id: cartId }));
      const res = await fetch("/api/marketplace/deletecart.php", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (!result.success) {
        showToast("Error", result.message || "Could not remove item from cart.", "destructive");
        return;
      }
      setCartItems((prev) => prev.filter((item) => item.id !== cartId));
      showToast(
        "Item Removed",
        "Successfully removed model license from your cart.",
        "default",
      );
    } catch (error) {
      console.error("Removal error:", error);
      showToast("Error", "Could not remove item from cart.", "destructive");
    }
  };

  const handleConfirm = () => {
    if (cartItems.length === 0) return;
    setConfirmedItems(cartItems);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePayment = async () => {
    const validationError = validateCard(cardInfo);
    if (validationError) {
      setCardError(validationError);
      return;
    }
    setCardError(null);
    setPaying(true);
    try {
      const payload = {
        items: confirmedItems.map((item) => ({
          chatbot_id: item.chatbot_id,
          duration_weeks: item.duration_weeks || 4,
        })),
        card: {
          number: cardInfo.number.replace(/\s/g, ""),
          expiry: cardInfo.expiry,
          cvv: cardInfo.cvv,
          holder_name: cardInfo.holderName.trim(),
        },
        use_3d: false,
      };
      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      const res = await fetch("/api/marketplace/createsubscription.php", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await res.json();
      if (result.success) {
        showToast(
          "Order Successful!",
          "Your AI models have been provisioned instantly.",
          "default",
        );
        setCartItems([]);
        setConfirmedItems([]);
        setCardInfo({ number: "", expiry: "", cvv: "", holderName: "" });
        setStep(1);
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        showToast("Payment Failed", result.message || "Could not process payment.", "destructive");
      }
    } catch (error) {
      console.error("Payment error:", error);
      showToast("Error", "Could not reach the payment server.", "destructive");
    } finally {
      setPaying(false);
    }
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * (item.duration_weeks || 1),
    0,
  );
  const tax = subtotal * 0.08;
  const total = Math.max(0, subtotal - discount + tax);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 md:p-12 flex items-center justify-center font-sans">
        <div className="w-full max-w-4xl space-y-6 animate-pulse">
          <div className="h-8 w-32 bg-zinc-800 rounded-lg" />
          <div className="h-12 w-64 bg-zinc-800 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="md:col-span-2 space-y-4">
              <div className="h-36 bg-zinc-900 rounded-2xl border border-zinc-800" />
              <div className="h-36 bg-zinc-900 rounded-2xl border border-zinc-800" />
            </div>
            <div className="h-72 bg-zinc-900 rounded-2xl border border-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200 font-sans relative overflow-x-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-indigo-600/10 via-purple-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl ${
              toastMessage.variant === "destructive"
                ? "bg-red-950/80 border-red-800/60 text-red-200"
                : "bg-zinc-900/90 border-zinc-700/60 text-zinc-100"
            }`}
          >
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold">{toastMessage.title}</p>
              <p className="text-caption text-zinc-400">
                {toastMessage.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {}
      <header className="px-6 pt-10 pb-6 flex items-center justify-between relative z-10">
        <button
          type="button"
          onClick={() => (step === 2 ? setStep(1) : window.history.back())}
          className="group flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-all bg-zinc-900/50 hover:bg-zinc-800/80 px-3.5 py-2 rounded-xl border border-zinc-800/80 backdrop-blur-md shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>{step === 2 ? "Return to Cart" : "Back to Marketplace"}</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800/80 text-caption text-zinc-400 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Secure 256-bit TLS Session</span>
        </div>
      </header>

      {}
      <main className="px-6 pb-24 relative z-10">
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2026 Enterprise Provisioning</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            {step === 1 ? "Review Your Cart" : "Confirm Subscription & Payment"}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {step === 1
              ? "Manage your selected AI models and licenses prior to deployment."
              : `Finalizing provision for ${confirmedItems.length} active model instance${confirmedItems.length > 1 ? "s" : ""}.`}
          </p>
        </div>

        {}
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-800/60">
          <div
            className={`flex items-center gap-2 text-xs font-semibold ${step >= 1 ? "text-indigo-400" : "text-zinc-500"}`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-caption border ${step >= 1 ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300" : "border-zinc-800 bg-zinc-900 text-zinc-500"}`}
            >
              1
            </span>
            <span>Cart Summary</span>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-700" />
          <div
            className={`flex items-center gap-2 text-xs font-semibold ${step >= 2 ? "text-indigo-400" : "text-zinc-500"}`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-caption border ${step >= 2 ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300" : "border-zinc-800 bg-zinc-900 text-zinc-500"}`}
            >
              2
            </span>
            <span>Secure Checkout</span>
          </div>
        </div>

        {}
        {cartItems.length === 0 && step === 1 ? (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-12 text-center backdrop-blur-xl max-w-xl mx-auto my-12 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto mb-5 text-zinc-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Your cart is currently empty
            </h3>
            <p className="text-sm text-zinc-400 mb-8 max-w-sm mx-auto">
              Explore our marketplace to discover high-performance cognitive
              models and developer suites.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Browse Marketplace
            </button>
          </div>
        ) : step === 1 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900/90 p-5 backdrop-blur-xl transition-all duration-300 hover:border-zinc-700/80 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="relative w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/50">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 text-caption font-medium text-zinc-300 border border-zinc-700/40">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          {item.duration_weeks} Weeks Access
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white tracking-tight truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80 gap-3">
                      <div className="text-right">
                        <span className="text-lg font-bold text-white">
                          {CURRENCY_SYMBOL}
                          {(item.price * (item.duration_weeks || 1)).toFixed(2)}
                        </span>
                        <p className="text-caption text-zinc-500">
                          {CURRENCY_SYMBOL}
                          {item.price.toFixed(2)} / wk
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-2 rounded-lg bg-zinc-800/50 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4 sticky top-6">
              <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute -right-12 -top-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  Order Summary
                </h3>

                <div className="space-y-3 pb-4 border-b border-zinc-800/80 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span className="text-zinc-200 font-medium">
                      {CURRENCY_SYMBOL}
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Estimated Tax (8%)</span>
                    <span className="text-zinc-200 font-medium">
                      {CURRENCY_SYMBOL}
                      {tax.toFixed(2)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Discount Applied</span>
                      <span>
                        -{CURRENCY_SYMBOL}
                        {discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 pb-6 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    Total Due
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-bold tracking-tight text-white">
                      {CURRENCY_SYMBOL}
                      {total.toFixed(2)}
                    </span>
                    <p className="text-caption text-zinc-500">
                      Billed securely in USD
                    </p>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="mb-6 flex gap-2">
                  <div className="relative flex-1">
                    <BadgePercent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Promo code (e.g. ENTERPRISE2026)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (promoCode.toUpperCase() === "ENTERPRISE2026") {
                        setDiscount(subtotal * 0.15);
                        showToast(
                          "Promo Applied",
                          "15% enterprise discount activated successfully.",
                          "default",
                        );
                      } else {
                        showToast(
                          "Invalid Code",
                          "Please enter a valid promotion code.",
                          "destructive",
                        );
                      }
                    }}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium transition-colors border border-zinc-700/50"
                  >
                    Apply
                  </button>
                </div>

                <button
                  onClick={handleConfirm}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Proceed to Payment</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-caption text-zinc-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>30-Day Money-Back Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              {/* Confirmed items list recap */}
              <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-2xl">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Verified Provision Items ({confirmedItems.length})
                </h3>

                <div className="space-y-3">
                  {confirmedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {item.title}
                          </p>
                          <p className="text-caption text-zinc-400">
                            {item.duration_weeks} weeks allocation
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">
                        {CURRENCY_SYMBOL}
                        {(item.price * item.duration_weeks).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method Selection Card */}
              <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-2xl">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  Payment Method
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/40 cursor-pointer shadow-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        defaultChecked
                        className="accent-indigo-500"
                      />
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Credit / Debit Card (Stripe Enterprise)
                        </p>
                        <p className="text-caption text-zinc-400">
                          Instant tokenization & automated renewal
                        </p>
                      </div>
                    </div>
                    <Lock className="w-4 h-4 text-indigo-400" />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700 transition-all opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        disabled
                        className="accent-indigo-500"
                      />
                      <div>
                        <p className="text-xs font-semibold text-zinc-300">
                          Corporate Invoice / Wire Transfer
                        </p>
                        <p className="text-caption text-zinc-500">
                          Coming soon for verified orgs
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Card details */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Cardholder Name"
                    value={cardInfo.holderName}
                    autoComplete="cc-name"
                    onChange={(e) =>
                      setCardInfo((prev) => ({ ...prev, holderName: e.target.value }))
                    }
                    className="sm:col-span-2 bg-zinc-950/60 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Card Number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={cardInfo.number}
                    onChange={(e) =>
                      setCardInfo((prev) => ({
                        ...prev,
                        number: e.target.value
                          .replace(/\D/g, "")
                          .replace(/(.{4})/g, "$1 ")
                          .trim(),
                      }))
                    }
                    className="sm:col-span-2 bg-zinc-950/60 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    autoComplete="cc-exp"
                    value={cardInfo.expiry}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                      const formatted =
                        digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                      setCardInfo((prev) => ({ ...prev, expiry: formatted }));
                    }}
                    className="bg-zinc-950/60 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    maxLength={4}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={cardInfo.cvv}
                    onChange={(e) =>
                      setCardInfo((prev) => ({
                        ...prev,
                        cvv: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    className="bg-zinc-950/60 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  />
                </div>
                {cardError && (
                  <p className="mt-3 text-xs text-red-400">{cardError}</p>
                )}

                <div className="mt-6 pt-6 border-t border-zinc-800/80">
                  <button
                    onClick={handlePayment}
                    disabled={paying}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {paying
                        ? "Processing..."
                        : `Authorize & Complete Checkout (${CURRENCY_SYMBOL}${total.toFixed(2)})`}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Final Summary Card */}
            <div className="lg:col-span-5 sticky top-6">
              <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-2xl">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Payment Breakdown
                </h3>

                <div className="space-y-3 pb-4 border-b border-zinc-800/80 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Account ID</span>
                    <span className="text-zinc-200 font-mono">{userId}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span className="text-zinc-200 font-medium">
                      {CURRENCY_SYMBOL}
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Tax & Regulatory Compliance</span>
                    <span className="text-zinc-200 font-medium">
                      {CURRENCY_SYMBOL}
                      {tax.toFixed(2)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Enterprise Discount</span>
                      <span>
                        -{CURRENCY_SYMBOL}
                        {discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    Total Charge
                  </span>
                  <span className="text-2xl font-bold tracking-tight text-white">
                    {CURRENCY_SYMBOL}
                    {total.toFixed(2)}
                  </span>
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-caption text-zinc-400 space-y-2">
                  <div className="flex items-center gap-2 text-zinc-300 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Instant Cloud Provisioning</span>
                  </div>
                  <p className="text-zinc-500 leading-relaxed">
                    Upon payment completion, your API keys and cluster endpoints
                    will be initialized immediately in your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
