import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../utils/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      // Get the authorization header from the request - token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
      }
      // Split the token to extract token and verify it
      const token = authHeader.split(' ')[1];
      const userData = verifyToken(token);

      // If verifyToken() doesn't return the approved token, output error
      if (!userData) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Extract the content, blogPostId, parentId from the request body as variables
      const { content, blogPostId, parentId } = req.body;

      // Check if at least content and blogPost are present, otherwise output error
      if (!content || !blogPostId) {
        return res.status(400).json({ error: 'Content and blogPostId are required' });
      }

      // Create a new comment with optional parentId to allow replies to other comments
      const newComment = await prisma.comment.create({
        data: {
          content,
          blogPostId,
          userId: userData.userId,
          parentId: parentId || null,  
        },
      });

      // Output with the newly created comment
      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error adding comment:", error.message);
      res.status(500).json({ error: 'Unable to add comment' });
    }
  } else if (req.method === 'GET') {
    try {
      // Extract blogPostId, page, and limit from the query parameters
      const { blogPostId, page = 1, limit = 10 } = req.query;

      // Ensure blogPostId is provided
      if (!blogPostId) {
        return res.status(400).json({ error: 'blogPostId is required as a query parameter' });
      }

      // Find all comments for the specified blog post, excluding hidden comments
      const comments = await prisma.comment.findMany({
        where: { 
          blogPostId: parseInt(blogPostId),
          isHidden: false, // Only include comments that are not hidden
        },
        include: { 
          user: { select: { id: true, firstName: true, lastName: true } }, // Include user info for each comment
          replies: true, // Include replies to the comments
        },
        orderBy: { createdAt: 'asc' }, // Order comments by creation date (ascending)
        skip: (page - 1) * limit, // Skip based on the page and limit
        take: parseInt(limit), // Limit the number of comments returned
      });

      // Output with the list of comments
      res.status(200).json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error.message);
      res.status(500).json({ error: 'Unable to fetch comments' });
    }
  } else {
    // Handle unsupported request methods
    res.setHeader('Allow', ['POST', 'GET', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
