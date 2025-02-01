import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, "Username is required"],
      min: [3, "Username must be at least 3 characters"],
      max: [15, "Username must be at most 15 characters"],
    },

    email: {
      type: String,
      required: [true, "Email Address is required"],
      immutable: true,
      unique: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
    },

    userType: {
      type: String,
      enum: {
        values: ["admin", "developer", "non-developer"],
        message: "{VALUE} is not supported",
      },
      required: [true, "User type is required!"],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("users", userSchema);

export default User;
