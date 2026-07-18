import type { Bindings } from "../../types";
import type { QueueMessage } from "../types";
import { processQueueMessage } from "../services/processing";

export async function handleMedGeniusQueue(
  batch: MessageBatch<QueueMessage>,
  env: Bindings
): Promise<void> {
  for (const message of batch.messages) {
    try {
      await processQueueMessage(env, message.body);
      message.ack();
    } catch (error) {
      console.error("MedGenius queue processing failed:", error);
      message.retry();
    }
  }
}
