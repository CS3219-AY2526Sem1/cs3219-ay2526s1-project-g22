import { connectToMongo } from "../lib/mongodb-client";

export async function resetQuestionsCollection() {
  const db = await connectToMongo();
  if (!db) {
    throw new Error("Failed to connect to MongoDB");
  }
  await db.collection("questions").deleteMany({});
}
