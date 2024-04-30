const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  foodItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food', // Reference to the Food model
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1 // Default quantity is 1 if not specified
  }
});

const orderSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  items: [orderItemSchema], // Array of order items
  totalAmount: {
    type: Number,
    required: true
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
