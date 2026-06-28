import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Tenant from '../models/Tenant.js';

const isEmail = (input) =>
  /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(input);

//  Register a new user
export const registerUser = async (req, res) => {
  
  const { username, email, password,  tenantCode } = req.body;
   console.log(tenantCode)
    if (!username || !email || !password ||!tenantCode) {
    return res.status(400).json({ msg: 'Please fill all fields' });
  }
  if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

  try {
    const tenant = await Tenant.findOne({ code: tenantCode.trim().toUpperCase() });
    if (!tenant)
      return res.status(400).json({ msg: "Invalid tenant code" });
    
      const existingUser = await User.findOne({
      tenantId: tenant._id,
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ msg: 'Admin already exists with that email or username.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role:'admin',
      tenantId: tenant._id,
    });

    await user.save();
    console.log("saved")

    const payload = {
       user: { id: user._id, role: user.role, username: user.username,  tenantId: user.tenantId },
     };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;

      res.status(201).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        },
        msg: 'Admin registered successfully',
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// login logic
export const loginUser = async (req, res) => {
  console.log("user login controller")
  const { identifier, password } = req.body;
  console.log("hii")
  if (!identifier || !password ) {
    return res.status(400).json({
      msg: "Email/Username, password and tenant code are required",
    });
  }

  try {
    console.log(identifier)
    const query = isEmail(identifier)
      ? { email: identifier.trim().toLowerCase() }
      : { username: identifier.trim() };
     console.log(query)
    const user = await User.findOne({
      ...query,
      
    });
     console.log(user)

    if (!user) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const payload = {
      user: {
        id: user._id,
        role: user.role,
        username: user.username,
        tenantId: user.tenantId,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token, user: payload.user });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};


