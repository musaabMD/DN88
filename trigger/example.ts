import { logger, task } from "@trigger.dev/sdk";

export const helloWorldTask = task({
  id: "hello-world",
  run: async (payload: { name?: string }) => {
    const name = payload.name?.trim() || "world";
    logger.info("Hello from Trigger.dev", { name });
    return {
      message: `Hello ${name}!`,
      timestamp: new Date().toISOString(),
    };
  },
});
