import mongoose from 'mongoose';
import Sport from './models/Sport.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('MONGO_URI:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sportslot')
  .then(async () => {
    console.log('Successfully connected to MongoDB.');
    try {
      const sports = await Sport.find({});
      console.log('Sports found in database:', sports);
    } catch (queryErr) {
      console.error('Error during query:', queryErr);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database connection error details:', err);
    process.exit(1);
  });
