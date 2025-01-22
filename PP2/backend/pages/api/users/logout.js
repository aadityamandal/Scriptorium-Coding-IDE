import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

export default async function handler(req, res) {
  // Handle the OPTIONS request for CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Origin", "*"); // Replace "*" with a specific domain in production
    return res.status(200).end();
  }

  // Allow only POST requests for logout
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Extract the Authorization header
  const authHeader = req.headers.authorization;

  // If the Authorization header is missing, return an error
  if (!authHeader) {
    return res.status(401).json({
      error: "Authorization header missing",
    });
  }

  try {
    // Extract token from the Authorization header
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token missing in Authorization header" });
    }

    const user = verifyToken(token);

    // Verify if the provided token is valid
    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // Clear refresh token from the user's record in the database
    await prisma.user.update({
      where: { id: user.userId },
      data: { refreshToken: null },
    });

    // Optionally clear the token cookie from the client (if applicable)
    res.setHeader(
      "Set-Cookie",
      "token=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=" + new Date(0).toUTCString() + ";"
    );

    // Send a success response after logout
    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    // Handle any errors during the logout process
    console.error("Logout error:", error);
    res.status(500).json({
      error: "An error occurred while logging out",
    });
  }
}
