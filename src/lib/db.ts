import mongoose from "mongoose";

const g = global as unknown as { _mongoose?: { conn: typeof mongoose | null; p: Promise<typeof mongoose> | null } };
const cache = (g._mongoose ??= { conn: null, p: null });

export async function connectDB() {
  if (cache.conn) return cache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local.");
  cache.p ??= mongoose.connect(uri, { bufferCommands: false });
  cache.conn = await cache.p;
  return cache.conn;
}
