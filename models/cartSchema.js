const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
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

const cartSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  items: [cartItemSchema] // Array of cart items
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
