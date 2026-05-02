// ─── Coin Store Interface ──────────────────────────────────────────────────
// Phase 3: Replace with KV/D1 implementation
//
// Stores:
//   - balances: Map<userId, coins>
//   - transactions: CoinTransaction[]
//   - lastSpin: Map<userId, timestamp>

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend' | 'spin_win' | 'bonus' | 'admin_grant';
  description: string;
  timestamp: number;
}

export interface SpinResult {
  won: number;
  multiplier: number;
  balance: number;
  nextSpinAt: number;
}

export interface CoinStore {
  getBalance(userId: string): Promise<number>;
  addCoins(userId: string, amount: number, type?: CoinTransaction['type']): Promise<number>;
  spendCoins(userId: string, amount: number): Promise<{ success: boolean; balance: number }>;
  getTransactions(userId: string, limit?: number): Promise<CoinTransaction[]>;
  getSpinResult(userId: string): Promise<SpinResult>;
  getAllBalances(): Promise<{ userId: string; balance: number }[]>;
}

// ─── In-Memory Implementation ──────────────────────────────────────────────

export class MemCoinStore implements CoinStore {
  private balances = new Map<string, number>();
  private transactions: CoinTransaction[] = [];
  private lastSpin = new Map<string, number>();

  async getBalance(userId: string): Promise<number> {
    return this.balances.get(userId) ?? 100; // Start with 100 free coins
  }

  async addCoins(userId: string, amount: number, type: CoinTransaction['type'] = 'earn'): Promise<number> {
    const current = await this.getBalance(userId);
    const newBalance = current + amount;
    this.balances.set(userId, newBalance);
    this.transactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      amount,
      type,
      description: `Earned ${amount} coins`,
      timestamp: Date.now(),
    });
    return newBalance;
  }

  async spendCoins(userId: string, amount: number): Promise<{ success: boolean; balance: number }> {
    const current = await this.getBalance(userId);
    if (current < amount) return { success: false, balance: current };
    const newBalance = current - amount;
    this.balances.set(userId, newBalance);
    this.transactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      amount,
      type: 'spend',
      description: `Spent ${amount} coins`,
      timestamp: Date.now(),
    });
    return { success: true, balance: newBalance };
  }

  async getSpinResult(userId: string): Promise<SpinResult> {
    const last = this.lastSpin.get(userId) ?? 0;
    const now = Date.now();
    const cooldown = 3600000; // 1 hour

    if (now - last < cooldown) {
      const remaining = Math.ceil((cooldown - (now - last)) / 60000);
      throw new Error(`Spin available in ${remaining} minutes`);
    }

    const prizes = [5, 10, 10, 15, 15, 25, 50, 100];
    const won = prizes[Math.floor(Math.random() * prizes.length)];
    const multiplier = won >= 50 ? 2 : 1;
    const totalWon = won * multiplier;

    await this.addCoins(userId, totalWon, 'spin_win');
    this.lastSpin.set(userId, now);

    return {
      won: totalWon,
      multiplier,
      balance: await this.getBalance(userId),
      nextSpinAt: now + cooldown,
    };
  }

  async getTransactions(userId: string, limit = 50): Promise<CoinTransaction[]> {
    return this.transactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async getAllBalances(): Promise<{ userId: string; balance: number }[]> {
    return Array.from(this.balances.entries()).map(([userId, balance]) => ({ userId, balance }));
  }
}

// Singleton instance
export const coinStore: CoinStore = new MemCoinStore();
