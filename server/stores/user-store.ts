// ─── User Store Interface ──────────────────────────────────────────────────
// Phase 3: Replace with KV/D1 implementation
//
// Stores:
//   - users: Map<userId, User>
//   - usage: Map<`${userId}:${date}`, count>

export interface User {
  id: string;
  username: string;
  apiKey: string;
  dailyLimit: number;
  joinedAt: number;
  isAdmin: boolean;
  active: boolean;
}

export interface UserStore {
  createUser(username: string, dailyLimit?: number): Promise<User>;
  getUser(apiKey: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  setLimit(userId: string, limit: number): Promise<void>;
  toggleActive(userId: string, active: boolean): Promise<void>;
  getUsage(userId: string, date: string): Promise<number>;
  incrementUsage(apiKey: string): Promise<number>;
  getAllUsers(): Promise<User[]>;
  getDailyStats(date: string): Promise<{ totalRequests: number; uniqueUsers: number }>;
}

// ─── In-Memory Implementation ──────────────────────────────────────────────

export class MemUserStore implements UserStore {
  private users = new Map<string, User>();
  private usage = new Map<string, number>(); // key: `${userId}:${date}`

  async createUser(username: string, dailyLimit = 50): Promise<User> {
    const id = `user_${Date.now()}`;
    const apiKey = `megan_${Math.random().toString(36).slice(2, 14)}`;
    const user: User = {
      id,
      username,
      apiKey,
      dailyLimit,
      joinedAt: Date.now(),
      isAdmin: false,
      active: true,
    };
    this.users.set(id, user);
    return user;
  }

  async getUser(apiKey: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.apiKey === apiKey && user.active) return user;
    }
    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async setLimit(userId: string, limit: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.dailyLimit = limit;
      this.users.set(userId, user);
    }
  }

  async toggleActive(userId: string, active: boolean): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.active = active;
      this.users.set(userId, user);
    }
  }

  async getUsage(userId: string, date: string): Promise<number> {
    return this.usage.get(`${userId}:${date}`) ?? 0;
  }

  async incrementUsage(apiKey: string): Promise<number> {
    const user = await this.getUser(apiKey);
    if (!user) return 0;
    const today = new Date().toISOString().split('T')[0];
    const key = `${user.id}:${today}`;
    const current = this.usage.get(key) ?? 0;
    const next = current + 1;
    this.usage.set(key, next);
    return next;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getDailyStats(date: string): Promise<{ totalRequests: number; uniqueUsers: number }> {
    let totalRequests = 0;
    const activeUsers = new Set<string>();
    for (const [key, count] of this.usage.entries()) {
      if (key.endsWith(`:${date}`)) {
        totalRequests += count;
        activeUsers.add(key.split(':')[0]);
      }
    }
    return { totalRequests, uniqueUsers: activeUsers.size };
  }
}

// Singleton instance
export const userStore: UserStore = new MemUserStore();
