import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const activitySchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, default: null },
    targetId: { type: String, default: null },
    description: { type: String, default: "", maxlength: 500 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ createdAt: -1 });

export type ActivityDocument = InferSchemaType<typeof activitySchema>;

export const ActivityLog: Model<ActivityDocument> =
  (models.ActivityLog as Model<ActivityDocument> | undefined) ??
  model("ActivityLog", activitySchema);

export type SafeActivity = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  description: string;
  createdAt: string;
};
