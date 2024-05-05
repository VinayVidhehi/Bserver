const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const Restaurant = require('./models/restaurantSchema');
const bcrypt = require("bcryptjs");
const Food = require('./models/foodSchema');
const Cart = require("./models/cartSchema");
const Client = require("./models/clientSchema");
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

const addItemsToCart =  async (req, res) => {
  // const { email, food } = req.body;
  // console.log(food);
  // res.json({message:"successfull"});

  try {
    // Extract email and food item ID from request body
    const { email, food } = req.body;

    const foodId = food._id
    //Find the cart associated with the user's email
    let cart = await Cart.findOne({ email });

    // If cart doesn't exist, create a new one
    if (!cart) {
      cart = new Cart({ email, items: [] });
    }

    // Find the food item by its ID
    const foodItem = await Food.findById(foodId);

    // If food item doesn't exist, return an error
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    // Add the food item to the cart
    cart.items.push({ foodItem: foodItem._id });

    // Save the updated cart document
    await cart.save();

    // Send success response
    res.status(200).json({ message: 'Food item added to cart successfully' });
  } catch (error) {
    // Handle errors
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: 'An error occurred while adding item to cart' });
  }
}

const fetchItemsToCart = async (req, res) => {
  try {
    // Extract email from request query
    const { email } = req.query;

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



module.exports = {
  userSignup,
  userLogin,
  userForgetPassword,
  restaurantFoodUpload,
  restaurantUpload,
  fetchFoods,
  addItemsToCart,
  fetchItemsToCart,
};
