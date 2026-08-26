# Lumanoris Projesi – Kapsamlı Teknik Audit, Code Review ve Risk Analizi

Elimde **Lumanoris** isimli gerçek bir web uygulaması/projesi var.

Bu proje genel olarak:

- Next.js 15 / React 19 frontend
- PHP 8.1+ backend
- MySQL/MariaDB
- PHP session authentication
- Google OAuth
- Google Gemini API
- chatbot oluşturma/eğitme
- chatbot marketplace
- abonelik/satın alma
- coin/mesaj kullanım sistemi
- wallet/satıcı sistemi
- Param POS entegrasyonu
- admin paneli
- kullanıcı sosyal özellikleri
- PDF training / OCR
- bildirimler
- password reset
- server-side PHP API

gibi birçok parçadan oluşuyor.

Sana ayrıca:

1. `README.md`
2. Projenin klasör/dosya ağacını gösteren ayrı bir dosya
3. Gerekirse projenin kaynak kodlarını/dosyalarını

vereceğim.

## ANA GÖREV

Projeyi yalnızca birkaç dosyaya bakarak veya README'yi kabul ederek değerlendirme.

**Amacın projeyi mümkün olduğunca gerçek bir production uygulamasına çıkacakmış gibi denetlemek.**

Kodun tamamını, mimariyi, frontend-backend iletişimini, veritabanı kullanımını, authentication/authorization sistemini, business logic'i, güvenliği, performansı, deployment yapısını, dependency'leri ve kullanıcı deneyimini birlikte değerlendir.

README'de yazan bilgiler ile gerçek kod arasında çelişki varsa:

> **GERÇEK KODU kaynak kabul et.**

README'de "çalışıyor" yazıyor diye çalışan kabul etme.

README'de "güvenli" yazıyor diye güvenli kabul etme.

README'de "transaction kullanılıyor" yazıyor diye transaction'ın gerçekten doğru kullanıldığını kabul etme.

Mümkün olduğunca iddialarını doğrudan ilgili dosya, fonksiyon, sınıf veya kod parçasına dayandır.

---

# 1. ÖNCE PROJEYİ ANLA

İncelemeye başlamadan önce projeyi zihinsel olarak modelle.

Şunları çıkar:

- frontend mimarisi
- backend mimarisi
- API request/response akışı
- authentication akışı
- authorization akışı
- database ilişkileri
- marketplace satın alma akışı
- subscription lifecycle
- chatbot lifecycle
- coin/message lifecycle
- seller/payment lifecycle
- admin lifecycle
- AI request lifecycle
- file upload/training lifecycle

Önce sistemin nasıl çalıştığını anlamaya çalış.

Anlamadığın bir noktayı varsayarak doldurma.

Eksik bilgi varsa:

> "Bu noktayı kesin olarak doğrulayamıyorum."

şeklinde belirt.

---

# 2. KRİTİK KURAL: README'Yİ TEK BAŞINA KAYNAK KABUL ETME

README ile kod arasında aşağıdakileri karşılaştır:

- README'de belirtilen özellikler gerçekten var mı?
- Belirtilen endpoint gerçekten frontend tarafından kullanılıyor mu?
- Endpoint'in anlattığı davranış gerçekten kodda var mı?
- README'deki authentication bilgileri güncel mi?
- README'deki database bilgileri kodla uyuşuyor mu?
- README'deki environment variable'lar gerçekten kullanılıyor mu?
- README'de production-ready görünen fakat gerçekte stub olan sistemler var mı?
- README'de belirtilmeyen kritik davranışlar var mı?
- Deprecated/ölü kod README'de yanlışlıkla aktif özellik olarak gösteriliyor mu?

Çelişkileri ayrıca raporla.

---

# 3. DOSYA / KLASÖR / MİMARİ AUDIT

Tüm proje ağacını incele.

Şunları tespit et:

- gereksiz dosyalar
- orphan files
- dead code
- kullanılmayan klasörler
- duplicate dosyalar
- duplicate class'lar
- duplicate logic
- eski implementasyonlar
- migration sonrası kalmış kodlar
- unreachable code
- yanlış import/path
- yanlış require/include
- broken relative paths
- naming inconsistency
- frontend/backend arasında isim uyuşmazlıkları
- kullanılmayan dependency'ler
- eksik dependency'ler
- yanlış dependency versiyonları
- dependency conflict ihtimalleri
- build sırasında ortaya çıkabilecek problemler

Özellikle:

> Aynı isimde birden fazla class/function/config varsa hangisinin gerçekten çalıştığını tespit et.

---

# 4. FRONTEND AUDIT

Next.js / React kodunu detaylı incele.

Kontrol et:

### React

- state management
- unnecessary re-render
- stale state
- stale closure
- race condition
- useEffect hataları
- dependency array hataları
- memory leak
- event listener cleanup
- async operation cleanup
- component lifecycle problemleri
- prop drilling
- gereksiz abstraction
- duplicate components
- component responsibility

### Next.js

- App Router kullanımı
- server/client component ayrımı
- `"use client"` gereksiz kullanımı
- static rendering
- dynamic rendering
- caching
- client-side fetch
- hydration problemleri
- route protection
- `notFound()`
- redirects
- metadata
- SEO
- image optimization
- error handling
- loading/error states
- production build davranışı

### Frontend API

Her API çağrısını backend endpoint'i ile karşılaştır:

- URL doğru mu?
- HTTP method doğru mu?
- payload doğru mu?
- `FormData` formatı doğru mu?
- JSON encoding doğru mu?
- response formatıyla frontend beklentisi aynı mı?
- hata response'ları doğru işleniyor mu?
- authentication gerektiren endpoint'ler gerçekten korunuyor mu?

---

# 5. BACKEND / PHP AUDIT

PHP backend'i production standardında incele.

Kontrol et:

- SOLID
- separation of concerns
- controller responsibility
- repository usage
- service/use-case architecture
- dependency injection
- static method kullanımı
- global state
- singleton kullanımı
- error handling
- exception handling
- response consistency
- validation
- sanitization
- type safety
- PHP 8.1+ compatibility
- deprecated API'ler
- strict typing eksiklikleri
- nullable değerler
- undefined index/variable
- null handling
- race condition
- transaction yönetimi
- rollback davranışı
- database connection yönetimi
- resource cleanup

Özellikle mevcut mimarinin gerçekten uygulandığını doğrula.

Örneğin bir repository/interface architecture varsa:

- tüm repository'ler gerçekten kullanılıyor mu?
- interface'ler gerçekten implement ediliyor mu?
- controller'lar repository yerine doğrudan DB'ye erişiyor mu?
- abstraction yalnızca görüntüde mi var?

---

# 6. SECURITY AUDIT – ÇOK ÖNEMLİ

Projeyi bir security auditor gibi incele.

OWASP Top 10'u referans al ama sadece onunla sınırlı kalma.

Kontrol et:

### Authentication

- login bypass
- session fixation
- session hijacking
- session regeneration
- remember-me güvenliği
- password hashing
- password policy
- account enumeration
- brute force
- credential stuffing
- password reset abuse
- reset token/code security
- Google OAuth doğrulaması

### Authorization

Her protected endpoint için:

> "Bu endpoint'e kullanıcı A, kullanıcı B'nin verisiyle erişebilir mi?"

diye düşün.

Özellikle IDOR/BOLA kontrolü yap.

Örnek:

```text
/api/chat/updateconversation.php
/api/chat/deleteconversation.php
/api/training/update_training_chunk.php
/api/wallet/...
/api/marketplace/...
```

Client tarafından gönderilen ID'lerin ownership kontrolünü doğrula.

### Injection

Kontrol et:

- SQL injection
- SQL identifier injection
- dynamic WHERE clauses
- table name injection
- command injection
- shell execution
- path traversal
- file inclusion
- PHP object injection

### XSS

Kontrol et:

- stored XSS
- reflected XSS
- DOM XSS
- markdown rendering
- chatbot generated content
- admin content
- comments
- profile data
- chatbot descriptions
- user-generated HTML

### CSRF

Kontrol et:

- state-changing endpoint'ler
- session authentication
- admin actions
- payment actions
- profile changes
- subscription actions

### File Upload

Kontrol et:

- MIME validation
- extension validation
- magic bytes
- file size
- filename handling
- path traversal
- executable uploads
- PDF parser vulnerabilities
- image uploads
- OCR uploads
- base64 uploads

### Secrets

Tüm repository'de ara:

- API keys
- passwords
- DB credentials
- OAuth secrets
- payment credentials
- SMTP credentials
- hardcoded tokens
- private keys
- URLs containing secrets

Git'e yanlışlıkla commit edilmiş olabilecek secret'ları ayrıca belirt.

---

# 7. PAYMENT / MONEY / SUBSCRIPTION AUDIT

Bu bölümde özellikle çok dikkatli ol.

Marketplace ve ödeme sistemini finansal bir sistemmiş gibi incele.

Kontrol et:

- double purchase
- duplicate subscription
- duplicate payment
- race condition
- concurrent requests
- price manipulation
- client-side price manipulation
- seller commission manipulation
- refund abuse
- credit duplication
- coin duplication
- cart manipulation
- subscription expiration
- subscription renewal
- cancellation
- refund sonrası access
- failed payment sonrası state
- successful payment sonrası state
- transaction atomicity
- payment callback security
- webhook replay
- webhook forgery
- idempotency
- payment reconciliation
- seller balance correctness
- withdrawal correctness

Özellikle:

> Kullanıcı browser'dan fiyatı, chatbot ID'sini, seller ID'sini, subscription süresini veya credit miktarını değiştirirse ne olur?

senaryolarını incele.

Ayrıca:

> Aynı isteği aynı anda 2, 5 veya 20 kez gönderirsem ne olur?

diye düşün.

Finansal işlemlerde TOCTOU/race condition ara.

---

# 8. COIN / CREDIT / LIMIT SYSTEM

Coin/message sistemini bağımsız olarak audit et.

Kontrol et:

- atomicity
- race condition
- negative balance
- duplicate consumption
- refund
- bonus credit
- expiration
- daily reset
- timezone
- concurrent chat requests
- failed AI request sonrası coin'in geri verilmesi
- başarılı olmayan request'te coin tüketimi
- client-side manipulation
- database consistency

Özellikle:

> Bir kullanıcı aynı anda 10 chat request gönderirse limit aşılabiliyor mu?

test mantığıyla incele.

---

# 9. AI / GEMINI ENTEGRASYONU

Gemini entegrasyonunu ayrıca incele.

Kontrol et:

- API key exposure
- prompt injection
- system prompt leakage
- user content isolation
- chatbot owner vs subscriber data isolation
- token abuse
- request size limits
- context limits
- malicious prompts
- streaming error handling
- timeout
- retry
- rate limiting
- cost abuse
- infinite/expensive requests
- malformed SSE
- partial stream handling
- AI response persistence
- failed generation sonrası database state

Özellikle kullanıcıların chatbot training verisini birbirine sızdırabilecek bir durum var mı incele.

---

# 10. DATABASE AUDIT

Database kullanımını ayrıntılı incele.

Kontrol et:

- foreign key eksiklikleri
- index eksiklikleri
- unique constraint eksiklikleri
- nullable kolonlar
- orphan records
- cascading delete
- transaction boundaries
- isolation level
- deadlock ihtimali
- N+1 query
- unnecessary queries
- SELECT \*
- pagination
- sorting injection
- filtering injection
- full table scans
- missing indexes
- duplicate data
- data consistency
- money precision
- decimal vs float
- timezone
- charset/collation
- Turkish characters
- migration eksikliği

README'de schema/migration olmadığını görürsen bunu sadece "eksik" diye yazma.

Şunu değerlendir:

> Bu proje yeni bir sunucuda güvenilir şekilde kurulabilir mi?

---

# 11. API CONTRACT AUDIT

Frontend ile backend arasında bir contract çıkar.

Her endpoint için mümkün olduğunca:

```text
Endpoint
Method
Authentication
Input
Validation
Output
Errors
HTTP status
Side effects
Database changes
```

çıkar.

Sonra frontend'in beklentisiyle karşılaştır.

Özellikle response formatlarının tutarsız olduğu endpoint'leri bul.

---

# 12. ERROR HANDLING

Hataları incele.

Kontrol et:

- kullanıcıya fazla bilgi sızması
- stack trace
- SQL error leakage
- API key leakage
- inconsistent HTTP status
- inconsistent JSON
- swallowed exceptions
- empty catch
- logging eksikliği
- sensitive data logging
- production/debug ayrımı

---

# 13. PERFORMANCE AUDIT

Performans açısından incele.

Frontend:

- bundle size
- unnecessary client components
- image optimization
- lazy loading
- unnecessary API requests
- duplicate requests
- caching
- pagination
- infinite scroll
- expensive renders

Backend:

- DB query count
- N+1
- indexes
- expensive SQL
- unnecessary filesystem operations
- PDF processing
- OCR
- Gemini calls
- synchronous operations
- large payloads
- streaming
- rate limiting

---

# 14. DEPLOYMENT / DEVOPS AUDIT

Projeyi production'a deploy etmeye çalışacakmış gibi değerlendir.

Kontrol et:

- environment variables
- secrets
- Node version
- PHP version
- Composer
- npm
- production build
- `NODE_ENV`
- port configuration
- reverse proxy
- HTTPS
- cookies
- CORS
- headers
- CSP
- HSTS
- nginx/apache
- PHP-FPM
- process manager
- logging
- backups
- database migration
- health check
- monitoring
- graceful shutdown
- error reporting

Ayrıca:

> "Bu proje yeni bir VPS'e verilse, geliştirici README'yi takip ederek sıfırdan kurabilir mi?"

sorusunu cevapla.

---

# 15. TEST AUDIT

Projede test yoksa sadece "test yok" deme.

Eksik testleri kategorize et.

Örneğin:

### Unit tests

- auth
- pricing
- coin engine
- validation
- permission checks

### Integration tests

- login
- registration
- subscription
- payment
- chatbot creation
- training

### API tests

- authentication
- authorization
- invalid payload
- IDOR
- rate limits

### E2E

- register → login → create bot
- create bot → publish
- buyer → purchase
- buyer → chat
- seller → withdraw

### Security tests

- brute force
- CSRF
- XSS
- SQLi
- IDOR
- replay attack
- race condition

---

# 16. BUSINESS LOGIC AUDIT

Burada yalnızca kod kalitesine bakma.

Ürünün mantığını sorgula.

Örneğin:

- kullanıcı bot oluşturuyor
- bot publish ediyor
- bot satılıyor
- subscription oluşuyor
- subscription bitiyor
- kullanıcı chat yapıyor
- coin tüketiliyor
- seller gelir elde ediyor
- refund oluşuyor

Bu lifecycle boyunca state'lerin birbirleriyle tutarlı olup olmadığını incele.

Şu soruyu sürekli sor:

> "Bu işlemin tam ortasında sistem kapanırsa ne olur?"

Ayrıca:

> "Kullanıcı kötü niyetliyse bu business logic'i nasıl abuse eder?"

---

# 17. UX / PRODUCT AUDIT

Kod kadar kullanıcı deneyimini de incele.

Kontrol et:

- loading state
- error state
- empty state
- success feedback
- duplicate click
- disabled buttons
- mobile responsive
- accessibility
- keyboard navigation
- form validation
- confusing UX
- dead-end screens
- broken redirects
- stale data
- optimistic update problemleri

---

# 18. SEO / ACCESSIBILITY

Public sayfalar için:

- metadata
- title
- description
- canonical
- robots
- sitemap
- semantic HTML
- heading hierarchy
- alt text
- keyboard accessibility
- aria attributes
- contrast
- focus states

kontrol et.

---

# 19. CODE QUALITY

Kod kalitesini değerlendir:

- readability
- maintainability
- naming
- duplication
- complexity
- large functions
- large components
- magic numbers
- magic strings
- comments
- misleading comments
- TODO/FIXME
- inconsistent conventions
- Turkish/English naming inconsistency
- technical debt

Ama:

> Sırf "ben farklı yazardım" diye sorun üretme.

Gerçek risk ve bakım maliyeti yaratmayan stil farklılıklarını gereksiz yere kritik olarak raporlama.

---

# 20. DEAD CODE / ORPHAN / UNUSED CODE

Özellikle tespit et:

- frontend tarafından hiç çağrılmayan endpoint'ler
- hiçbir yerde import edilmeyen component'ler
- kullanılmayan dependency'ler
- eski route'lar
- eski CSS
- eski scripts
- eski PHP implementation'ları
- duplicate class'lar
- eski config'ler
- artık kullanılmayan environment variable'lar

Her bulguyu mümkünse:

```text
Dosya:
Neden kullanılmıyor:
Nereden doğruladın:
Silinebilir mi:
Risk:
```

şeklinde açıkla.

---

# 21. GERÇEKTE ÇALIŞMAYAN ÖZELLİKLER

Özellikle aşağıdakileri ara:

README'de veya UI'da var görünen ama gerçekte:

- stub
- mock
- fake success
- no-op
- unreachable
- broken
- partially implemented
- frontend-only
- backend-only

olan özellikleri tespit et.

Bunları ayrı bir liste yap:

```text
Feature
Beklenen davranış
Gerçek davranış
Kanıt
Production'a hazır mı?
```

---

# 22. SEVERITY SINIFLANDIRMASI

Her bulguyu severity ile işaretle:

### 🔴 CRITICAL

Veri kaybı, para kaybı, authentication bypass, ciddi güvenlik açığı, production'u kullanılmaz hale getiren problem.

### 🟠 HIGH

Ciddi güvenlik, authorization, payment, data integrity veya production problemi.

### 🟡 MEDIUM

Önemli bug, maintainability veya performans problemi.

### 🔵 LOW

Küçük teknik borç veya kalite problemi.

### ⚪ INFO

İyileştirme önerisi / observation.

Severity verirken abartma.

Gerçek exploit veya gerçek impact yoksa CRITICAL verme.

---

# 23. HER BULGU İÇİN KANIT İSTE

Her önemli bulguyu mümkün olduğunca şu formatta ver:

```text
ID: SEC-001
Severity: 🔴 CRITICAL

Başlık:
...

Dosya:
...

Fonksiyon/Class:
...

Problem:
...

Neden problem:
...

Nasıl tetiklenebilir:
...

Impact:
...

Kanıt:
...

Önerilen çözüm:
...

Çözüm önceliği:
...
```

Mümkünse dosya ve satır numarası ver.

---

# 24. FALSE POSITIVE KONTROLÜ

Bir şeyi sorun olarak raporlamadan önce mümkün olduğunca repository içinde ara.

Örneğin:

- bir fonksiyon kullanılmıyor gibi görünüyorsa gerçekten başka yerde çağrılıyor mu?
- bir variable kullanılmıyor gibi görünüyorsa dynamic access var mı?
- bir endpoint frontend'de kullanılmıyor görünüyorsa admin veya başka bir client kullanıyor mu?
- bir security kontrolü eksik görünüyorsa middleware seviyesinde zaten yapılıyor mu?

Emin olmadığın şeyi kesin gerçek gibi yazma.

---

# 25. ÖNCELİKLENDİRME

En sonunda tüm bulguları önem sırasına göre sırala.

Özellikle ilk 10 problemi çıkar:

```text
#1
Problem:
Risk:
Neden önce çözülmeli:
Tahmini çözüm:

#2
...
```

Sonra:

### P0 – Hemen düzelt

### P1 – Production'dan önce düzelt

### P2 – Yakın zamanda düzelt

### P3 – Technical debt

şeklinde roadmap oluştur.

---

# 26. SONUÇ RAPORU

İnceleme sonunda aşağıdaki yapıda bir rapor oluştur:

## Executive Summary

Projenin genel durumu.

Örneğin:

- Architecture: X/10
- Security: X/10
- Backend: X/10
- Frontend: X/10
- Database: X/10
- Performance: X/10
- Testing: X/10
- Deployment readiness: X/10
- Code quality: X/10
- Production readiness: X/10

Puanları gerekçelendir.

## Critical Findings

En kritik problemler.

## Security Findings

Tüm güvenlik açıkları.

## Architecture Findings

Mimari problemler.

## Backend Findings

## Frontend Findings

## Database Findings

## Payment & Business Logic Findings

## AI / Gemini Findings

## Performance Findings

## Deployment Findings

## Testing Gaps

## Dead Code / Orphan Files

## Broken Features

## Documentation Inconsistencies

## Recommended Architecture

Gerekliyse mevcut mimarinin nasıl iyileştirilebileceğini anlat.

## Priority Roadmap

### Phase 1 – Critical

### Phase 2 – Security & Data Integrity

### Phase 3 – Architecture

### Phase 4 – Performance

### Phase 5 – Testing

### Phase 6 – Cleanup

---

# 27. ÇOK ÖNEMLİ: SADECE SORUN LİSTESİ ÇIKARMA

Her şeyi "bunu değiştir" şeklinde raporlama.

Şunları ayır:

1. Gerçek bug
2. Güvenlik açığı
3. Business logic hatası
4. Architecture problemi
5. Technical debt
6. Code smell
7. Documentation problemi
8. Production blocker
9. İyileştirme önerisi

Bunları birbirine karıştırma.

---

# 28. KOD DEĞİŞİKLİĞİ ÖNERİLERİ

Bir problemi düzeltmek için önerdiğin çözüm mevcut mimariye uyumlu olmalı.

Her problemi "baştan yazalım" şeklinde çözme.

Önce:

> Mevcut sistemde minimum güvenli ve doğru düzeltme nedir?

bunu düşün.

Daha sonra gerekiyorsa:

> Uzun vadede ideal mimari nedir?

şeklinde ikinci seçenek sun.

---

# 29. SON KONTROL

Raporu tamamlamadan önce tekrar kontrol et:

- Aynı problemi farklı başlıklarda duplicate raporladın mı?
- README ile kod arasındaki çelişkileri kontrol ettin mi?
- Frontend ve backend'i birlikte değerlendirdin mi?
- Security + business logic birlikte incelendi mi?
- Payment sistemine özel audit yapıldı mı?
- Race condition düşündün mü?
- IDOR düşündün mü?
- Client-side manipulation düşündün mü?
- Dead code kontrol edildi mi?
- Dependency kontrol edildi mi?
- Deployment kontrol edildi mi?
- Test eksiklikleri kontrol edildi mi?
- Production readiness değerlendirildi mi?

---

# SON TALİMAT

**Projeyi mümkün olduğunca gerçek bir production codebase gibi değerlendir.**

Nazik olmak için problemleri gizleme.

Ama olmayan problemleri de uydurma.

Bir şeyden emin değilsen açıkça:

> "Koddan kesin doğrulanamıyor."

de.

README'yi ve proje ağacını başlangıç haritası olarak kullan fakat nihai kararları gerçek source code üzerinden ver.

Özellikle güvenlik, authorization, ödeme, abonelik, coin/credit, veri bütünlüğü ve kullanıcılar arası veri izolasyonunda çok agresif bir audit yap.

**İlk önce genel sistemi anla, sonra katman katman incele.**

Ve inceleme sonunda bana yalnızca "şunlar kötü" deme.

Bana:

> **"Bu projeyi production'a çıkarmadan önce tam olarak neleri düzeltmeliyim ve hangi sırayla düzeltmeliyim?"**

sorusunun net bir cevabını ver.
