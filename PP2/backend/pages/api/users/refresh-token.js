import prisma from "@/utils/db";
import { generateToken } from "@/utils/auth";
import crypto from "crypto";

export default async function handler(req, res) {
  // Allow only POST requests for refreshing tokens
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Extract refresh token from the request body
  const { refreshToken } = req.body;

  // Check if refresh token is provided, otherwise return an error
  if (!refreshToken) {
    return res.status(400).json({
      error: "Refresh token is required",
    });
  }

  try {
    // Find the user with the given refresh token from the database
    const user = await prisma.user.findUnique({
      where: { refreshToken },
    });

    // If the refresh token is not valid, return an error
    if (!user) {
      return res.status(401).json({
        error: "Invalid refresh token",
      });
    }

    // Generate a new access token with user data, including isAdmin status
    const newAccessToken = generateToken({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
    });

    // Generate a new refresh token and update it in the user's record
    const newRefreshToken = crypto.randomBytes(40).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    // Respond with the newly generated access token and refresh token
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    // Handle any errors that occur during the refresh process
    console.error("Error refreshing token:", error.message);
    res.status(500).json({
      error: "Unable to refresh token",
    });
  }
}
