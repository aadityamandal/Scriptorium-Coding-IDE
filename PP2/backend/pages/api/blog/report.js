import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../utils/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Check if request is a POST request
  if (req.method === 'POST') {
    try {
      // Extract Authorization header and verify the token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
      }

      // Extract the token from the Authorization header
      const token = authHeader.split(' ')[1];
      const userData = verifyToken(token);
      
      // If the token is invalid or expired, return an error
      if (!userData) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Extract data from the request body
      const { contentType, contentId, reason } = req.body;

      // Validate that contentType and contentId are provided and valid
      if (!contentType || !['BlogPost', 'Comment'].includes(contentType) || !contentId) {
        return res.status(400).json({ error: 'Invalid or missing parameters. Please provide "contentType" as either "BlogPost" or "Comment" and "contentId".' });
      }

      // Create a new report entry in the database
      const report = await prisma.report.create({
        data: {
          userId: userData.userId, // ID of the user who reported the content
          contentType,             // Type of content being reported (BlogPost or Comment)
          contentId,               // ID of the content being reported
          reason: reason || null,  // Optional reason for reporting
        },
      });

      // Increment the totalReports field of the reported content based on its type
      if (contentType === 'BlogPost') {
        await prisma.blogPost.update({
          where: { id: contentId },
          data: {
            totalReports: {
              increment: 1, // Increment the totalReports field by 1
            },
          },
        });
      } else if (contentType === 'Comment') {
        await prisma.comment.update({
          where: { id: contentId },
          data: {
            totalReports: {
              increment: 1, // Increment the totalReports field by 1
            },
          },
        });
      }

      // Respond with a success message and the newly created report
      res.status(201).json({ message: 'Report submitted successfully', report });
    } catch (error) {
      console.error('Error creating report:', error.message);
      res.status(500).json({ error: 'Unable to submit report' });
    }
  } else {
    // If the request method is not allowed, return an error
    res.setHeader('Allow', ['OPTIONS', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
