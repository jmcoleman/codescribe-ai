import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

//const corsOptions = {
//  origin: process.env.NODE_ENV === 'production' 
//    ? 'https://codescribe-ai.vercel.app'
//    : 'http://localhost:5173',
//  credentials: true
//};

app.use(cors());
//app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
