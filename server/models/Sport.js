const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model('Sport', sportSchema);
