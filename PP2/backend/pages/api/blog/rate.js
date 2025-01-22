import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../utils/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust as per your CORS policy
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Set CORS headers for other requests
  res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust as per your CORS policy
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'POST') {
    try {
      console.log("Received POST request for rating:", req.body);

      // Check for Authorization header and extract the token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        console.error("Authorization header missing");
        return res.status(401).json({ error: 'Authorization header missing' });
      }

      // Extract and verify the token
      const token = authHeader.split(' ')[1];
      const userData = verifyToken(token);

      // Check if the token verification was successful
      if (!userData) {
        console.error("Token verification failed or expired");
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Destructure data from the request body
      const { blogPostId, commentId, rating } = req.body;

      // Validate the rating value (it should be either 1 (upvote) or -1 (downvote))
      if (rating !== 1 && rating !== -1) {
        return res.status(400).json({ error: 'Invalid rating value. It should be 1 (upvote) or -1 (downvote).' });
      }

      // Handle rating for a blog post
      if (blogPostId) {
        // Upsert (create or update) the rating for the blog post
        const updatedRating = await prisma.blogPostRating.upsert({
          where: {
            blogPostId_userId: {
              blogPostId,
              userId: userData.userId,
            },
          },
          update: {
            rating, // Update the rating if it already exists
          },
          create: {
            blogPostId,
            userId: userData.userId,
            rating, // Create a new rating if it doesn't exist
          },
        });

        // Aggregate the total rating for the blog post
        const totalRating = await prisma.blogPostRating.aggregate({
          where: { blogPostId },
          _sum: {
            rating: true,
          },
        });

        // Update the total rating in the BlogPost model
        await prisma.blogPost.update({
          where: { id: blogPostId },
          data: {
            totalRating: totalRating._sum.rating || 0,
          },
        });

        // Respond with the updated rating information
        return res.status(200).json({ message: 'Rating added/updated successfully', updatedRating });
      }

      // Handle rating for a comment
      if (commentId) {
        // Upsert (create or update) the rating for the comment
        const updatedRating = await prisma.commentRating.upsert({
          where: {
            commentId_userId: {
              commentId,
              userId: userData.userId,
            },
          },
          update: {
            rating, // Update the rating if it already exists
          },
          create: {
            commentId,
            userId: userData.userId,
            rating, // Create a new rating if it doesn't exist
          },
        });

        // Aggregate the total rating for the comment
        const totalRating = await prisma.commentRating.aggregate({
          where: { commentId },
          _sum: {
            rating: true,
          },
        });

        // Update the total rating in the Comment model
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            totalRating: totalRating._sum.rating || 0,
          },
        });

        // Respond with the updated rating information
        return res.status(200).json({ message: 'Rating added/updated successfully', updatedRating });
      }

      // If neither blogPostId nor commentId is provided, return an error
      return res.status(400).json({ error: 'Either blogPostId or commentId must be provided.' });
    } catch (error) {
      console.error("Error adding rating:", error.message);
      res.status(500).json({ error: 'Unable to add rating' });
    }
  } else {
    // If the request method is not allowed, return an error
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
