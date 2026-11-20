# ROADMAP — wall-et

Sumber kebenaran: PRD.md + .kilocoderules. Kerjakan berurutan, satu wave
= satu sesi = satu commit ("wave-N: <ringkasan>"). Centang hanya jika
acceptance criteria TERBUKTI jalan. Konflik/ambigu → berhenti, tanya user.

## Definition of Done (global, tiap wave)
- [ ] `npx tsc --noEmit` = 0 error
- [ ] Tanpa TODO/placeholder/fitur palsu
- [ ] Semua skenario uji wave lolos manual
- [ ] Commit sesuai format

## WAVE 1 — Fondasi, Design System, Keamanan
- [ ] Scaffold: `npx create-expo-app@latest . --template blank-typescript --yes`
- [ ] Install deps sesuai PRD (expo install; navigasi, zustand,
      async-storage, local-authentication, secure-store, blur,
      vector-icons, expo-crypto)
- [ ] README.md singkat (nama, stack, cara jalanin, link PRD/ROADMAP)
- [ ] src/theme/tokens.ts (dark/light + semantik, PRD §3)
- [ ] Struktur: src/theme, src/types, src/store, src/components/security,
      src/screens, src/utils
- [ ] Bottom Tab 4 + FAB tengah; screen awal rapi: Home, Transaksi,
      Budget, Analitik, Settings
- [ ] useSecurityStore + SecurityGate: buat PIN pertama kali (konfirmasi
      2x), hash+salt SecureStore, biometrik + fallback PIN, cooldown
      5x gagal → 60 dtk, auto-lock background >15 dtk, privacy overlay
      blur+logo saat inactive/background
- [ ] isBalanceHidden global + toggle mata (persist)
- [ ] Lupa PIN: jalur biometrik & reset total ketik "HAPUS" (PRD §6)
Uji: kunci/buka biometrik & PIN; 5x salah → cooldown; background 16 dtk
→ terkunci; recent apps → overlay; toggle mata → semua nominal masked.

## WAVE 2 — Multi-Dompet, Transaksi, Dashboard
- [ ] Types lengkap 8 tipe + Loan/Budget/Settings (PRD §4) — tipe loan/
      adjustment didefinisikan sekarang, UI-nya menyusul per wave
- [ ] Mesin saldo atomik (pure selectors) + adjustment
- [ ] 6 dompet default + preset Jenius; modal tambah/edit/arsip dompet
      (guard: arsis hanya saldo 0, hapus hanya tanpa riwayat)
- [ ] Onboarding langkah 2–3: saldo awal (adjustment) + cycleStartDay
- [ ] Home lengkap (PRD §5.6): hero + baris piutang/hutang (0 dulu),
      carousel, chip quick-add + Undo 5 dtk, 5 transaksi terakhir
- [ ] QuickTemplate CRUD + default (Gaji Harian, Setor Bank prefill+fee,
      Kopi, Makan Siang, Bensin, Parkir); nominal kosong → modal prefill
- [ ] AddTransactionModal: segmented 3 tipe, nominal besar auto-focus
      pemisah ribuan, transfer asal→tujuan + adminFee, grid kategori,
      note, tanggal (default hari ini, bisa diubah), dompet default Tunai
- [ ] TransaksiScreen: grup hari + subtotal, search, filter dompet/jenis,
      edit/hapus (grup atomik)
- [ ] Cocokin Saldo di kartu dompet
Uji: gaji cash 75rb → Tunai +75rb; setor 400rb + fee agen 5rb →
Tunai −405rb, BCA +400rb, hero TIDAK berubah; hapus/edit transaksi →
saldo konsisten; chip 1-tap + undo; backdate transaksi.

## WAVE 3 — Siklus, Budget, Analitik, Hutang/Piutang → APK v1.0
- [ ] dateCycle.getCurrentCycleRange + setting cycleStartDay; semua
      ringkasan ikut siklus
- [ ] BudgetScreen: limit per kategori expense (termasuk Biaya Admin),
      progress adaptif 75/100%, Jatah Aman Harian (clamp), tanpa rollover
- [ ] Analitik sub-tab Arus Kas: Savings Rate (guard "—"), breakdown
      kategori urut + % + bar; Biaya Admin masuk; transfer/loan/
      adjustment dikecualikan
- [ ] Sub-tab Hutang & Piutang: piutang (loan_out/loan_repay), hutang
      2 mode (tunai / kredit PayLater ber-groupId), Talangan (total +
      porsi lu/jumlah orang → 2 mutasi atomik), nyicil dua arah +
      feeAmount → Biaya Admin, Tandai Lunas, progress bar, dueDate
      opsional, preset SPayLater
- [ ] Hero baris piutang/hutang live
Uji: siklus 25 → rentang 25 Nov–24 Des; pemasukan 0 → "—"; talangan
120rb porsi 30rb → expense 30rb + piutang 90rb, dompet −120rb; cicil
50rb → status Sebagian; PayLater 150rb → Belanja 150rb + hutang 150rb
TANPA perubahan saldo; bayar tagihan 50rb+5rb dari BCA → BCA −55rb,
hutang 100rb, Biaya Admin 5rb; budget 75%/100% → amber/rose.
- [ ] BUILD EAS preview → APK v1.0, install & uji di Vivo Y21s

## WAVE 4 — Auto-Mutasi, Backup, APK v1.1
- [ ] expo install expo-file-system expo-sharing; npm install
      react-native-android-notification-listener
- [ ] plugins/withNotificationListener.js + daftar di app.json
      (name/slug/package sesuai PRD §9) + eas.json preview apk
- [ ] Headless task: whitelist 12 package (PRD §7.1), zero-retention,
      filter sensitif, filter isi ketat Shopee
- [ ] Parser: format nominal, income/expense + OVERRIDE internal
      (setor/tarik), kamus merchant + biaya admin, dedup hash 10 menit
- [ ] pendingNotifications + banner Home + Inbox review (edit, Setujui
      & Catat, Buang), kelas wajib-review (PRD §7.4), toggle
      autoApprove default OFF, Smart Hint pairing ±10 menit (review-gated)
- [ ] Settings: tombol izin notifikasi, layar mapping + helper intip
      package ID (verifikasi Jenius), simulator (8 sampel positif +
      3 negatif), cycleStartDay, tema, biometrik/PIN, panduan Vivo
- [ ] Backup JSON (versioned, tanpa kredensial) + restore replace
      (konfirmasi + auto-export dulu) + CSV + lastBackupAt + banner 14 hari
Uji: simulator positif → parse benar; sampel OTP/promo/non-whitelist →
TIDAK ada yang tersimpan/ter-log; notif sama 2x → 1 antrean; skenario
BCA→SeaBank → Smart Hint muncul, gabung 1-tap; setor manual + notif
bank → Buang, saldo tidak dobel; SPayLater beli & bayar tagihan →
wajib review; export→wipe→restore → data utuh, PIN dibuat ulang.
- [ ] BUILD EAS preview → APK v1.1; uji perangkat nyata: listener hidup
      setelah reboot (autostart Vivo), tangkap notif asli BCA/SeaBank/
      DANA/OVO/ShopeePay, sempurnakan regex dari sampel nyata (PRD §11)

## Strategi build (kuota EAS 15 Android/bulan)
Build HANYA: akhir Wave 3 (v1.0) & akhir Wave 4 (v1.1).
Wave 1–2 cukup Expo Go via Codespaces tunnel.