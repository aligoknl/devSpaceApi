import User from "../models/User.js";
import { EXPIRES_IN } from "../util/constants.js";

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// @desc validate the current user's token.
// @route POST /api/user/validate
// @access private

export const validateToken = async (req, res) => {
  try {
    let token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

// @desc  get information about the current user
// @route GET /api/user/me
// @access  private
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({ success: true, currentUser: req.user });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc  authenticate a user
// @route POST /api/user/login
// @access  public
export const login = async (req, res) => {
  try {
    const credentials = req.body;

    // if the username or password is missing, then it is a bad request
    if (
      !Object.keys(credentials).includes("email") ||
      !Object.keys(credentials).includes("password")
    ) {
      return res
        .status(400)
        .json({ message: "Both email and password are required" });
    }

    // find a user in the database with the given username
    const user = await User.findOne({
      email: credentials.email,
    });

    const isMatchedPassword = await bcrypt.compare(
      credentials.password,
      user.password
    );
    // after checking the username, check if the given password is correct
    if (user && isMatchedPassword) {
      // if the user has provided correct credentials then generate a json web token for him
      // check if the user wants his session not to expire (remember me)

      let accessToken;

      if (credentials.rememberMe) {
        accessToken = jwt.sign(
          { id: user._id },
          process.env.ACCESS_TOKEN_SECRET
        );
      } else {
        accessToken = jwt.sign(
          { id: user._id },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: EXPIRES_IN }
        );
      }

      return res.status(200).json({
        id: user._id,
        userName: user.userName,
        email: user.email,
        userType: user.userType,
        accessToken: accessToken,
      });
    } else {
      // otherwise return an unauthorized request
      return res.status(401).json({
        success: false,
        message: "email and/or password is incorrect",
      });
    }
  } catch (err) {
    // for all other kinds of errors, treat them as internal server errors (code 500)
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// @desc  create a new user account
// @route POST /api/user
// @access  public
export const createUser = async (req, res) => {
  try {
    const user = req.body;

    // if the user did not provide a right json object, it is a bad request
    if (typeof user !== "object") {
      res.status(400).json({
        success: false,
        message: `You need to provide a 'user' object. Received: ${JSON.stringify(
          user
        )}`,
      });

      return;
    }

    // check if a user with the given username or email already exists
    const userExistsEmail = await User.findOne({ email: user.email });
    const userExistsUserName = await User.findOne({ userName: user.userName });

    // if yes then it is a bad request (code 400)
    if (userExistsEmail) {
      return res.status(400).json({
        success: false,
        message: `A user with the email address '${userExists.email}' already exists`,
      });
    }

    if (userExistsUserName) {
      return res.status(400).json({
        success: false,
        message: `A user with the user name '${userExistsUserName.userName}' already exists`,
      });
    }

    // hash the password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(user.password, salt);

    // create a new user
    const newUser = await User.create({
      ...user,
      password: hashedPassword,
    });

    if (newUser) {
      const accessToken = jwt.sign(
        { id: newUser._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: EXPIRES_IN }
      );

      return res.status(201).json({
        success: true,
        id: newUser._id,
        userName: newUser.userName,
        email: newUser.email,
        userType: newUser.userType,
        accessToken: accessToken,
      });
    } else {
      // if an error occurred while creating a new user, something has to do with the server
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: "Unable to create user", error });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = req.body;
    const userId = req.user._id;
    if (typeof user !== "object") {
      return res.status(400).json({
        success: false,
        message: `You need to provide a user object. You sent ${JSON.stringify(
          user
        )}`,
      });
    }

    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
      return res.status(400).json({
        success: false,
        message: "User does not exist in our database",
      });
    }

    // Return the user object after update has been performed
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...user, password: req.user.password },
      {
        new: true,
      }
    );

    return res.status(200).json({
      data: updatedUser,
      success: true,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, msg: "Unable to update user", error });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, result: users });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, msg: "Unable to get users, try again later" });
  }
};
