import mongoose from 'mongoose';

const sportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  isActive: { type: Boolean, default: true },
});

const Sport = mongoose.model('Sport', sportSchema);
export default Sport;
