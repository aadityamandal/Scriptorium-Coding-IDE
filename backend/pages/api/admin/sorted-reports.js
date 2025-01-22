import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../utils/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Handle OPTIONS preflight request for CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Update with specific origin in production for security
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).end();
    return;
  }

  // Handle GET request for fetching sorted reports
  if (req.method === 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Update with specific origin in production for security
    try {
      // Extract Authorization header and verify token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
      }

      const token = authHeader.split(' ')[1];
      const userData = verifyToken(token);
      // If token is invalid or expired, return error
      if (!userData) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Check if the user is an admin
      const user = await prisma.user.findUnique({
        where: {
          id: userData.userId,
        },
      });

      // If user is not found or is not an admin, return access forbidden error
      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Access forbidden. Admin only.' });
      }

      // Extract query parameters from the request
      const { type, sortOrder, page = 1, limit = 10 } = req.query;

      // Validate type parameter: must be either 'blogPosts' or 'comments'
      if (!type || !['blogPosts', 'comments'].includes(type)) {
        return res.status(400).json({ error: 'Invalid or missing type parameter. Use "blogPosts" or "comments".' });
      }

      // Validate sortOrder parameter: must be either 'asc' or 'desc'
      if (!sortOrder || !['asc', 'desc'].includes(sortOrder)) {
        return res.status(400).json({ error: 'Invalid or missing sortOrder parameter. Use "asc" or "desc".' });
      }

      let sortedData = [];

      if (type === 'blogPosts') {
        // Fetch blog posts that are not deleted with pagination
        const blogPosts = await prisma.blogPost.findMany({
          where: {
            isDeleted: false,
          },
          include: {
            user: true, // Include user who created the post
          },
          skip: (page - 1) * parseInt(limit),
          take: parseInt(limit),
        });

        // Count the total number of reports for each blog post
        const blogPostsWithReports = await Promise.all(
          blogPosts.map(async (post) => {
            const reportCount = await prisma.report.count({
              where: {
                contentType: 'BlogPost',
                contentId: post.id,
              },
            });

            return {
              ...post,
              totalReports: reportCount,
            };
          })
        );

        // Sort blog posts based on totalReports count, using sortOrder
        sortedData = blogPostsWithReports.sort((a, b) =>
          sortOrder === 'asc' ? a.totalReports - b.totalReports : b.totalReports - a.totalReports
        );
      } else if (type === 'comments') {
        // Fetch all comments with pagination
        const comments = await prisma.comment.findMany({
          include: {
            user: true, // Include user who made the comment
          },
          skip: (page - 1) * parseInt(limit),
          take: parseInt(limit),
        });

        // Count the total number of reports for each comment
        const commentsWithReports = await Promise.all(
          comments.map(async (comment) => {
            const reportCount = await prisma.report.count({
              where: {
                contentType: 'Comment',
                contentId: comment.id,
              },
            });

            return {
              ...comment,
              totalReports: reportCount,
            };
          })
        );

        // Sort comments based on totalReports count, using sortOrder
        sortedData = commentsWithReports.sort((a, b) =>
          sortOrder === 'asc' ? a.totalReports - b.totalReports : b.totalReports - a.totalReports
        );
      }

      // Return sorted data (blog posts or comments)
      return res.status(200).json(sortedData);
    } catch (error) {
      console.error('Error fetching sorted reports:', error.message);
      return res.status(500).json({ error: 'Unable to fetch sorted reports' });
    }
  } else {
    // Return an error if the request method is not allowed
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
