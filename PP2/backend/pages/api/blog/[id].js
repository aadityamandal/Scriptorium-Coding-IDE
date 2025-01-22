import { PrismaClient } from '@prisma/client';
import { authenticateUser, verifyToken } from '../../../utils/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id, page = 1, limit = 10 } = req.query;

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(200).end();
    return;
  }

  // Handle GET request for fetching the blog post
  if (req.method === 'GET') {
    try {
      // Find the specific blog post based on the id
      const blogPost = await prisma.blogPost.findUnique({
        where: { id: Number(id) },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          tags: true,
          codeTemplates: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          comments: {
            where: {
              isDeleted: false,
              isHidden: false,
            },
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
              replies: {
                include: {
                  user: { select: { id: true, firstName: true, lastName: true } },
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
            skip: (page - 1) * limit,
            take: parseInt(limit),
          },
        },
      });

      if (!blogPost) {
        return res.status(404).json({ message: 'Blog post not found!' });
      }

      if (blogPost.isHidden) {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(403).json({ message: 'Blog post is hidden.' });
        }

        const token = authHeader.split(' ')[1];
        const userData = verifyToken(token);
        if (!userData || !userData.isAdmin) {
          return res.status(403).json({ message: 'Blog post is hidden.' });
        }
      }

      res.status(200).json(blogPost);
    } catch (error) {
      console.error("Error fetching blog post:", error.message);
      res.status(500).json({ message: 'Unable to fetch blog post' });
    }
  } else {
    // Handle PUT and DELETE requests with authentication
    const user = await authenticateUser(req, res);
    if (!user) {
      return; // Authentication failed, response already sent
    }

    const userId = user.userId;

    // Editing post (PUT request)
    if (req.method === 'PUT') {
      const { title, description, content, tags, codeTemplates } = req.body;

      try {
        const post = await prisma.blogPost.findUnique({
          where: { id: Number(id) },
        });

        if (!post) {
          return res.status(404).json({ message: 'Blog post not found' });
        }
        if (post.userId !== userId) {
          return res.status(403).json({ message: 'User not authorized to edit this blog post' });
        }
        if (post.isHidden) {
          return res.status(403).json({ message: 'Editing hidden content is not allowed' });
        }

        const updatedPost = await prisma.blogPost.update({
          where: { id: Number(id) },
          data: {
            title,
            description,
            content,
            tags: {
              set: [], // Remove all current tags
              connectOrCreate: tags.map((tag) => ({
                where: { tag },
                create: { tag },
              })),
            },
            codeTemplates: {
              set: [], // Remove all current code templates
              connect: codeTemplates?.map((templateId) => ({ id: templateId })) || [],
            },
          },
          include: {
            tags: true,
            codeTemplates: true,
          },
        });

        res.status(200).json(updatedPost);
      } catch (error) {
        console.error("Error updating blog post:", error.message);
        res.status(500).json({ message: 'Error updating blog post' });
      }
    }
    // Handle DELETE request for deleting a blog post (Hard Delete)
    else if (req.method === 'DELETE') {
      try {
        const post = await prisma.blogPost.findUnique({
          where: { id: Number(id) },
        });

        if (!post) {
          console.error("Post not found for deletion");
          return res.status(404).json({ message: 'Blog post not found' });
        }

        if (post.userId !== userId) {
          console.error("User not authorized to delete the post");
          return res.status(403).json({ message: 'User not authorized to delete this blog post' });
        }

        // Hard delete the post (remove it completely from the database)
        await prisma.blogPost.delete({
          where: { id: Number(id) },
        });

        res.status(200).json({ message: 'Blog post deleted successfully' });
      } catch (error) {
        console.error("Error deleting blog post:", error.message);
        res.status(500).json({ message: 'Error deleting blog post' });
      }
    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }
}
