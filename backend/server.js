import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './src/Configs/db.js';
import { protect, authorizeRoles } from './src/middlewares/auth.js';
import User from './src/models/User.js';
import "./src/queues/worker.js";


connectDB();

import authRoutes from './src/routes/authRouts.js';
import complaintRoutes from './src/routes/complaintRoutes.js';
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import userRoutes from './src/routes/userRoutes.js';
import { saveFcmToken } from './src/controllers/userController.js';
import {saveNotificationToken} from "./src/firebase/SaveNotification.js"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chatRouts from './src/routes/chatRouts.js'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


import commentRoutes from "./src/routes/commentRoutes.js"
// import saveNotificationToken from "./src/firebase/routes.js"
const app = express();
console.log(">>> THIS SERVER FILE IS RUNNING:", __filename);
console.log(">>> WORKING DIRECTORY:", process.cwd());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ["https://frontend-production-9e21.up.railway.app","https://courteous-amazement-production-bee7.up.railway.app","http://localhost:3000","http://localhost:5173", "http://localhost:5174"],
  credentials:true
}));


app.get('/', (req, res) => {
  res.send('Server is working');
});


app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use('/api/users', userRoutes);
app.post("/api/v1/save-token",protect,saveFcmToken)
// app.post("/api/complaint/",async(req,res)=>{
app.use("/api/chat",chatRouts)   

// })
app.post('/api/users/:id/rate', protect, async (req, res) => {
  const staffId = req.params.id;
  const raterId = req.user._id; 
  const { rating } = req.body;
  console.log(rating);
  console.log("staffid",staffId, 'typeof:', typeof staffId)
  console.log("userid",raterId)
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Invalid rating value' });
  }
// app.use("/api/v1/save-token",saveNotificationToken)





  try {
    const staff = await User.findById(staffId);
    console.log("finding staff in rating route")
    if (!staff) {
      return res.status(404).json({ message: 'Staff user not found' });
    }
   console.log("staff found");
    staff.ratings.push({ rater: raterId, rating, date: new Date() });
    console.log("rating pushed");
    await staff.save();
    console.log("rating saved");
    return res.status(200).json({ message: 'Rating saved', ratings: staff.ratings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

import testQueueRoutes from "./src/routes/testQueueRoutes.js";
app.use("/api/test", testQueueRoutes);
app.use("/api/comments", commentRoutes);
// export default router;
// app.use('/api/hi',(req,res)=>{
//   res.send('hi')
// })

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
