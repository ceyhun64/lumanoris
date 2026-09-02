Testler mevcut ve P0/P1 kapandı; artık regresyonu yakalayabiliyoruz.

1. Kullanılmayan npm bağımlılıkları: her biri için `grep -r` ile import edilmediğini teyit et, kaldır, `npm install`, build + testler.
2. "Silme adayı" endpoint'ler: `web/src` + `api/admin` + `router.php` üçünde de çağıran yoksa ve admin panelinde karşılığı olan bir ekran bulunmuyorsa → sil. Emin değilsen SİLME, listede bırak.
3. `TODO.md`, `project_tree.txt`: güncelle ya da sil, gerekçe yaz.

Her adımdan sonra build + lint + testler. Bir silme herhangi birini bozarsa geri al ve raporla.
