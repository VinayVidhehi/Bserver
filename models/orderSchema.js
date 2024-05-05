const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true
  },
  cart: {
    type: [{
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
    }],
    required: true
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
