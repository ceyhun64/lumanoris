"use client";

/**
 * Pazaryeri Başvurusu — madde 3 (Faz 2 iskeleti).
 *
 * Pazaryeri kaydı artık yalnızca şirketlere açık (GK-8): şahıs şirketleri ve
 * kurumsal şirketler başvurabilir, vergi kaydı olmayan bireyler başvuramaz.
 * Alanlar GK-7'deki listedir; belge yükleme bu turda yok.
 *
 * BİLİNÇLİ OLARAK BACKEND'E BAĞLI DEĞİL: başvuruyu saklayacak tablo ve uç
 * nokta Faz 5'te yazılacak (şema onayı gerekiyor). O zamana kadar gönder
 * düğmesi devre dışı ve nedenini söylüyor; sahte bir "başvurunuz alındı"
 * mesajı gösterilmiyor. Girilen bilgiler hiçbir yere gönderilmiyor ve
 * saklanmıyor.
 *
 * Bu route; Ayarlar → Ödeme Bilgileri (madde 7), Bakiyem kapısı (madde 4)
 * ve "Pazaryerine Kaydet" pop-up'ının (madde 10) hedefidir.
 */
import { useState } from "react";
import { Building2, Info, Lock, User } from "lucide-react";
import { PageLayout, PageHeader, PageSection } from "@/shared/ui/page-layout";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";

const ACCOUNT_TYPES = [
  {
    id: "sahis",
    label: "Şahıs Şirketi",
    hint: "Vergi levhası olan şahıs işletmeleri",
    icon: User,
  },
  {
    id: "kurumsal",
    label: "Kurumsal Şirket",
    hint: "Limited, anonim ve diğer sermaye şirketleri",
    icon: Building2,
  },
];

const SECTIONS = [
  {
    title: "Şirket Bilgileri",
    fields: [
      { name: "company_title", label: "Ticari unvan", placeholder: "Örn. Örnek Yazılım Ltd. Şti." },
      { name: "tax_number", label: "Vergi numarası", placeholder: "10 haneli VKN (şahıs şirketinde 11 haneli TCKN)", inputMode: "numeric", maxLength: 11 },
      { name: "tax_office", label: "Vergi dairesi", placeholder: "Örn. Kadıköy" },
      { name: "mersis_no", label: "MERSİS numarası", placeholder: "16 haneli MERSİS no", inputMode: "numeric", maxLength: 16 },
    ],
  },
  {
    title: "Yetkili Kişi",
    fields: [
      { name: "authorized_first_name", label: "Yetkili adı" },
      { name: "authorized_last_name", label: "Yetkili soyadı" },
      { name: "authorized_birth_date", label: "Yetkili doğum tarihi", type: "date" },
    ],
  },
  {
    title: "Ödeme ve Adres",
    fields: [
      { name: "iban", label: "IBAN", placeholder: "TR00 0000 0000 0000 0000 0000 00", maxLength: 32 },
      { name: "il", label: "İl" },
      { name: "ilce", label: "İlçe" },
      { name: "address", label: "Açık adres", wide: true },
    ],
  },
];

export default function MarketplaceApplicationPage() {
  const [accountType, setAccountType] = useState("kurumsal");
  const [values, setValues] = useState({});

  const setField = (name, value) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  return (
    <PageLayout>
      <PageHeader
        eyebrow="Pazaryeri"
        title="Pazaryeri Başvurusu"
        description="Pazaryerinde satış yapmak için şirket bilgilerinizle başvurun. Pazaryeri kaydı yalnızca şirketlere açıktır."
      />

      <PageSection>
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-sm leading-relaxed text-amber-100/80">
            Başvuru gönderimi henüz açık değil. Bu formu doldurabilirsiniz, ancak
            girdiğiniz bilgiler şu an hiçbir yere gönderilmez ve saklanmaz.
            Gönderim açıldığında bu sayfadan başvurabileceksiniz.
          </p>
        </div>
      </PageSection>

      <PageSection>
        <h2 className="mb-3 font-display text-base font-semibold text-white">
          Hesap türü
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ACCOUNT_TYPES.map(({ id, label, hint, icon: Icon }) => {
            const active = accountType === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setAccountType(id)}
                aria-pressed={active}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400",
                  active
                    ? "border-fuchsia-400/50 bg-fuchsia-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20",
                )}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" />
                <span>
                  <span className="block text-sm font-semibold text-white">{label}</span>
                  <span className="block text-xs text-white/50">{hint}</span>
                </span>
              </button>
            );
          })}
          {/* Madde 1 / GK-8 / GK-10 — bireysel (vergi kaydı olmayan) kayıt
              kullanım dışı. Seçilemez; yalnızca "Yakında" bilgisini taşır. */}
          <div
            aria-disabled="true"
            className="flex items-start gap-3 rounded-2xl border border-dashed border-white/10 p-4 opacity-60"
          >
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold text-white/70">
                Bireysel
                <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/50">
                  Yakında
                </span>
              </span>
              <span className="block text-xs text-white/40">
                Vergi kaydı olmayan bireysel satıcılar şu an başvuramaz.
              </span>
            </span>
          </div>
        </div>
      </PageSection>

      <form
        onSubmit={(e) => e.preventDefault()}
        noValidate
        className="contents"
      >
        {SECTIONS.map((section) => (
          <PageSection key={section.title}>
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-4 font-display text-base font-semibold text-white">
                  {section.title}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {section.fields.map((f) => (
                    <label
                      key={f.name}
                      className={cn("block", f.wide && "sm:col-span-2")}
                    >
                      <span className="mb-1.5 block text-xs font-medium text-white/60">
                        {f.label}
                      </span>
                      <Input
                        name={f.name}
                        type={f.type || "text"}
                        inputMode={f.inputMode}
                        maxLength={f.maxLength}
                        placeholder={f.placeholder}
                        value={values[f.name] || ""}
                        onChange={(e) => setField(f.name, e.target.value)}
                        autoComplete="off"
                      />
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </PageSection>
        ))}

        <PageSection>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/45">
              Başvurunuz ekibimiz tarafından incelenir. İnceleme, satış yapma
              yetkisini tek başına açmaz.
            </p>
            <Button type="submit" disabled title="Başvuru gönderimi henüz açık değil">
              Başvuruyu Gönder
            </Button>
          </div>
        </PageSection>
      </form>
    </PageLayout>
  );
}
