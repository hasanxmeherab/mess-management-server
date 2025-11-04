import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file (if you use one)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // API commonly runs on port 5000

// Middleware
app.use(cors()); // Allows frontend (localhost:3000) to talk to backend
app.use(express.json()); // Allows parsing of JSON request bodies

// --- ROUTES ---

// Simple test route
app.get('/', (req, res) => {
  res.send('Mess Manager API is running!');
});

// Example API route for external (non-Firebase) data
// app.use('/api/v1/users', userRoutes); 
// app.use('/api/v1/payments', paymentRoutes); 

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});