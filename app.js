const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require('dotenv').config();
const {userSignup, userLogin, userForgetPassword, restaurantUpload, restaurantFoodUpload, fetchFoods, addItemsToCart, fetchItemsToCart, updateCartItems, orderFoodItem, fetchOrders, fetchRestaurantOrders, viewRestaurantItem} = require('./router');

const app = express();
const port = process.env.PORT || 7000;

app.use(bodyParser.json());
app.use(cors());

//all post requests here
app.post('/signup', userSignup);
app.post('/login', userLogin);
app.post('/forget-password', userForgetPassword);
app.post('/add-to-cart', addItemsToCart);
app.post('/update-cart', updateCartItems);
app.post('/order-items', orderFoodItem);

//restaurant
app.post('/restaurant-upload', restaurantUpload);
app.post('/food-upload', restaurantFoodUpload);

//all get requests here
app.get('/fetch-foods', fetchFoods);
app.get('/fetch-items-to-cart', fetchItemsToCart);
app.get('/fetch-orders', fetchOrders);

//restaurant
app.get('/fetch-r-orders', fetchRestaurantOrders);
app.get('/fetch-r-items', viewRestaurantItem)

app.listen(port, () => {
  console.log(`listening to port at ${port}`);
});