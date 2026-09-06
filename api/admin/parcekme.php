<?php
/**
 * COMP-007 / AUDIT D-01 (BLOCKERS B7'nin KOD yarısı) — Para Çekme Talepleri.
 *
 * NEDEN VAR
 * ---------
 * `WalletController::listWithdrawals()` ve `updateWithdrawalStatus()` yazılmış
 * ve `/api/wallet/list_withdrawals.php` + `/api/wallet/update_withdrawal_status.php`
 * altında yayında olmasına rağmen bunları çağıran HİÇBİR arayüz yoktu. Sonuç:
 * `withdraw()` talebi `beklemede` yazıyor, `computeBalanceAndTransactions()`
 * bekleyen talebi bakiyeden düşüyor ve durumu değiştirecek bir yol
 * bulunmadığı için satıcının parası SÜRESİZ kilitli kalıyordu.
 *
 * Bu sayfa o döngüyü kapatıyor.
 *
 * BU SAYFA PARA GÖNDERMEZ
 * -----------------------
 * Havaleyi yapan bir entegrasyon YOK; buradaki durum değişikliği yalnızca bir
 * KAYIT. `ödendi` işaretlemek "bankadan gönderdim" demektir, "gönder"
 * demek değildir. Operasyonel yarı (talebi kim onaylar, havaleyi kim yapar)
 * hâlâ BLOCKERS B7'de açık duruyor ve bu sayfa onu kapatmaz.
 *
 * Yetki: sayfa `index.php` route tablosundan geliyor, o da `$_SESSION['admin']`
 * kontrolünün arkasında. Ayrıca çağrılan iki uç nokta da kendi içinde
 * `AuthMiddleware::requireAdmin()` çalıştırıyor — yani bu dosya atlansa bile
 * veri korumasız kalmıyor.
 */
?>
<main class="bg-gray-50 p-6 min-h-screen">
    <div class="max-w-screen-xl mx-auto">
        <?php pageTitle(
            "Para Çekme Talepleri",
            "Satıcıların çekim taleplerini buradan görüntüleyip durumlarını güncelleyebilirsiniz."
        ); ?>

        <!-- Bu uyarı DEKORASYON DEĞİL: "ödendi" işaretlemenin para göndermediğini
             operatöre her seferinde hatırlatıyor. Bu ayrım kaybolursa talepler
             ödenmemiş olarak kapatılır. -->
        <div class="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <strong class="font-bold">Dikkat:</strong>
            Bu ekran para göndermez. Havaleyi bankadan siz yaptıktan <em>sonra</em>
            talebi <strong>ödendi</strong> olarak işaretleyin. Durum değişikliği
            yalnızca bir kayıttır.
        </div>

        <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-4">
                <h3 class="text-lg font-bold text-gray-800">Talepler</h3>

                <div class="flex items-center gap-2">
                    <label for="statusFilter" class="text-sm font-medium text-gray-600">Durum:</label>
                    <select id="statusFilter"
                            class="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Tümü</option>
                        <option value="beklemede" selected>Beklemede</option>
                        <option value="onaylandı">Onaylandı</option>
                        <option value="ödendi">Ödendi</option>
                        <option value="reddedildi">Reddedildi</option>
                        <option value="iptal">İptal</option>
                    </select>
                    <button id="refreshBtn" type="button"
                            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition">
                        Yenile
                    </button>
                </div>
            </div>

            <div id="feedback" class="hidden mb-4 rounded-lg px-4 py-3 text-sm"></div>

            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead class="text-xs uppercase text-gray-500 border-b">
                        <tr>
                            <th class="px-3 py-3">#</th>
                            <th class="px-3 py-3">Kullanıcı</th>
                            <th class="px-3 py-3">IBAN</th>
                            <th class="px-3 py-3 text-right">Tutar</th>
                            <th class="px-3 py-3">Talep Tarihi</th>
                            <th class="px-3 py-3">Durum</th>
                            <th class="px-3 py-3">İşlem</th>
                        </tr>
                    </thead>
                    <tbody id="rows" class="divide-y divide-gray-100">
                        <tr><td colspan="7" class="px-3 py-6 text-center text-gray-400">Yükleniyor…</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</main>

<script>
(function () {
    const rowsEl     = document.getElementById('rows');
    const filterEl   = document.getElementById('statusFilter');
    const refreshEl  = document.getElementById('refreshBtn');
    const feedbackEl = document.getElementById('feedback');

    /* Sunucunun kabul ettiği durumlar. WalletController::WITHDRAWAL_STATUSES
       ile ELLE senkron — oradaki liste Türkçe yazımı kullanıyor ("onaylandı",
       "ödendi"); ASCII'ye sadeleştirmek sunucuda "Geçersiz durum" verir. */
    const STATUSES = ['beklemede', 'onaylandı', 'ödendi', 'reddedildi', 'iptal'];

    const BADGE = {
        'beklemede':  'bg-amber-100 text-amber-800',
        'onaylandı':  'bg-blue-100 text-blue-800',
        'ödendi':     'bg-green-100 text-green-800',
        'reddedildi': 'bg-red-100 text-red-800',
        'iptal':      'bg-gray-200 text-gray-700',
    };

    /* Her hücre buradan geçiyor: IBAN, kullanıcı adı ve e-posta kullanıcı
       girdisidir ve doğrudan innerHTML'e yazmak admin panelinde saklı XSS
       olurdu. */
    function esc(value) {
        return String(value ?? '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        })[c]);
    }

    function money(value) {
        const n = Number(value);
        return Number.isFinite(n)
            ? n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
            : esc(value);
    }

    function say(message, ok) {
        feedbackEl.textContent = message;
        feedbackEl.className = 'mb-4 rounded-lg px-4 py-3 text-sm '
            + (ok ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200');
        feedbackEl.classList.remove('hidden');
    }

    function clearSay() {
        feedbackEl.classList.add('hidden');
    }

    function statusOptions(current) {
        return STATUSES.map((s) =>
            `<option value="${esc(s)}"${s === current ? ' selected' : ''}>${esc(s)}</option>`
        ).join('');
    }

    function render(requests) {
        if (!requests.length) {
            rowsEl.innerHTML =
                '<tr><td colspan="7" class="px-3 py-6 text-center text-gray-400">Bu filtreye uyan talep yok.</td></tr>';
            return;
        }

        rowsEl.innerHTML = requests.map((r) => `
            <tr data-id="${esc(r.id)}">
                <td class="px-3 py-3 text-gray-500">${esc(r.id)}</td>
                <td class="px-3 py-3">
                    <div class="font-medium text-gray-900">${esc(r.kullanici_adi)}</div>
                    <div class="text-xs text-gray-500">${esc(r.eposta)}</div>
                </td>
                <td class="px-3 py-3 font-mono text-xs">${esc(r.iban)}</td>
                <td class="px-3 py-3 text-right font-semibold">${money(r.miktar)}</td>
                <td class="px-3 py-3 text-gray-500">${esc(r.created_at)}</td>
                <td class="px-3 py-3">
                    <span class="rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE[r.durum] || 'bg-gray-100 text-gray-700'}">
                        ${esc(r.durum)}
                    </span>
                </td>
                <td class="px-3 py-3">
                    <div class="flex items-center gap-2">
                        <select class="statusSelect border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white">
                            ${statusOptions(r.durum)}
                        </select>
                        <button type="button"
                                class="saveBtn rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black transition">
                            Kaydet
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async function load() {
        clearSay();
        rowsEl.innerHTML =
            '<tr><td colspan="7" class="px-3 py-6 text-center text-gray-400">Yükleniyor…</td></tr>';

        const status = filterEl.value;
        const url = '/api/wallet/list_withdrawals.php'
            + (status ? ('?status=' + encodeURIComponent(status)) : '');

        try {
            const res  = await fetch(url, { credentials: 'same-origin' });
            const json = await res.json();

            /* Uç nokta yetki hatasında da JSON döndürüyor (403 +
               success:false), yani res.ok'a bakmak yetmez — zarfı okuyoruz. */
            if (!json.success) {
                rowsEl.innerHTML =
                    '<tr><td colspan="7" class="px-3 py-6 text-center text-gray-400">—</td></tr>';
                say(json.message || 'Talepler alınamadı.', false);
                return;
            }

            render(json.requests || []);
        } catch (err) {
            rowsEl.innerHTML =
                '<tr><td colspan="7" class="px-3 py-6 text-center text-gray-400">—</td></tr>';
            say('Sunucuya bağlanılamadı.', false);
        }
    }

    async function save(id, durum, button) {
        /* "ödendi" gerçek bir para hareketi beyanı; yanlışlıkla tıklanmasın
           diye tek onay adımı var. Diğer geçişler geri alınabilir. */
        if (durum === 'ödendi' &&
            !confirm(id + ' numaralı talep için havaleyi BANKADAN yaptınız mı?\n\n'
                     + 'Bu işaret yalnızca kayıt tutar, para göndermez.')) {
            return;
        }

        button.disabled = true;
        const original = button.textContent;
        button.textContent = '…';

        try {
            /* Uç nokta gövdeyi `$_POST['data']` içinde JSON olarak bekliyor
               (`json_decode($_POST['data'])`) — düz JSON body okumuyor. */
            const body = new FormData();
            body.append('data', JSON.stringify({ id: id, durum: durum }));

            const res  = await fetch('/api/wallet/update_withdrawal_status.php', {
                method: 'POST',
                credentials: 'same-origin',
                body: body,
            });
            const json = await res.json();

            if (!json.success) {
                say(json.message || 'Durum güncellenemedi.', false);
                return;
            }

            say(id + ' numaralı talep "' + durum + '" olarak güncellendi.', true);
            await load();
        } catch (err) {
            say('Sunucuya bağlanılamadı.', false);
        } finally {
            button.disabled = false;
            button.textContent = original;
        }
    }

    /* Satırlar her yüklemede yeniden üretildiği için dinleyici tek tek
       butonlara değil tabloya bağlanıyor (olay delegasyonu). */
    rowsEl.addEventListener('click', (e) => {
        const button = e.target.closest('.saveBtn');
        if (!button) return;

        const row = button.closest('tr');
        save(row.dataset.id, row.querySelector('.statusSelect').value, button);
    });

    filterEl.addEventListener('change', load);
    refreshEl.addEventListener('click', load);

    load();
})();
</script>
