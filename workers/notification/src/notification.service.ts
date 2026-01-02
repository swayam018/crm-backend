import { Notification } from "./models/Notification";
import mongoose from "mongoose";
import { createClient } from "redis";

const pub = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});
await pub.connect();

export const NotificationService = {
    async createAndSend(userId: string, event: string, payload: any) {
        await Notification.create({
            userId,
            event,
            payload,
        });

        // Publish to WebSocket via PubSub
        await pub.publish(
            "notifications",
            JSON.stringify({ userId, payload })
        );
    }
};
