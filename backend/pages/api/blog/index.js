import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../utils/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Allow CORS for every request
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // End request for preflight check
  }

  // Handle POST request for creating blog posts
  if (req.method === 'POST') {
    try {
      // Extract Authorization header and verify token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
      }
      const token = authHeader.split(' ')[1];
      const userData = verifyToken(token);

      if (!userData) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Extract the data from request body
      const { title, description, content, tags, codeTemplates } = req.body;

      // Validate required fields are present in the parameters
      if (!title || !description || !content || !tags) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create the blog post with tags and optional code templates
      const newPost = await prisma.blogPost.create({
        data: {
          title,
          description,
          content,
          user: {
            connect: { id: userData.userId }, // Connect the blog post to the user creating it
          },
          tags: {
            connectOrCreate: tags.map((tag) => ({
              where: { tag },
              create: { tag }, // Create new tags if they don't already exist
            })),
          },
          ...(codeTemplates && codeTemplates.length > 0
            ? {
                codeTemplates: {
                  connect: codeTemplates.map((templateId) => ({ id: templateId })), // Link code templates if provided
                },
              }
            : {}),
        },
        include: {
          tags: true,          // Include the tags associated with the post
          codeTemplates: true, // Include the linked code templates
        },
      });

      // Respond with the created blog post
      res.status(201).json(newPost);
    } catch (error) {
      console.error("Error during blog post creation:", error.message);
      res.status(500).json({ error: `Unable to create blog post: ${error.message}` });
    }
  } 

  // Handle GET request for fetching blog posts
  else if (req.method === 'GET') {
    try {
      // Extract query parameters for filtering blog posts
      const { title, content, tags, page = 1, limit = 10 } = req.query;

      // Initialize filters for fetching blog posts
      const filters = { isDeleted: false, isHidden: false };

      // Add filters based on query parameters if provided
      if (title) filters.title = { contains: title };
      if (content) filters.content = { contains: content };
      if (tags) {
        // Split tags by comma and map them to filter each one
        const tagArray = tags.split(',').map(tag => tag.trim());
        filters.tags = {
          some: {
            tag: {
              in: tagArray,
            },
          },
        };
      }

      // Fetch blog posts based on the applied filters
      const posts = await prisma.blogPost.findMany({
        where: filters,
        include: {
          user: true,          // Include the user who created the post
          comments: true,      // Include comments if they exist
          ratings: true,       // Include ratings if they exist
          tags: true,          // Include tags if they exist
          codeTemplates: true, // Include linked code templates if they exist
        },
        orderBy: { createdAt: 'desc' }, // Order posts by creation date
        skip: (page - 1) * parseInt(limit), // Implement pagination
        take: parseInt(limit),
      });

      // Respond with the fetched blog posts
      res.status(200).json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error.message);
      res.status(500).json({ error: 'Unable to fetch blog posts' });
    }
  } else {
    // Handle unsupported request methods
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
