import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Types.ObjectId, required: true },
        event: { type: String, required: true },
        payload: { type: Object, required: true },
        isRead: { type: Boolean, default: false }
    },
    { timestamps: true }
);

export const Notification = mongoose.model("Notification", NotificationSchema);