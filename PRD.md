# PRD — wall-et

Versi: 1.0 (FINAL — desain terkunci 2026-11-20)
Owner: Zaka | Platform: Android | Bahasa dokumen: Indonesia
Baca juga: `.kilocoderules` (aturan permanen) & `ROADMAP.md` (eksekusi per wave).

## 1. Ringkasan
Personal finance tracker offline-first untuk pengguna gaji cash harian
di Indonesia. Multi-dompet, transaksi 3-tipe + hutang/piutang + penyesuaian,
budget per siklus gajian, analitik arus kas, dan (v1.1) auto-tangkap mutasi
bank/e-wallet dari notifikasi Android. Privasi nomor satu: tidak ada data
keluar dari perangkat kecuali export manual oleh user.

## 2. Rilis & Non-Goals
- v1.0 = Wave 1–3 (fondasi, dompet/transaksi/dashboard, budget/analitik/hutang).
- v1.1 = Wave 4 (notification listener, inbox mutasi, backup, APK final).
- Non-goals: server/cloud sync, multi-currency, iOS, custom kategori,
  rollover budget, jadwal amortisasi cicilan, reminder/notifikasi push,
  transaksi berulang terjadwal, auto-split talangan per orang,
  auto-parse PayLater selain SPayLater (lainnya manual).

## 3. Design System & Navigasi
- Dark (default): bg #0B0F19, card #131A2A, accent #10B981.
- Light: bg #F8FAFC, card #FFFFFF, accent #059669.
- Semantik: income #10B981, expense #F43F5E, transfer #3B82F6, warning #F59E0B.
- Token terpusat di src/theme/tokens.ts.
- Bottom Tab 4: Home, Transaksi, Budget, Analitik + FAB bulat menonjol di
  tengah bawah (thumb-zone) → AddTransactionModal (bottom sheet).
- Settings diakses dari ikon di header Home. Branding "wall-et" lowercase.

## 4. Data Model (src/types/finance.ts)
### Wallet
id, name, type ('cash'|'bank'|'ewallet'), color, icon, isArchived.
Saldo TIDAK disimpan — selalu hasil kalkulasi atomik (lihat §5.1).
Default (6): Tunai (cash), BCA (bank), SeaBank (bank), DANA (ewallet),
OVO (ewallet), ShopeePay (ewallet). Jenius = preset opsional (ikon+warna+
mapping siap, dompet tidak dibuat kecuali user memilih).
Aturan: dompet berriwayat transaksi tidak bisa dihapus (hanya arsip);
arsip hanya boleh jika saldo 0; dompet arsip hilang dari picker & hero.

### Transaction
id, type (8 tipe, lihat tabel), amount (integer > 0),
adminFee? (transfer), feeAmount? (debt_repay), walletId? (wajib kecuali
debt_in mode kredit), toWalletId? (transfer), categoryId?, note,
date (ISO string; default hari ini, bisa diubah/backdate),
source ('manual'|'auto_notif'), loanId? (mutasi hutang/piutang),
groupId? (mutasi yang lahir dari satu aksi: Talangan / Belanja PayLater).

| Tipe | Efek saldo | Efek analitik |
|---|---|---|
| expense | wallet −amount | Pengeluaran konsumsi (kategori) |
| income | wallet +amount | Pemasukan |
| transfer | from −(amount+adminFee), to +amount | principal: tidak ada; adminFee: Biaya Admin |
| loan_out (beri piutang) | wallet −amount | tidak ada (baris Piutang) |
| loan_repay (piutang balik) | wallet +amount (≤ sisa) | tidak ada |
| debt_in mode tunai | wallet +amount | tidak ada (baris Hutang) |
| debt_in mode kredit (PayLater) | tanpa wallet (walletId kosong) | tidak ada; leg expense pasangan yang mencatat konsumsi |
| debt_repay (bayar hutang) | wallet −(amount+feeAmount) | principal: tidak ada; feeAmount: Biaya Admin |
| adjustment | wallet ±amount (direction in/out) | tidak ada |

Hapus mutasi ber-groupId = hapus seluruh grup atomik. Edit nominal/tipe/
dompet apa pun → semua saldo terkait dihitung ulang.

### QuickTemplate
id, type ('expense'|'income'|'transfer'), title, amount? (kosong/0 →
buka modal prefill, bukan 1-tap), categoryId, walletId, toWalletId?,
adminFee? (transfer), icon. CRUD penuh (tambah/edit/hapus).
Default: "Gaji Harian" 75.000 income→Tunai (Gaji); "Setor Bank" nominal
kosong transfer Tunai→BCA + field fee agen; "Kopi" 20.000, "Makan Siang"
25.000 (Makan & Minum), "Bensin" 50.000, "Parkir" 2.000 (Transportasi)
— semua expense dari Tunai. 1-tap: note otomatis = judul template.

### Loan
id, direction ('piutang'|'hutang'), mode ('cash'|'credit') untuk hutang,
counterparty (teks bebas; preset lender: SPayLater), principal,
walletId? (kosong untuk hutang kredit), dueDate? (opsional), note,
status turunan: open | partial | lunas. Sisa = principal − Σ pelunasan.
Pelunasan sebagian dua arah; "Tandai Lunas" = shortcut sisa penuh.
Progress bar di kartu. Tanpa jadwal cicilan & tanpa reminder.

### Budget
categoryId (kategori expense saja, termasuk Biaya Admin), limit (integer),
per siklus aktif. Tanpa rollover.

### Settings / state global
cycleStartDay (1–28, default 1), theme ('dark'|'light', default dark),
isBalanceHidden (persist), biometricEnabled, autoApprove (default OFF),
packageToWallet mapping, lastBackupAt. PIN hash+salt di SecureStore
(terpisah dari state biasa). Persist via zustand + AsyncStorage.

### Kategori (FIXED, dengan ikon @expo/vector-icons)
Expense: Makan & Minum, Transportasi, Belanja, Tagihan, Hiburan,
Kesehatan, Biaya Admin, Lainnya. Income: Gaji, Bonus, Lainnya.

## 5. Aturan Bisnis
### 5.1 Mesin saldo atomik
balance(w) = Σ seluruh efek transaksi terhadap w (tabel §4), dihitung
ulang setiap tambah/edit/hapus. Pure function/selectors, mudah diuji.
Termasuk adjustment (saldo awal & koreksi). Tidak ada mutasi saldo manual.

### 5.2 Siklus gajian (src/utils/dateCycle.ts)
getCurrentCycleRange(cycleStartDay, now): jika tanggal hari ini ≥
cycleStartDay → mulai bulan ini tgl cycleStartDay, selesai bulan depan
tgl (cycleStartDay−1); jika tidak → mulai bulan lalu. Contoh 25:
25 Nov–24 Des. SEMUA ringkasan Home/Budget/Analitik ikut rentang ini.
Sisa hari = (akhir siklus − hari ini) + 1, clamp minimal 1.

### 5.3 Analitik
- Total Pengeluaran = Σ expense + Σ adminFee transfer + Σ feeAmount
  debt_repay (dua terakhir masuk kategori Biaya Admin).
- Savings Rate = (Pemasukan − Total Pengeluaran) / Pemasukan × 100%.
  Pemasukan 0 → tampilkan "—".
- Breakdown kategori: urut terbesar, persentase + bar visual.
  Transfer principal, hutang/piutang principal, adjustment: DIKECUALIKAN.
- Budget konsumsi hanya dari expense kategori tsb (fee tidak nyampur).

### 5.4 Budget
Progress adaptif: <75% hijau, 75–99% amber, ≥100% rose.
Jatah Aman Harian = sisa limit / sisa hari siklus (clamp §5.2).
Sisa limit hangus saat ganti siklus (tanpa rollover).

### 5.5 Form & alur khusus
- Transfer: pilih asal→tujuan + adminFee opsional (fee agen/top-up).
  Setor cash ke bank = TRANSFER (bukan income). Tarik tunai = transfer
  bank→Tunai (bukan expense).
- Talangan (split bill): input total + porsi lu (atau jumlah orang →
  bagi rata otomatis). Submit = 2 mutasi atomik ber-groupId:
  expense (porsi lu, kategori dipilih) + loan_out (sisanya, piutang,
  counterparty diisi). Wallet −total.
- Tambah Hutang 2 mode: (a) Pinjaman Tunai → debt_in + wallet;
  (b) Belanja PayLater → expense (kategori, nominal) + debt_in TANPA
  wallet, ber-groupId. Konsumsi dicatat PAS BELI, bukan pas bayar tagihan.
- Bayar hutang: nominal pokok (≤ sisa) + feeAmount opsional (bunga/fee
  → Biaya Admin). Wallet −(pokok+fee). Cicilan = pelunasan sebagian.
- Cocokin Saldo (di kartu dompet): input saldo riil → app membuat
  adjustment sebesar selisih, note "Selisih kas".
- Quick-add 1-tap → toast konfirmasi + Undo 5 detik.
- Pengeluaran default dari dompet Tunai (bisa diganti di modal).

### 5.6 Home
Header: branding + ikon mata (isBalanceHidden) + ikon Settings.
Hero "Total Kekayaan Bersih" = Σ dompet aktif (likuid saja) + baris kecil
"Piutang Rp X • Hutang Rp Y" (outstanding) + ringkasan pemasukan vs
pengeluaran siklus aktif. Carousel dompet + tombol "+ Dompet".
Baris chip Quick-Add. Daftar 5 transaksi terakhir (ikon kategori berwarna).
Banner "X Mutasi Baru Terdeteksi" (v1.1, jika antrean > 0).

### 5.7 Transaksi
Kelompok per hari ("Hari Ini", "Kemarin", tanggal lengkap) + subtotal
pengeluaran harian. Pencarian note/kategori. Filter dompet & jenis.
Edit/hapus transaksi (grup dihapus atomik). Catatan editable di semua tempat.

### 5.8 Onboarding (maks 3 layar)
1) Buat PIN 6 digit (konfirmasi 2x) + tawaran biometrik — WAJIB.
2) Saldo awal per dompet via adjustment "Saldo awal" — bisa di-skip.
3) cycleStartDay (default 1) — bisa di-skip.

## 6. Keamanan & Privasi
- App Lock: biometrik (expo-local-authentication) + fallback PIN.
- PIN: SHA-256 + salt (expo-crypto) → expo-secure-store. 5x gagal →
  cooldown 60 detik. Jangan pernah plaintext/log.
- Auto-lock: AppState background > 15 detik → kunci.
- Privacy Overlay: AppState inactive/background → expo-blur + logo
  "wall-et" menutupi layar (recent apps), di atas semua modal.
- isBalanceHidden global: semua nominal → "Rp ••••••", persist.
- Lupa PIN: (a) auth biometrik → buat PIN baru; (b) tanpa biometrik/
  gagal → reset total (konfirmasi ketik "HAPUS") hapus data+PIN,
  lalu restore dari backup JSON. Tidak ada backdoor/pertanyaan rahasia.
- Backup reminder: Settings "Backup terakhir: X hari lalu" + banner
  halus in-app jika > 14 hari. Tanpa push notification.

## 7. Auto-Mutasi Notifikasi (v1.1 / Wave 4)
Library: react-native-android-notification-listener (npm) + config
plugin plugins/withNotificationListener.js (service +
BIND_NOTIFICATION_LISTENER_SERVICE + headless JS via prebuild).
Headless task: src/services/notificationHeadlessTask.ts.

### 7.1 Whitelist package (STRICT)
| Package | App | Dompet default |
|---|---|---|
| id.co.bankmandiri.livin | Livin' Mandiri | (preset) |
| com.bca | BCA mobile | BCA |
| com.bca.mybca.omni.android | myBCA | BCA |
| id.co.bri.brimo | BRImo | (preset) |
| src.com.bni | BNI Mobile | (preset) |
| id.co.seabank.id | SeaBank | SeaBank |
| com.jago.digitalBanking | Jago | (preset) |
| com.gojek.app | Gojek/GoPay | (preset) |
| id.dana | DANA | DANA |
| ovo.id | OVO | OVO |
| com.shopee.id | Shopee (ShopeePay) | ShopeePay — filter isi ketat |
| com.btpn.dc | Jenius — VERIFIKASI di perangkat (lihat §11) | (preset opsional) |

Mapping package→dompet di Settings; banyak package boleh → satu dompet.
Layar mapping punya helper "intip package ID" app terinstall (untuk
verifikasi Jenius, tanpa menyimpan isi notif).

### 7.2 Zero-retention filter
Package di luar whitelist → return, buang dari memori, tanpa simpan/log.
Teks mengandung "OTP", "kode rahasia", "jangan berikan", "verifikasi",
"PIN" → sama, langsung buang.
Khusus com.shopee.id: proses HANYA jika mengandung kata kunci pembayaran
ShopeePay ("ShopeePay", "pembayaran berhasil", "saldo berkurang") atau
SPayLater (lihat 7.4). Promo/order/kurir/flash sale → buang.

### 7.3 Parser (src/services/notificationParser.ts)
- Nominal: "Rp 50.000", "Rp50.000,00", "IDR 50,000" → integer 50000.
- Income: "transfer masuk", "dana masuk", "top up berhasil", "menerima",
  "kredit". Expense: "pembayaran", "qr", "qris", "transfer ke", "debit",
  "berhasil dibayar".
- OVERRIDE pindah internal (menang atas income/expense): "tarik tunai"
  → transfer bank→Tunai; "setor tunai"/"setoran" → transfer Tunai→bank;
  indikasi transfer antar dompet sendiri → kandidat transfer internal.
- Auto-kategori merchant: kopi/gofood/grabfood/resto/warteg → Makan &
  Minum; pertamina/shell/gojek/grab/parkir → Transportasi;
  indomaret/alfamart/shopee/tokopedia → Belanja; "biaya administrasi"/
  "biaya admin"/"fee" → Biaya Admin.
- Dedup: hash(package + teks ternormalisasi) identik dalam 10 menit → abaikan.

### 7.4 Kelas WAJIB REVIEW (tidak boleh auto-approve walau toggle ON)
Setor tunai, tarik tunai, indikasi transfer antar dompet sendiri,
pembelian SPayLater (→ prefill expense + hutang kredit), pembayaran
tagihan SPayLater (→ prefill debt_repay + user pilih dompet sumber).
Pengingat tagihan/promo PayLater → buang (bukan mutasi).

### 7.5 Inbox & Smart Hint
Antrean pendingNotifications (persist). Banner Home → modal Inbox:
ubah kategori/jenis/dompet/note, "Setujui & Catat", "Buang (sudah
dicatat manual)". Toggle Auto-Approve (default OFF, tidak berlaku
untuk kelas 7.4).
Smart Hint: mutasi keluar & masuk nominal SAMA di dua dompet ter-mapping
beda dalam ±10 menit → Inbox menawarkan "Gabung jadi 1 transfer internal?"
dengan field prefill, konfirmasi 1-tap. TIDAK ADA auto-merge diam-diam.

### 7.6 Simulator & panduan Vivo
Simulator di Settings: contoh notif Livin', myBCA, SeaBank, GoPay, DANA,
OVO, ShopeePay, SPayLater (beli & bayar tagihan) + sampel NEGATIF
(OTP, promo Shopee, package non-whitelist) yang WAJIB terbukti dibuang.
Panduan Vivo/Funtouch: checklist autostart ON, baterai "tanpa pembatasan",
kunci app di recent apps — agar listener tidak dibunuh OS.

## 8. Backup & Export
- Export JSON (expo-file-system + expo-sharing): {version: 1, exportedAt,
  data: wallets, transactions, templates, loans, budgets, settings}.
  TIDAK menyertakan PIN/hash/biometrik. Restore → user buat PIN baru.
- Restore = REPLACE TOTAL + konfirmasi + auto-export data lama dulu.
  Cek field version untuk migrasi.
- Export CSV mutasi: tanggal, jenis, dompet, dompet tujuan, kategori,
  nominal, fee, catatan, source.
- lastBackupAt dicatat; banner > 14 hari (§6).

## 9. Build & Distribusi
- app.json: name "wall-et", slug "wall-et",
  android.package "com.wallet.personalfinance", plugin terdaftar.
- eas.json profil "preview": android.buildType "apk".
- EAS free = 15 build Android/bulan → build HANYA di akhir Wave 3
  (v1.0) dan akhir Wave 4 (v1.1). Jangan build per perubahan kecil.

## 10. Environment (HP-only)
- Eksekusi kode: Kilo Code Cloud Agent (terminal + commit ke repo).
- Tes Wave 1–3: Codespaces → `npx expo start --tunnel` → Expo Go di
  Vivo Y21s (masukkan URL tunnel manual).
- Wave 4 TIDAK bisa di Expo Go (modul native) → wajib APK EAS.
- Build APK: terminal Codespaces → `npx eas-cli build -p android
  --profile preview`.

## 11. Item verifikasi terbuka (Wave 4)
- Package Jenius (com.btpn.dc) wajib diverifikasi dari perangkat via
  helper mapping sebelum dikunci.
- Regex parser disempurnakan dengan sampel notif NYATA dari app lu
  (kumpulkan via simulator + inbox saat uji perangkat). Jangan mengarang
  format notif bank yang belum terbukti.