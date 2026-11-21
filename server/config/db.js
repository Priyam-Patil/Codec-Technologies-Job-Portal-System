import mongoose from 'mongoose';
let pending;
export default async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!pending) pending = mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 10000 }).catch(error => { pending = undefined; throw error; });
  return pending;
}
