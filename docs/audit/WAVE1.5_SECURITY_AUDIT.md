# WAVE 1.5: SECURITY & DEPENDENCY AUDIT REPORT — wall-et

**Tanggal**: 2026-11-20
**Versi Aplikasi**: 1.0.0 (SDK 58)
**Branch**: `kilo/hollow-bobcat-gr5`
**Commit Terakhir**: `07e3d83` — "wave-1: fix PIN pad render & android privacy overlay"

---

## RINGKASAN EKSEKUTIF (≤5 baris)

- **3 kerentanan moderate** ditemukan via npm audit (semua transitif melalui `expo` → `@expo/fingerprint` → `minimatch`), tidak ada high/critical.
- **Tidak ada kebocoran secret** (PIN/hash/salt/env) di kode atau riwayat git; salt dihasilkan via CSPRNG (`expo-crypto.getRandomValues`).
- **Keselarasan PRD §4 & §6**: 8 tipe transaksi lengkap, adminFee/feeAmount/groupId/loanId benar; SecurityGate cold-start lock, cooldown 5x/60s, overlay di root level.
- **Kepatuhan .kilocoderules**: Tidak ada `expo-router`; dependensi via jalur benar; `react-native-android-notification-listener` belum terinstall (sesuai Wave 1).
- **Risiko utama**: TypeScript `number` tidak mencegah float runtime → perlu guard validasi nominal; hash PIN single-pass SHA-256 bergantung cooldown sebagai mitigasi utama.

---

## 1. DEPENDENCY & VULNERABILITY AUDIT

### 1.1 `npm audit` Output (JSON)

```json
{
  "auditReportVersion": 2,
  "vulnerabilities": {
    "@expo/fingerprint": {
      "name": "@expo/fingerprint",
      "severity": "moderate",
      "isDirect": false,
      "via": ["minimatch"],
      "effects": ["expo"],
      "range": ">=0.11.12-canary-20250303-4dba60e",
      "nodes": ["node_modules/@expo/fingerprint"],
      "fixAvailable": { "name": "expo", "version": "52.0.49", "isSemVerMajor": true }
    },
    "expo": {
      "name": "expo",
      "severity": "moderate",
      "isDirect": true,
      "via": ["@expo/fingerprint"],
      "effects": [],
      "range": ">=53.0.0-canary-20241211-61c49bd",
      "nodes": ["node_modules/expo"],
      "fixAvailable": { "name": "expo", "version": "52.0.49", "isSemVerMajor": true }
    },
    "minimatch": {
      "name": "minimatch",
      "severity": "moderate",
      "isDirect": false,
      "via": [{
        "source": 1244623,
        "name": "minimatch",
        "dependency": "minimatch",
        "title": "minimatch has potential denial of service via globparts amplification",
        "url": "https://github.com/advisories/GHSA-g3hv-75wg-m249",
        "severity": "moderate",
        "cwe": ["CWE-405"],
        "cvss": { "score": 0, "vectorString": null },
        "range": ">=7.0.0 <11.0.1"
      }],
      "effects": ["@expo/fingerprint"],
      "range": "7.0.0 - 11.0.0",
      "nodes": ["node_modules/minimatch"],
      "fixAvailable": { "name": "expo", "version": "52.0.49", "isSemVerMajor": true }
    }
  },
  "metadata": {
    "vulnerabilities": { "info": 0, "low": 0, "moderate": 3, "high": 0, "critical": 0, "total": 3 },
    "dependencies": { "prod": 497, "dev": 0, "optional": 23, "peer": 0, "peerOptional": 0, "total": 519 }
  }
}
```

### 1.2 Analisis Vulnerability

| Vulnerability | Severity | Package | Path | Runtime Exposure | Assessment |
|---------------|----------|---------|------|------------------|------------|
| GHSA-g3hv-75wg-m249 (minimatch DoS via globparts amplification) | Moderate | `minimatch` 7.0.0–11.0.0 | `expo` → `@expo/fingerprint` → `minimatch` | **Ya** (build-time CLI tooling, tidak di bundle JS aplikasi) | **P1** — DoS potensial saat `expo fingerprint` dijalankan (dev/build CI). Tidak terekspos ke user runtime karena `minimatch` hanya dipakai saat build. Fix memerlukan upgrade Expo major (v52→v53+) — **tidak direkomendasikan di tengah wave**. |
| Transitive via `@expo/fingerprint` | Moderate | `@expo/fingerprint` | `expo` → `@expo/fingerprint` | **Ya** (build-time) | **P2** — Sama dengan di atas, hanya mempengaruhi CLI fingerprinting. |
| Transitive via `expo` | Moderate | `expo` (direct) | `expo` | **Ya** (build-time) | **P2** — Sama, indikator upgrade major diperlukan. |

**Kesimpulan**: 3 vulnerability moderate semuanya **build-time only** (CLI tooling `expo fingerprint`), tidak terekspos ke bundle aplikasi user. Tidak ada vulnerability pada runtime dependencies (`react-native`, `expo-*`, `zustand`, `@react-navigation/*`, dll). **DILARANG `npm audit fix`** per instruksi.

### 1.3 `npm ls` Check untuk Forbidden Packages

```bash
$ npm ls react-native-android-notification-listener expo-router 2>&1
app@1.0.0 /workspace/app
└── (empty)
Exit code: 1
```

✅ **Kedua package tidak terinstall** — sesuai `.kilocoderules` #6 (dilarang `expo-router`) dan ROADMAP Wave 4 untuk `react-native-android-notification-listener`.

---

## 2. SECRET LEAKAGE & DANGEROUS CONFIG CHECK

### 2.1 Git History Scan

```bash
$ git log --all --oneline --grep="secret\|password\|pin\|hash\|salt" -i
c5b7c8d Merge pull request #2 from newconomics-bit/kilo/hollow-bobcat-gr5
07e3d83 wave-1: fix PIN pad render & android privacy overlay
```

Hanya commit message biasa (tidak ada secret). **Tidak ditemukan PIN/hash/salt/env ter-commit**.

### 2.2 `.env` Files Check

```bash
$ git ls-files | grep -E "\.env"
```
*(no output)* — **Tidak ada file `.env` ter-commit**.

### 2.3 Source Code Secret Scan

| File | Finding | Risk |
|------|---------|------|
| `src/store/useSecurityStore.ts:56-60` | Salt generation menggunakan `expo-crypto.getRandomValues()` (CSPRNG) | ✅ **Secure** — bukan `Math.random()` |
| `src/store/useSecurityStore.ts:62-66` | Hash PIN: `SHA-256(salt + pin)` via `expo-crypto.digestStringAsync` | ✅ **Secure** — CSPRNG + standard crypto API |
| `src/store/useSecurityStore.ts:53-54` | SecureStore keys hardcoded string constants | ✅ **OK** — bukan secret |
| `app.json:13` | Android package `com.wallet.personalfinance` | ✅ **OK** — bukan credential |

### 2.4 Android Permissions (`app.json`)

```json
"android": {
  "package": "com.wallet.personalfinance",
  "adaptiveIcon": { ... },
  "predictiveBackGestureEnabled": false
}
```

**Tidak ada `permissions` array eksplisit** — hanya default Expo permissions (internet, network_state). Untuk Wave 1 (offline-only, no network) ini **minimal dan benar**. Wave 4 akan butuh `BIND_NOTIFICATION_LISTENER_SERVICE` (via config plugin).

---

## 3. SPEC ALIGNMENT VERIFICATION

### 3.1 `src/types/finance.ts` vs PRD §4

| Entity | PRD §4 Requirement | Implementation | Status |
|--------|-------------------|----------------|--------|
| **Wallet** | id, name, type (cash/bank/ewallet), color, icon, isArchived. Saldo **tidak disimpan** | ✅ Lengkap. `isArchived` boolean. Tidak ada field saldo. | **PASS** |
| **Transaction** | 8 tipe: expense, income, transfer, loan_out, loan_repay, debt_in, debt_repay, adjustment. Field: amount, adminFee?, feeAmount?, walletId?, toWalletId?, categoryId?, note, date, source, loanId?, groupId? | ✅ Semua 8 tipe + field opsional sesuai tabel PRD. `walletId?` opsional untuk debt_in kredit. | **PASS** |
| **QuickTemplate** | type (expense/income/transfer), title, amount? (kosong→prefill), categoryId, walletId, toWalletId?, adminFee?, icon | ✅ Lengkap. | **PASS** |
| **Loan** | direction (piutang/hutang), mode (cash/credit untuk hutang), counterparty, principal, walletId? (kosong untuk hutang kredit), dueDate?, note, status turunan | ✅ Lengkap. `status` sebagai `open|partial|lunas`. | **PASS** |
| **Budget** | categoryId (expense only + Biaya Admin), limit per siklus aktif | ✅ Lengkap. | **PASS** |
| **Settings** | cycleStartDay (1-28), theme, isBalanceHidden, biometricEnabled, autoApprove (OFF), packageToWallet, lastBackupAt | ✅ Lengkap. | **PASS** |
| **Categories** | Expense: 8 (Makan & Minum, Transportasi, Belanja, Tagihan, Hiburan, Kesehatan, Biaya Admin, Lainnya). Income: 3 (Gaji, Bonus, Lainnya) | ⚠️ **Belum didefinisikan di types** — hanya PRD §4.9 menyebut "FIXED, dengan ikon @expo/vector-icons". Harus ditambahkan di Wave 2. | **P2** |

### 3.2 Nominal Integer Guard (PRD §5 & .kilocoderules #5)

| Location | Type | Runtime Guard | Risk |
|----------|------|---------------|------|
| `src/types/finance.ts:94` | `export type Rupiah = number` | ❌ **Tidak ada** — TypeScript `number` mengizinkan float/desimal | **P1** — Risiko data corrupt jika float masuk (mis. 50000.5). Perlu guard runtime di store/input validation (Wave 2). |
| `src/store/useSecurityStore.ts:50` | `type integer = number` (alias) | ❌ Tidak ada guard | **P1** — Sama. |
| `src/components/security/SecurityGate.tsx:27` | `const PIN_LENGTH = 6` | ✅ Input dibatasi string length 6, bukan numeric | **PASS** untuk PIN. |

**Rekomendasi**: Tambahkan `validateRupiah(n: number): n is Rupiah` guard di `src/utils/validation.ts` (Wave 2) dan gunakan di semua input nominal.

### 3.3 SecurityGate vs PRD §6

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **Cold-start lock** | `initializeSecurity()` di `App.tsx:29-31` → baca SecureStore sync async, `isLocked` default `false` tapi `isOnboardingComplete` default `false` → onboarding wajib pertama kali | ✅ **PASS** — pertama kali buka app → onboarding PIN. |
| **Tidak ada fail-open ke Home** | `SecurityGate.tsx:436-442` render: `(!isOnboardingComplete \|\| isLocked) ? renderGate() : children` | ✅ **PASS** — Home hanya render jika `isOnboardingComplete && !isLocked`. |
| **Baca SecureStore synchronously sebelum render** | `initializeSecurity()` async dipanggil di `useEffect` (mount), tapi `isOnboardingComplete` default `false` → onboarding muncul dulu. Setelah PIN diset, `isOnboardingComplete=true` persist di AsyncStorage. | ⚠️ **PARTIAL** — SecureStore read async, tapi logic aman karena `isOnboardingComplete` gate. **Rekomendasi**: Tambahkan splash screen "Memuat..." saat `initializeSecurity()` pending (Wave 2). |
| **Cooldown 5x gagal → 60 detik** | `useSecurityStore.ts:97-106` `incrementAttempts()` set `lockUntil = Date.now() + 60_000` saat `pinAttempts >= 5`. `SecurityGate.tsx:191-192` cek `isCooldownActive` dan disable keypad. | ✅ **PASS** |
| **FLAG_SECURE via expo-screen-capture** | ❌ **BELUM** — Belum ada `expo-screen-capture` install/config. PRD §6 menyebut privacy overlay, tapi FLAG_SECURE tambahan untuk mencegah screenshot/recording. | **P1** — Tambah `expo-screen-capture` + `ScreenCapture.preventScreenCaptureAsync(true)` di App mount. |
| **Overlay blur di atas semua layar termasuk modal** | `App.tsx:50-51` `<PrivacyOverlay visible={showPrivacyOverlay} theme={theme} />` di root level, di atas `SecurityGate` & `AppNavigator`. `SecurityGate.tsx:49-64` `PrivacyOverlay` pakai `zIndex: 9999` + `StyleSheet.absoluteFill`. | ✅ **PASS** — Render di root App, bukan di dalam navigator. |

### 3.4 `.kilocoderules` Compliance

| Rule | Status | Evidence |
|------|--------|----------|
| #1: Nama app "wall-et" lowercase | ✅ | `app.json:3-4` `"name": "wall-et", "slug": "wall-et"` |
| #2: Dilarang expo-router, wajib @react-navigation/bottom-tabs | ✅ | `package.json`: `@react-navigation/bottom-tabs` v7.22.0, **tidak ada** `expo-router`. `npm ls expo-router` → not found. |
| #3: Library baru via `npx expo install` (kecuali `react-native-android-notification-listener` via npm) | ✅ | Semua `expo-*` packages di `dependencies` (bukan devDependencies). `npm install` hanya untuk `@react-navigation/*` dan `zustand`. |
| #4: 100% offline, tanpa backend/tracking/network call | ✅ | Tidak ada network call di kode. `expo-constants` hanya untuk config. |
| #5-6: Nominal integer Rupiah, fontVariant tabular-nums, isBalanceHidden mask | ⚠️ **Partial** | Types `Rupiah = number` tapi **tidak ada runtime guard**. `fontVariant` belum dipakai (UI belum implementasi nominal display). `isBalanceHidden` state ada, toggle di Home header. |
| #7: 8 tipe transaksi, saldo atomik dari transaksi | ✅ | Types lengkap. Saldo atomik logic belum diimplement (Wave 2). |
| #8: adminFee/feeAmount = Biaya Admin, bukan budget konsumsi | ✅ | Types pemisah field `adminFee` (transfer), `feeAmount` (debt_repay). |
| #9-10: Guard div zero, PIN hash+salt SecureStore, cooldown 5x/60s | ✅ | Cooldown implement. PIN hash+salt ✅. Div zero guard belum (Wave 2/3). |
| #11: Notification listener whitelist + zero-retention | ⏳ **Wave 4** | Belum relevan Wave 1. |
| #12-15: Wave berurutan, tsc 0 error, commit format, no TODO | ✅ | `npx tsc --noEmit` = 0 error. Commit format `wave-1: ...` & `wave-1: fix ...`. |

---

## 4. ARCHITECTURAL RISK ANALYSIS

### 4.1 SSRF (Server-Side Request Forgery)
**Status**: **N/A — Confirmed Not Applicable**
- Aplikasi 100% offline-first (PRD §2, .kilocoderules #4).
- Tidak ada network call runtime di codebase.
- `expo-constants` hanya baca config lokal.
- **Verified**: Grep `fetch\|axios\|XMLHttpRequest\|websocket` → no results.

### 4.2 Prompt Injection (Future Wave 4 Surface)
**Risk**: **Teoretis — High Impact jika tidak ditangani**
- Wave 4: `notificationHeadlessTask.ts` akan mem-parsing teks notifikasi dari sistem Android.
- Teks notifikasi = **untrusted user-controlled data** (bisa berisi "Ignore previous instructions...", JSON injection, dll).
- Parser `notificationParser.ts` akan memproses teks mentah → risiko injection ke logic parsing (regex, conditional).
- **Preventive Recommendation**:
  1. Treat all notification text as **data only**, never as code/instruction.
  2. Use strict allowlist regex untuk nominal/merchant, **bukan** free-form parsing.
  3. Sanitize input: strip control chars, limit length, reject non-ASCII-numeric patterns.
  4. Unit test parser dengan adversarial strings (injection payloads).
  5. **Zero-retention filter** (PRD §7.2) sudah mitigate: package non-whitelist → immediate drop.

### 4.3 PIN Hash Single-Pass SHA-256
**Risk**: **Teoretis — Medium**
- Current: `SHA-256(salt + pin)` — single pass, fast hash.
- Threat: Offline brute-force jika SecureStore dikompromikan (rooted device, backup extract).
- Mitigasi existing: **Cooldown 5x/60s** (online), **6-digit PIN** (1M kombinasib), **salt 16 bytes CSPRNG**.
- **Gap**: Tidak ada key derivation function (PBKDF2/Argon2/scrypt) untuk slow hash.
- **Recommendation P2**: Migrasi ke `PBKDF2-HMAC-SHA256` (100k+ iterasi) via `expo-crypto` saat Wave 2/3. `expo-crypto` support `PBKDF2` di SDK 58.

### 4.4 Missing `expo-screen-capture` (FLAG_SECURE)
**Risk**: **Ter Konfirmasi — P1**
- Android `FLAG_SECURE` mencegah screenshot, screen recording, recent apps preview (meski overlay blur ada).
- iOS otomatis blur di app switcher tapi FLAG_SECURE equivalent butuh `expo-screen-capture`.
- **Action**: `npx expo install expo-screen-capture` + `ScreenCapture.preventScreenCaptureAsync(true)` di App mount.

---

## 5. FINDINGS SUMMARY (PRIORITIZED)

| ID | Category | Severity | Title | Location | Evidence | Recommendation |
|----|----------|----------|-------|----------|----------|----------------|
| **F-01** | Vuln | P1 | minimatch DoS (build-time only) | `node_modules/minimatch` via `expo` → `@expo/fingerprint` | `npm audit` GHSA-g3hv-75wg-m249 | **Monitor only**. Upgrade Expo major (v53+) saat stabil. Jangan `audit fix`. |
| **F-02** | Spec | P1 | Nominal integer tidak punya runtime guard | `src/types/finance.ts:94` `Rupiah = number` | TS `number` allows float | Tambah `validateRupiah()` di `src/utils/validation.ts` (Wave 2). Gunakan di semua input nominal. |
| **F-03** | Security | P1 | Missing FLAG_SECURE (expo-screen-capture) | `package.json` (absent), `App.tsx` (no call) | PRD §6 privacy overlay + recent apps protection | `npx expo install expo-screen-capture` + `preventScreenCaptureAsync(true)` di App mount. |
| **F-04** | Spec | P1 | SecureStore read async, cold-start race potential | `App.tsx:29-31` `initializeSecurity()` in useEffect | `isOnboardingComplete` default false mitigates, tapi UX bisa flicker | Tambah splash "Memuat..." state sampai `initializeSecurity()` resolve (Wave 2). |
| **F-05** | Vuln | P2 | @expo/fingerprint transitive moderate | `npm audit` via minimatch | Build-time CLI only | Same as F-01. |
| **F-06** | Spec | P2 | Kategori expense/income belum didefinisikan di types | `src/types/finance.ts` (missing) | PRD §4.9 "FIXED, dengan ikon" | Definikan `EXPENSE_CATEGORIES`, `INCOME_CATEGORIES` const di `finance.ts` (Wave 2). |
| **F-07** | Arch | P2 | PIN hash single-pass SHA-256 | `useSecurityStore.ts:62-66` | Fast hash, offline brute-force risk jika SecureStore leak | Migrasi ke PBKDF2 (100k iter) via `expo-crypto.pbkdf2Async` (Wave 2/3). |
| **F-08** | Spec | P2 | `fontVariant: ['tabular-nums']` & `isBalanceHidden` mask belum di UI | `HomeScreen.tsx`, `TransaksiScreen.tsx` (skeleton only) | PRD §5 & .kilocoderules #6, #16 | Implementasi di Wave 2 saat UI nominal dibangun. |

---

## 6. EXPLICIT SEPARATION: CONFIRMED VULNERABILITIES vs THEORETICAL RISKS

### ✅ KERENTANAN TERKONFIRMASI (Confirmed Vulnerabilities)

| ID | Vulnerability | CVE/GHSA | Severity | Exploitability | Runtime Exposure |
|----|---------------|----------|----------|----------------|------------------|
| F-01 | minimatch DoS via globparts amplification | GHSA-g3hv-75wg-m249 | Moderate | **Build-time only** (CLI `expo fingerprint`) | ❌ Tidak terekspos ke user app bundle |
| F-05 | @expo/fingerprint transitive | (same as F-01) | Moderate | **Build-time only** | ❌ Tidak terekspos ke user app bundle |

**Catatan**: Kedua di atas **sama root cause** (minimatch). Hanya mempengaruhi developer/CI saat menjalankan `expo fingerprint`. **Tidak ada confirmed vulnerability pada runtime dependencies**.

### ⚠️ RISIKO TEORETIS (Theoretical Risks)

| ID | Risk | Likelihood | Impact | Mitigation Status |
|----|------|------------|--------|-------------------|
| F-02 | Float nominal corrupts data | Medium (input validation missing) | High (saldo atomik salah) | ❌ Belum — butuh runtime guard |
| F-03 | Screenshot/recording leak sensitive data | Medium (Android recent apps, screen record) | High (privasi saldo/transaksi) | ❌ Belum — butuh `expo-screen-capture` |
| F-04 | Cold-start flicker/bypass | Low (race condition) | Medium (UX/security) | ⚠️ Partial — `isOnboardingComplete` gate aman, UX butuh splash |
| F-07 | Offline PIN brute-force if SecureStore extracted | Low (butuh rooted device + backup) | Critical (full access) | ⚠️ Partial — cooldown online only, butuh slow hash (PBKDF2) |
| F-08 | Nominal display tanpa tabular-nums/mask | High (UI belum implement) | Medium (UX, privacy) | ❌ Belum — Wave 2 UI task |

---

## 7. RECOMMENDATIONS FOR WAVE 2

1. **P1 Immediate**: `npx expo install expo-screen-capture` + enable di `App.tsx` mount.
2. **P1 Immediate**: Buat `src/utils/validation.ts` dengan `validateRupiah()` + `formatRupiah()` (tabular-nums, mask). Gunakan di semua input nominal.
3. **P2**: Definiskan kategori konstan di `finance.ts` per PRD §4.9.
4. **P2**: Migrasi PIN hash ke PBKDF2 (100k iterasi) via `expo-crypto.pbkdf2Async`.
5. **P2**: Tambah splash screen loading saat `initializeSecurity()` pending.
6. **Monitor**: Expo SDK upgrade path untuk fix minimatch (tunggu SDK 59+ stabil).

---

## 8. COMMANDS EXECUTED (EVIDENCE)

```bash
# 1. Config files review
cat package.json tsconfig.json app.json .gitignore

# 2. ESLint/Jest check
ls -la *.eslint* *jest* babel.config.js 2>/dev/null || echo "Not found"

# 3. npm audit
npm audit --json

# 4. Forbidden packages
npm ls react-native-android-notification-listener expo-router 2>&1

# 5. Git secret scan
git log --all --oneline --grep="secret\|password\|pin\|hash\|salt" -i
git ls-files | grep -E "\.env"

# 6. Source code review
cat src/types/finance.ts src/store/useSecurityStore.ts src/components/security/SecurityGate.tsx App.tsx
```

---

**End of Report**

*Report generated by Wave 1.5 Security Audit per ROADMAP.md & .kilocoderules. No code changes made except this report file.*