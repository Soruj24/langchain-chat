import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const email = "test.user@example.com";
const password = "TestPass123!";

await mongoose.connect(process.env.MONGODB_URI);
const users = mongoose.connection.collection("users");

const passwordHash = await bcrypt.hash(password, 12);
await users.updateOne(
  { email },
  {
    $set: {
      name: "Test User",
      email,
      passwordHash,
      role: "user",
      isActive: true,
      sessionVersion: 0,
    },
    $setOnInsert: { createdAt: new Date(), updatedAt: new Date() },
  },
  { upsert: true }
);

const user = await users.findOne({ email });
console.log(JSON.stringify({ id: user._id.toString(), email, role: user.role }));
await mongoose.disconnect();
