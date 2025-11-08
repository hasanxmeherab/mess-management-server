import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import messRoutes from './routes/messRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
// IMPORTANT: Set your connection string in a .env file:
// MONGODB_URI=mongodb://localhost:27017/mess_manager_db
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mess_manager_db'; 

// --- 1. MONGODB SETUP ---
try {
  await mongoose.connect(MONGODB_URI);
  console.log('Successfully connected to MongoDB.');
} catch (error) {
  console.error('MongoDB connection error:', error);
  process.exit(1);
}

// --- 2. MESS SCHEMA ---
const MemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  deposit: { type: Number, default: 0 },
  // Key: YYYY-MM-DD_B/L/D, Value: 0 or 1
  meals: { type: Map, of: Number, default: {} }, 
});

const ExpenseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Number, required: true }, // Timestamp
  addedBy: { type: String, required: true },
});

const MessSchema = new mongoose.Schema({
  messId: { type: String, required: true, unique: true }, // The public ID
  name: { type: String, required: true },
  // Key: Firebase User UID
  members: { type: Map, of: MemberSchema, default: {} }, 
  expenses: [ExpenseSchema],
  adminUid: { type: String, required: true },
  joinKey: { type: String, required: true, select: false }, // Don't expose this by default
});

const Mess = mongoose.model('Mess', MessSchema);

// --- 3. MIDDLEWARE & ROUTES SETUP ---
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/', (req, res) => {
  res.send('Mess Manager API is running and connected to MongoDB!');
});

// Pass the Mongoose Model to the router
app.use('/api/v1/mess', messRoutes(Mess)); 

// --- 4. START SERVER ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});