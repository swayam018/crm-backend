import mongoose from "mongoose";
import { initRedisStream, redisStream, STREAM, GROUP, CONSUMER } from "./redisStream";
import { NotificationService } from "./notification.service";
import dotenv from "dotenv";

type StreamMessage = {
    id: string;
    message: unknown;
};

type StreamEntry = {
    name: string;
    messages: StreamMessage[];
};

function isStreamEntryArray(value: unknown): value is StreamEntry[] {
    return Array.isArray(value) && value.every((stream) => {
        if (!stream || typeof stream !== "object") return false;
        const messages = (stream as { messages?: unknown }).messages;
        return Array.isArray(messages);
    });
}

function toKeyValueEntries(message: unknown): Iterable<[string, string]> {
    if (message instanceof Map) {
        return message as Map<string, string>;
    }
    if (Array.isArray(message)) {
        return message as [string, string][];
    }
    if (message && typeof message === "object") {
        return Object.entries(message as Record<string, string>);
    }
    throw new Error("Unsupported Redis message format");
}


async function startWorker() {
    dotenv.config();
    await mongoose.connect(process.env.MONGO_URI!);
    await initRedisStream();

    console.log("🚀 Notification Worker started.");

    while (true) {
        const response = await redisStream.xReadGroup(
            GROUP,
            CONSUMER,
            [{ key: STREAM, id: ">" }],
            { COUNT: 10, BLOCK: 5000 }
        );

        if (!response) continue;
        if (!isStreamEntryArray(response)) {
            console.warn("Unexpected Redis response", response);
            continue;
        }

        for (const stream of response) {
            for (const msg of stream.messages) {
                const data = Object.fromEntries(toKeyValueEntries(msg.message));
                const event = data.event;
                const payload = JSON.parse(data.payload);

                // Simple example: notify only the user who didn't update it
                const notifyUsers = [payload.updatedBy]; // Replace with real logic

                for (const userId of notifyUsers) {
                    await NotificationService.createAndSend(userId, event, payload);
                }
                await redisStream.xAck(STREAM, GROUP, msg.id);
            }
        }
    }
}

startWorker();
