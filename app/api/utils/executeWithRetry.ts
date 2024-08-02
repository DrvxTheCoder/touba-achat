import { setTimeout } from 'timers/promises';

export async function executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        console.error(`Attempt ${i + 1} failed: ${error}`);
        lastError = error;
        await setTimeout(delay);
      }
    }
    throw lastError;
  }