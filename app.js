const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require('dotenv').config();
const {userSignup, userLogin} = require('./router');

const app = express();
const port = process.env.PORT || 7000;

app.use(bodyParser.json());
app.use(cors());

//all post requests here
app.post('/signup', userSignup);
app.post('/login', userLogin);

//all get requests here

app.listen(port, () => {
  console.log(`listening to port at ${port}`);
});