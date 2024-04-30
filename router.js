const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
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

  const user = Client.findOne({email});

  if(user == null || user == undefined) {
    res.json({message:"user not found, please signup", key:0});
  }

  else if(user.password == password){
    res.json({message:"Login successful", key:1});
  }

  else {
    res.json({message:"wrong password, try again", key:0});
  }
}

module.exports = {
  userSignup,
  userLogin,
};
