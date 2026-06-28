import mongoose from "mongoose";
import dotenv from "dotenv";
import Tenant from "../src/models/Tenant.js";

dotenv.config();

const powerGrid = [
  { name: "Red Ranger City (Delhi)", code: "DEL" },
  { name: "Blue Ranger City (Chennai)", code: "CHN" },
  { name: "Green Ranger City (Bangalore)", code: "BLR" },
  { name: "white Ranger City (Bangalore)", code: "21$3" },
  { name: "Young Ranger City (Bangalore)", code: "21$4" },
  { name: "New Ranger City (Bangalore)", code: "21$5" },
  { name: "Black Ranger City (Bangalore)", code: "21$6" },
];

const activatePowerGrid = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    for (const tenant of powerGrid) {
      await Tenant.updateOne(
        { code: tenant.code },   // match by code
        { $set: tenant },        // update fields
        { upsert: true }         // insert if missing
      );
    }

    console.log("Power Grid Activated (Tenants Seeded)");
    process.exit(0);
  } catch (err) {
    console.error("Power Grid Activation Failed:", err);
    process.exit(1);
  }
};

activatePowerGrid();
