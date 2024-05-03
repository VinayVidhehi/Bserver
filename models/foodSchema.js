const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  restaurantId: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
  },
  price: {
    type: Number,
  },
  ingredients: {
    type: [String],
  },
  allergens: {
    type: [String],
  },
  calories: {
    type: Number,
  },
  image: {
    type: String,
  },
  origin: {
    type: String,
  },
});

const Food = mongoose.model("Food", foodSchema);

module.exports = Food;
