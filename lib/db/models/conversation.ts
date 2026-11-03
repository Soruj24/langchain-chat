import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const conversationSchema = new Schema(
  {
    /** LangGraph thread id. Unique so a thread can only belong to one user. */
    threadId: { type: String, required: true, unique: true, index: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "New chat", maxlength: 140 },
    messageCount: { type: Number, default: 0, min: 0 },
    humanMessageCount: { type: Number, default: 0, min: 0 },
    aiMessageCount: { type: Number, default: 0, min: 0 },
    /** Last model used by this thread. */
    model: { type: String, default: null },
    lastMessageAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

export type ConversationDocument = InferSchemaType<typeof conversationSchema>;

export const Conversation: Model<ConversationDocument> =
  (models.Conversation as Model<ConversationDocument> | undefined) ??
  model("Conversation", conversationSchema);

export type SafeConversation = {
  id: string;
  threadId: string;
  userId: string;
  title: string;
  messageCount: number;
  humanMessageCount: number;
  aiMessageCount: number;
  model: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};
