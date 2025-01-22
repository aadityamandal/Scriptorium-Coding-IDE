import prisma from "@/utils/db";
import { comparePassword, generateToken } from "@/utils/auth";
import crypto from "crypto";

export default async function handler(req, res) {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins or specify a domain if needed
    res.status(200).end();
    return;
  }

  // Allow only POST requests for login
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Extract email and password from the request body
  const { email, password } = req.body;

  // Validate if both email and password are provided
  if (!email || !password) {
    return res.status(400).json({
      message: "Please provide both email and password",
    });
  }

  try {
    // Find user by email in the database
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // Check if user exists and if the provided password matches the stored password
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Generate access token with user information including admin status
    const token = generateToken({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin, // Include isAdmin status in the token payload
    });

    // Generate a refresh token
    const refreshToken = crypto.randomBytes(40).toString("hex");

    // Store the generated refresh token in the user's record in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Set CORS headers for the response
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins or specify a domain if needed
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Respond with success message, access token, and refresh token
    return res.status(200).json({
      message: "Login successful",
      token,
      refreshToken,
    });
  } catch (error) {
    // Handle any errors during the login process
    console.error("Login error:", error);
    res.status(500).json({
      message: "An error occurred while logging in",
    });
  }
}
