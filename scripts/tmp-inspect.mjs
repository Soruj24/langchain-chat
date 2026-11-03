import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
for (const name of ["users", "conversations", "activities", "aisettings", "systemsettings"]) {
  console.log(name, await db.collection(name).countDocuments());
}
console.log("users:", (await db.collection("users").find({}).toArray()).map((u) => ({ email: u.email, role: u.role, createdAt: u.createdAt })));
const acts = await db.collection("activities").find({}).sort({ createdAt: -1 }).limit(20).toArray();
console.log("activities:", acts.map((a) => ({ action: a.action, targetId: a.targetId, actorId: String(a.actorId), at: a.createdAt })));
await mongoose.disconnect();
