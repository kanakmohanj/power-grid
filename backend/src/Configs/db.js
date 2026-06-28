import { connect } from 'mongoose';
import {startDeadlineCron } from '../firebase/SendNotification.js';

const connectDB = async () => {
  try {
    const conn = await connect(process.env.MONGO_URI);
     console.log("sendotification function invoked");
     startDeadlineCron();
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;