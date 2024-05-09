const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  landmark: {
    type: String,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'others'],
  },
  contact: {
    type: String,
    match: /^\d{10}$/, // Regular expression for a 10-digit number
  },
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
