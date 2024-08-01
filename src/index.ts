import { createClient, RedisClientType } from "redis";

export class PubSubManager {
  private static instance: PubSubManager;
  private redisClient: RedisClientType;
  private subscriptions: Map<string, string[]>;

  static getInstance() {
    if (!this.instance) {
      this.instance = new PubSubManager();
    }
    return this.instance;
  }

  private constructor() {
    this.redisClient = createClient();
    this.redisClient.connect();
    this.subscriptions = new Map<string, string[]>();
  }

  public userSubscribe(userId: string, stockId: string) {
    if (!this.subscriptions.has(stockId)) {
      this.subscriptions.set(stockId, []);
    }

    if (!this.subscriptions.get(stockId)?.includes(userId)) {
      this.subscriptions.get(stockId)?.push(userId);
    }

    const subLength = this.subscriptions.get(stockId)?.length || 0;

    if (subLength === 1) {
      this.redisClient.subscribe(stockId, (message) => {
        this.handleMessage(message, stockId);
      });
    }
  }

  public userUnsubscribe(userId: string, stockId: string) {
    const prevArray = this.subscriptions.get(stockId) || [];
    const newArray = prevArray?.filter((user) => user !== userId);

    this.subscriptions.set(stockId, [...newArray]);

    if (this.subscriptions.get(stockId)?.length === 0) {
      this.redisClient.unsubscribe(stockId);
      console.log(`UnSubscribed to Redis channel: ${stockId}`);
    }
  }

  public async handleMessage(message: string, stockId: string) {
    console.log(`Message recieved on channel ${stockId}: ${message}`);

    this.subscriptions.get(stockId)?.forEach((user) => {
      console.log(`Sending message to user ${user} about stock: ${stockId}`);
    });
  }

  public async disconnect() {
    await this.redisClient.disconnect();
  }
}
