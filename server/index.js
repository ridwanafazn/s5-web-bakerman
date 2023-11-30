// const express = require('express');
// const mongoose = require('mongoose');
// const dotenv = require("dotenv");
// const cors = require("cors");
// const usersRouter = require('./routes/users');

// dotenv.config();
// const app = express();

// mongoose.connect(process.env.MONGO_URL)
//     .then(() => {
//         console.log('Connected to MongoDB');
//     })
//     .catch((error) => {
//         console.log(error);
//     });

// app.use(cors());
// app.use(express.json());

// app.get('/', (req, res) => {
//     res.send('Hello, this is the root page!');
//   });
  
// app.use('/api/users', usersRouter);


// const PORT = process.env.PORT || 8899;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

// module.exports = app;

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import UserRoute from "./routes/UserRoute.js";
 
const app = express();
mongoose.connect('mongodb+srv://ridwanafazn:12323434rafzn@bakerman-mern.pxbbd3w.mongodb.net/',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', (error) => console.log(error));
db.once('open', () => console.log('Database Connected...'));
 
app.use(cors());
app.use(express.json());
app.use(UserRoute);
 
app.listen(5000, ()=> console.log('Server up and running...'));