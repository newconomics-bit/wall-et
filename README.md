# wall-et

Personal finance tracker offline-first untuk pengguna gaji cash harian di Indonesia. Multi-dompet, transaksi 8 tipe, budget per siklus gajian, analitik arus kas, dan auto-tangkap mutasi bank/e-wallet dari notifikasi Android (v1.1).

## Stack
- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/) (React Native 0.88.1, TypeScript)
- [@react-navigation/native](https://reactnavigation.org/) + [@react-navigation/bottom-tabs] (dilarang expo-router)
- [zustand] + [@react-native-async-storage/async-storage] (state + persist)
- [expo-secure-store] + [expo-crypto] (PIN hash + salt)
- [expo-local-authentication] (biometrik)
- [expo-blur] (privacy overlay)
- [@expo/vector-icons] (ikoni kategori)
- [react-native-svg]

## Cara Jalankan
```bash
# Install dependensi
npm install

# Jalankan dev server (Expo Go / emulator)
npx expo start

# Typecheck
npx tsc --noEmit
```

## Sumber Kebenaran
- [PRD.md](./PRD.md) — spesifikasi produk & data model
- [ROADMAP.md](./ROADMAP.md) — rencana eksekusi per wave
- [.kilocoderules](./.kilocoderules) — aturan permanen & batasan teknis

## Catatan
Aplikasi 100% offline: tanpa backend, tanpa tracking/analytics, tanpa network call. Semua data tersimpan lokal di perangkat via AsyncStorage + SecureStore.
