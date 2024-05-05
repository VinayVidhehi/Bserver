const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const Restaurant = require('./models/restaurantSchema');
const bcrypt = require("bcryptjs");
const Food = require('./models/foodSchema');
const Cart = require("./models/cartSchema");
const Client = require("./models/clientSchema");
const Order = require("./models/orderSchema");
require("dotenv").config();
const saltRounds = 10;

let array = [];

try {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((error) => {
      console.log("Connection to MongoDB failed: ", error.message);
    });
} catch (error) {
  console.log("Error outside promise: ", error.message);
}

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

//initialisation
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDER_MAIL_ID,
    pass: process.env.SENDER_MAIL_SECRET_KEY,
  },
});

//set mail id and otp to send the email to
const mailOptions = (email, otp) => {
  console.log("the email is sss", email, otp);
  return {
    from: process.env.SENDER_MAIL_ID,
    to: email,
    subject: "OTP verification for BudgetFoods sign up",
    text: `Your OTP for email verification is: ${otp}`,
  };
};

// Send email with response
// Send email with response
async function sendEmail(email, otp) {
  try {
    await transporter.sendMail(mailOptions(email, otp));
    console.log("Email sent successfully");
    return 1;
  } catch (error) {
    console.error("Error sending email:", error);
    return 0;
  }
}


const userSignup = async (req, res) => {
  const { key } = req.body;

  //send otp for email verification after ensuring the email isnt registered
  if (key <= 1) {
    //handle sending otp and saving copy of the otp locally
    if (key == 0) {
      //take user email from request
      const { email } = req.body;
      
      const foundEmail = await Client.findOne({ email });

      //if email found ask them to login instead
      if (foundEmail != undefined || foundEmail != null) {
        res.json({
          message: "entered email is already registered, please login instead",
        key:0});
      }

      else {
        //here if there is a otp in the array with this email previously delete it
      array = array.filter((userOtp) => userOtp.email != email);

      const otp = generateOTP();
      array.push({ email, otp });
      console.log("the array is ",array, email);
      const response = sendEmail(email, otp);
      if(response == 0) res.json({message:'error while sending otp, please try again later', key:0});
      else res.json({message:'otp sent successfully, please check your mail and enter the otp to proceed', key:1})
      }
    }

    //check whether otp matches or not
    else if (key == 1) {
      const {otp, email} = req.body;
            
      const storedOtp = array.find((userOtp) => userOtp.email == email);
      console.log("stored otp is ",storedOtp);
      if(storedOtp.otp == otp) {
        res.json({message:"email verified successfully, please fill the details to signup", key : 1});
      }
      else {
        res.json({message:"entered otp does not match, please check and try again", key:0});
      }
    }
  }

  //save credentials once email verified
  else {
    const {email, name, password} = req.body;
    const newUser = new Client({
      email,
      name,
      password,
    })

    const response = await newUser.save();
    console.log("reesponse for saving user is ", response);
    res.json({message:"crendentials stored successfully, enjoy food within your budget", key:1})
  }
};

const userLogin = async (req, res) => {
  const {email, password} = req.body;

  const user = await Client.findOne({email});
  console.log("user is ", email, user);

  if(user == null || user == undefined) {
    res.json({message:"user not found, please signup", key:0});
  }

  else if(user.password == password){
    console.log("at login succesful")
    res.json({message:"Login successful", key:1});
  }

  else {
    res.json({message:"wrong password, try again", key:0});
  }
}

const userForgetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    // Find the user by email
    const userFound = await Client.findOne({ email });

    // If user not found, return error message
    if (!userFound) {
      return res.json({ message: "User not found. Please sign up first.", key:0 });
    }

    // Update the user's password
    await Client.findOneAndUpdate({ email }, { password: newPassword });

    // Return success message
    return res.json({ message: "Password updated successfully.", key:1 });
  } catch (error) {
    // Handle errors
    console.error("Error updating password:", error);
    return res.status(500).json({ message: "Internal server error", key:0 });
  }
};

// Function to handle upload of single or multiple food items
const restaurantFoodUpload = async (req, res) => {
  try {
    const foods = req.body.foods; // Assuming the request body contains an array of food items
    const isMultiple = Array.isArray(foods); // Check if multiple food items are provided
    
    if (isMultiple) {
      // Inserting multiple food items into the database
      const result = await Food.insertMany(foods);
      res.json({ key: 1, message: `${result.length} food items stored successfully` });
    } else {
      // Creating a new food document for a single food item
      const newFood = new Food(foods);
      await newFood.save(); // Saving the new food item to the database
      res.json({ key: 1, message: 'Food item stored successfully' });
    }
  } catch (error) {
    res.json({ key: 0, message: 'Error storing food items' });
  }
};

const restaurantUpload = async (req, res) => {
  try {
    const restaurantData = req.body.restaurants; // Assuming the request body contains restaurant information or an array of restaurant information
    if (Array.isArray(restaurantData)) {
      // If the request body contains an array of restaurant information
      await Restaurant.insertMany(restaurantData); // Inserting multiple restaurants to the database
    } else {
      // If the request body contains single restaurant information
      const newRestaurant = new Restaurant(restaurantData);
      await newRestaurant.save(); // Saving the new restaurant information to the database
    }
    res.json({ key: 1, message: 'Restaurant information stored successfully' });
  } catch (error) {
    res.json({ key: 0, message: 'Error storing restaurant information' });
  }
};

const fetchFoods = async (req, res) => {
  try {
    const foods = await Food.find();
    res.json({ key: 1, message: "Food fetched successfully", foods });
  } catch (error) {
    res.json({ key: 0, message: "Error fetching food items" });
  }
};

const addItemsToCart = async (req, res) => {
  try {
    // Extract email and food item ID from request body
    const { email, food } = req.body;

    const foodId = food._id;

    // Find the cart associated with the user's email
    let cart = await Cart.findOne({ email });

    // If cart doesn't exist, create a new one
    if (!cart) {
      cart = new Cart({ email, items: [] });
    }

    // Check if the food item already exists in the cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.foodItem.toString() === foodId.toString()
    );

    // If the item already exists in the cart, send a message and return
    if (existingItemIndex !== -1) {
      return res.status(200).json({
        message: 'Food item already exists in the cart',
        key: 1,
      });
    }

    // Find the food item by its ID
    const foodItem = await Food.findById(foodId);

    // If food item doesn't exist, return an error
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found', key: 0 });
    }

    // Add the food item to the cart
    cart.items.push({ foodItem: foodItem._id });

    // Save the updated cart document
    await cart.save();

    // Send success response
    res.status(200).json({
      message: 'Food item added to cart successfully',
      key: 1,
    });
  } catch (error) {
    // Handle errors
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      message: 'An error occurred while adding item to cart',
      key: 0,
    });
  }
};

const fetchItemsToCart = async (req, res) => {
  try {
    console.log("am i here at fetch cart items?");
    // Extract email from request query
    const { email } = req.query;
    console.log("email is ",email);

    // Find the cart associated with the user's email and populate the foodItem field
    const cart = await Cart.findOne({ email }).populate('items.foodItem');

    // If cart doesn't exist, return an error
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Extract items from the cart
    const items = cart.items.map(item => ({
      id: item._id,
      foodItem: item.foodItem,
      quantity: item.quantity
    }));

    // Send the items in the cart as response
    res.status(200).json({ items });
  } catch (error) {
    // Handle errors
    console.error('Error fetching items from cart:', error);
    res.status(500).json({ message: 'An error occurred while fetching items from cart' });
  }
};

const orderFoodItem = async (req, res) => {
  try {
    const { email } = req.body;

    // Retrieve cart items associated with the user's email
    const cartItems = await Cart.findOne({ email });

    // Create a new order instance
    const order = new Order({
      userEmail: email,
      cart: cartItems.items // Assuming cart items are stored in the 'items' field of the Cart model
    });

    // Save the new order to the database
    await order.save();

    res.status(201).json({ message: 'Order placed successfully' });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Failed to place order' });
  }
};

const fetchOrders = async (req, res) => {
  try {
    const { email } = req.query;

    // Find orders associated with the user's email and sort them by creation date in descending order
    const userOrders = await Order.find({ userEmail: email }).sort({ createdAt: -1 });

    res.status(200).json({message:"orders fetched successfully", userOrders});
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

module.exports = { fetchOrders };


const updateCartItems = async (req, res) => {
  try {
    const { email, cart } = req.body;

    // Find the existing cart associated with the user's email
    let existingCart = await Cart.findOne({ email });

    // If no existing cart found, return error
    if (!existingCart) {
      return res.status(404).json({ message: 'Cart not found for the user', key: 0 });
    }

    // Iterate through the items in the existing cart
    existingCart.items.forEach(existingItem => {
      // Find the corresponding item in the new cart, if any
      const newItem = cart.find(newItem => newItem.foodItem.toString() === existingItem.foodItem.toString());

      if (newItem) {
        // If the item exists in the new cart, update its quantity
        existingItem.quantity = newItem.quantity;
      } else {
        // If the item does not exist in the new cart, remove it from the existing cart
        existingCart.items = existingCart.items.filter(item => item.foodItem.toString() !== existingItem.foodItem.toString());
      }
    });

    // Add any new items from the new cart to the existing cart
    cart.forEach(newItem => {
      const existingItem = existingCart.items.find(item => item.foodItem.toString() === newItem.foodItem.toString());
      if (!existingItem) {
        existingCart.items.push(newItem);
      }
    });

    // Save the updated cart
    await existingCart.save();

    return res.status(200).json({ message: 'Cart items updated successfully', key: 1 });
  } catch (error) {
    console.error('Error updating cart items:', error);
    return res.status(500).json({ message: 'An error occurred while updating cart items', key: 0 });
  }
};

module.exports = {
  userSignup,
  userLogin,
  userForgetPassword,
  restaurantFoodUpload,
  restaurantUpload,
  fetchFoods,
  addItemsToCart,
  fetchItemsToCart,
  updateCartItems,
  orderFoodItem,
};
