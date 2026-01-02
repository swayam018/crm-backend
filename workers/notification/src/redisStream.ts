import { createClient } from "redis";

export const redisStream = createClient({
    url: "redis://localhost:6379"
});

export const STREAM = "crm_events";
export const GROUP = "notification_group";
export const CONSUMER = "worker_1";

export async function initRedisStream() {
    await redisStream.connect();

    // Create group once
    try {
        await redisStream.xGroupCreate(STREAM, GROUP, "0", { MKSTREAM: true });
    } catch (err) {
        // group already exists
    }

    console.log("📥 Worker attached to Redis Stream");
}
