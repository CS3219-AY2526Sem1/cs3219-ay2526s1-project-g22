import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB || "peerprep";

let client: MongoClient | undefined;
let db: Db | undefined;

export async function connectToMongo() {
  if (!client) {
    console.log(`[MongoDB] Attempting to connect. URI: ${uri}, DB: ${dbName}`);
    try {
      client = new MongoClient(uri);
      await client.connect();
      db = client.db(dbName);
      console.log(`[MongoDB] Connected successfully to database: ${dbName}`);
    } catch (err) {
      console.error(`[MongoDB] Connection error:`, err);
      throw err;
    }
  }
  return db;
}

export function getDb() {
  if (!db) {
    console.error(`[MongoDB] getDb called but no connection established.`);
    throw new Error("MongoDB not connected!");
  }
  return db;
}
