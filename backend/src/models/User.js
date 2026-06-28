import { Schema, model } from 'mongoose';
import mongoose from 'mongoose';

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['citizen', 'staff', 'admin'],
    default: 'citizen',
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  fcmToken:{
    type:String,
    default:null,
  },
ratings: [
    {
      rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5, required: true },
      date: { type: Date, default: Date.now }
    }
  ],

  // rating:{
  //   type:Number,
  //   default:5,
  //   min: 1,
  //   max: 5
  // }
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
}, {
  timestamps: true, 
});

export default model('User', UserSchema);