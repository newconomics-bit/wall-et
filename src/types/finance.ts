/**
 * Data Model — wall-et
 * PRD §4: Wallet, Transaction, QuickTemplate, Loan, Budget, Settings
 * Semua nominal = Rupiah Rupiah (tanpa float/desimal). Saldo tidak disimpan,
 * selalu dihitung atomik dari transaksi (PRD §5.1).
 */

export type WalletType = 'cash' | 'bank' | 'ewallet';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  color: string;
  icon: string;
  isArchived: boolean;
}

export type TransactionType =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'loan_out'
  | 'loan_repay'
  | 'debt_in'
  | 'debt_repay'
  | 'adjustment';

export type TransactionDirection = 'in' | 'out';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: Rupiah; // > 0, Rupiah
  adminFee?: Rupiah; // transfer
  feeAmount?: Rupiah; // debt_repay
  walletId?: string; // wajib kecuali debt_in mode kredit
  toWalletId?: string; // transfer
  categoryId?: string;
  note?: string;
  date: string; // ISO string, default hari ini
  source: 'manual' | 'auto_notif';
  loanId?: string; // mutasi hutang/piutang
  groupId?: string; // mutasi yang lahir dari satu aksi (Talangan / PayLater)
}

export interface QuickTemplate {
  id: string;
  type: 'expense' | 'income' | 'transfer';
  title: string;
  amount?: Rupiah; // kosong/0 → buka modal prefill
  categoryId: string;
  walletId: string;
  toWalletId?: string;
  adminFee?: Rupiah; // transfer
  icon: string;
}

export type LoanDirection = 'piutang' | 'hutang';
export type LoanMode = 'cash' | 'credit';
export type LoanStatus = 'open' | 'partial' | 'lunas';

export interface Loan {
  id: string;
  direction: LoanDirection;
  mode?: LoanMode; // untuk hutang
  counterparty: string;
  principal: Rupiah;
  walletId?: string; // kosong untuk hutang kredit
  dueDate?: string; // ISO string, opsional
  note?: string;
  status: LoanStatus;
}

export interface Budget {
  id: string;
  categoryId: string; // kategori expense saja, termasuk Biaya Admin
  limit: Rupiah; // per siklus aktif
}

export interface Settings {
  cycleStartDay: Rupiah; // 1–28, default 1
  theme: ThemeName; // 'dark' | 'light', default dark
  isBalanceHidden: boolean; // persist
  biometricEnabled: boolean;
  autoApprove: boolean; // default OFF
  packageToWallet: Record<string, string>; // mapping package → dompet
  lastBackupAt?: string; // ISO string
}

export type ThemeName = 'dark' | 'light';

// Nominal Rupiah selalu Rupiah (tanpa float/desimal), PRD §5 & .kilocoderules #5
export type Rupiah = number;

export interface CycleRange {
  start: string; // ISO date
  end: string; // ISO date
  daysRemaining: Rupiah; // clamp minimal 1
}
