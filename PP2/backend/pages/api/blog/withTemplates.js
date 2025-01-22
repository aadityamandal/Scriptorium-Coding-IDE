import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Handle GET request
  if (req.method === 'GET') {
    try {
      // Extract query parameters, with default values
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', title, tags, author, minRating, content } = req.query;

      // Construct where clause for filters
      const whereClause = {
        codeTemplates: {
          some: {}, // This checks that there's at least one associated code template
        },
        isDeleted: false, // Don't include deleted blog posts
        isHidden: false, // Don't include hidden blog posts
      };

      // Apply filters
      if (title) {
        whereClause.title = {
          contains: title,
          mode: 'insensitive', // Case insensitive
        };
      }

      if (tags) {
        whereClause.tags = {
          some: {
            tag: {
              contains: tags,
              mode: 'insensitive',
            },
          },
        };
      }

      if (author) {
        whereClause.user = {
          OR: [
            { firstName: { contains: author, mode: 'insensitive' } },
            { lastName: { contains: author, mode: 'insensitive' } },
          ],
        };
      }

      if (minRating) {
        whereClause.totalRating = {
          gte: parseInt(minRating),
        };
      }

      if (content) {
        whereClause.content = {
          contains: content,
          mode: 'insensitive',
        };
      }

      // Fetch all blog posts that match the filters and have at least one code template linked to them
      const blogPosts = await prisma.blogPost.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } }, // Include user who created the blog post
          tags: true, // Include tags linked to the blog post
          codeTemplates: true, // Include code templates linked to the blog post
        },
        skip: (page - 1) * parseInt(limit), // Skip records based on the page and limit
        take: parseInt(limit), // Limit the number of records returned
        orderBy: {
          [sortBy]: sortOrder,
        },
      });

      // If no blog posts found, return a 404 response
      if (!blogPosts || blogPosts.length === 0) {
        return res.status(404).json({ message: 'No blog posts found with linked code templates.' });
      }

      // Return the blog posts with code templates
      res.status(200).json(blogPosts);
    } catch (error) {
      // Handle error and log message if fetching blog posts fails
      console.error("Error fetching blog posts with code templates:", error.message);
      res.status(500).json({ error: 'Unable to fetch blog posts with linked code templates.' });
    }
  } else {
    // Handle invalid HTTP methods
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
