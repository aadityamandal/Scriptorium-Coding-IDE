require('dotenv').config();

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS);
const JWT_SECRET = process.env.JWT_SECRET;
console.log("JWT_SECRET loaded in the app:", process.env.JWT_SECRET);
console.log("JWT_SECRET used for verification:", JWT_SECRET); // Debug line

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

export async function hashPassword(password) {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function generateToken(obj) {
  return jwt.sign(obj, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function getTokenExpirationTime(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    return payload.exp - currentTime; // Time until expiration in seconds
  } catch (error) {
    console.error('Failed to decode token:', error);
    return 0; // Token is invalid or malformed
  }
}


export function verifyToken(token) {
  console.log("Original token passed to verifyToken:", token);

  if (!token) {
    console.error("Token missing entirely");
    return null;
  }
  
  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }
  console.log("Token after processing 'Bearer ' prefix:", token);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded token data in verifyToken:", decoded);
    return decoded;
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.error("Token expired error:", err.message);
      return null; // Instead of throwing, log and return null
    } else {
      console.error("Token verification error:", err.message);
      return null;
    }
  }
}


export function authenticateUser(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Invalid or missing token" });
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return decoded;
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.error("Token expired error:", err.message);
      res.status(401).json({ message: "Token expired. Please use the refresh token." });
    } else {
      console.error("Token verification error:", err.message);
      res.status(401).json({ message: "Invalid or expired token" });
    }
    return null;
  }
}

// Middleware for checking if the user is an admin
export function authenticateAdmin(req, res, next) {
  const user = authenticateUser(req, res);
  if (!user) {
    return; // Unauthorized, response already sent by `authenticateUser`
  }

  // Check if the user is an admin
  if (!user.isAdmin) {
    res.status(403).json({ error: "Unauthorized. Admin access required." });
    return;
  }

  next(); // Proceed if the user is an admin
}

