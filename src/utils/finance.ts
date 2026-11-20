/**
 * Utilitas Keuangan — wall-et
 * PRD §5 & .kilocoderules #5: Semua nominal = integer Rupiah (tanpa float/desimal).
 *
 * Ini adalah GERBANG TUNGGAL untuk semua titik masuk nominal (input manual,
 * template, adminFee, feeAmount, adjustment, budget, loan). Setiap entri nominal
 * harus melalui validateRupiah() sebelum diproses, dan formatRupiah() untuk
 * tampilan.
 */

// Bound aman: cukup besar untuk semua transaksi harian, mencegah overflow/float aneh
const MAX_RUPIAH = 999_999_999;

/**
 * Validasi nominal Rupiah.
 * Wajib: number, integer (tanpa desimal), > 0, dan <= 999.999.999.
 * Mengembalikan boolean, TIDAK throw.
 *
 * @param n - Nilai yang akan divalidasi (unknown, biasanya dari input user)
 * @returns true jika valid Rupiah, false jika tidak
 */
export function validateRupiah(n: unknown): n is number {
  if (typeof n !== 'number') return false;
  if (!Number.isFinite(n)) return false;
  if (!Number.isInteger(n)) return false;
  if (n <= 0) return false;
  if (n > MAX_RUPIAH) return false;
  return true;
}

/**
 * Format nominal Rupiah untuk tampilan.
 * Output: "Rp 50.000" (pemisah ribuan locale id-ID).
 * Memastikan input sudah valid via validateRupiah terlebih dahulu.
 *
 * @param n - Nominal Rupiah (sudah divalidasi)
 * @returns String terformat, contoh "Rp 50.000"
 */
export function formatRupiah(n: number): string {
  if (!validateRupiah(n)) {
    // Fallback aman jika pemanggil tidak memvalidasi terlebih dahulu
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
