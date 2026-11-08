import { config } from '@p11/config';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

console.log(`[P11 Worker] Initializing background task engine...`);

let redisConnection: IORedis | null = null;

try {
  redisConnection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 500, 5000);
      return delay;
    },
  });

  redisConnection.on('connect', () => {
    console.log(`[P11 Worker] Connected to Redis queue broker at ${config.REDIS_URL}`);
  });

  redisConnection.on('error', (err) => {
    console.warn(`[P11 Worker] Redis connection warning: ${err.message}. Worker operating in standby.`);
  });
} catch (error) {
  console.warn(`[P11 Worker] Could not connect to Redis:`, error);
}

// Queue definitions
export const REQUEST_EXPIRY_QUEUE = 'request-expiry';
export const ENGAGEMENT_EVALUATOR_QUEUE = 'engagement-evaluator';
export const CAPACITY_RECONCILER_QUEUE = 'capacity-reconciler';

export function setupWorkers() {
  if (!redisConnection) return;

  const expiryWorker = new Worker(
    REQUEST_EXPIRY_QUEUE,
    async (job) => {
      console.log(`[P11 Worker] Processing expired request job: ${job.id}`);
      // Request auto-expiry logic
      return { status: 'completed' };
    },
    { connection: redisConnection }
  );

  expiryWorker.on('completed', (job) => {
    console.log(`[P11 Worker] Job ${job.id} completed successfully.`);
  });
}

setupWorkers();

