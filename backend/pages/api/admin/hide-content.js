import prisma from "@/utils/db";
import { verifyToken } from "@/utils/auth";

export default async function handler(req, res) {
  // Handle OPTIONS request (for CORS preflight)
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.status(200).end();
    return;
  }

  // Ensure the request method is POST, return error otherwise
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Extract Authorization header and verify token
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  const userData = verifyToken(token);

  // Check if the token is valid, otherwise return unauthorized error
  if (!userData) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Verify if the user is an admin, otherwise deny access
  if (!userData.isAdmin) {
    return res.status(403).json({ error: "Unauthorized. Admin access required." });
  }

  // Extract contentType, contentId, and action from request body
  const { contentType, contentId, action } = req.body;

  // Validate that both contentType and contentId are provided
  if (!contentType || !contentId || !action) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    let updateData = {};
    
    if (action === "hide") {
      updateData.isHidden = true;
    } else if (action === "unhide") {
      updateData.isHidden = false;
    } else {
      return res.status(400).json({ error: "Invalid action provided. Use 'hide' or 'unhide'." });
    }

    // Handle hiding or unhiding a blog post
    if (contentType === "BlogPost") {
      await prisma.blogPost.update({
        where: { id: contentId },
        data: updateData,
      });
    } 
    // Handle hiding or unhiding a comment
    else if (contentType === "Comment") {
      await prisma.comment.update({
        where: { id: contentId },
        data: updateData,
      });
    } 
    // If contentType is not valid, return error
    else {
      return res.status(400).json({ error: "Invalid contentType provided. Use 'BlogPost' or 'Comment'." });
    }

    // Successfully updated the content
    res.status(200).json({ message: `Content successfully ${action === "hide" ? "hidden" : "unhidden"}.` });
  } catch (error) {
    console.error("Error updating content:", error);
    res.status(500).json({ error: "Unable to update content" });
  }
}
