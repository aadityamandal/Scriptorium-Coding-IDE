import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const {
      type,
      sortBy = 'totalRating',
      sortOrder = 'desc',
      title,
      content,
      tags,
      author,
      minRating,
      updatedAfter,
      page = 1,
      limit = 10,
      showHidden = 'false',
      userId, // Get userId from query parameters
      hasTemplate = 'false', // Get hasTemplate from query parameters
    } = req.query;

    try {
      if (!type || !['blogPosts', 'comments'].includes(type)) {
        return res
          .status(400)
          .json({ error: 'Invalid or missing type parameter. Use "blogPosts" or "comments".' });
      }

      if (!sortOrder || !['asc', 'desc'].includes(sortOrder)) {
        return res
          .status(400)
          .json({ error: 'Invalid or missing sortOrder parameter. Use "asc" or "desc".' });
      }

      let sortedData;

      if (type === 'blogPosts') {
        const filters = {
          isDeleted: false,
          ...(title && { title: { contains: title } }),
          ...(content && { content: { contains: content } }),
          ...(tags && {
            tags: {
              some: { tag: { in: tags.split(',').map(tag => tag.trim()) } },
            },
          }),
          ...(author && {
            user: {
              OR: [
                { firstName: { contains: author.split(' ')[0] } },
                { lastName: { contains: author.split(' ')[1] } },
              ].filter(Boolean),
            },
          }),
          ...(minRating && {
            totalRating: { gte: parseInt(minRating) },
          }),
          ...(updatedAfter && {
            updatedAt: { gte: new Date(updatedAfter) },
          }),
        };

        // Handling hidden posts logic
        if (showHidden === 'true' && userId) {
          filters.isHidden = true;
          filters.userId = parseInt(userId);
        } else {
          filters.isHidden = false;
        }

        // Handling hasTemplate logic
        if (hasTemplate === 'true') {
          filters.codeTemplates = {
            some: {},
          };
        }

        sortedData = await prisma.blogPost.findMany({
          where: filters,
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            ratings: true,
            comments: true,
            tags: true,
            codeTemplates: true, // Include code templates information
          },
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip: (page - 1) * parseInt(limit),
          take: parseInt(limit),
        });
      } else if (type === 'comments') {
        sortedData = await prisma.comment.findMany({
          where: {
            isHidden: false,
          },
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            blogPost: { select: { id: true, title: true } },
            ratings: true,
          },
          orderBy: {
            totalRating: sortOrder,
          },
          skip: (page - 1) * parseInt(limit),
          take: parseInt(limit),
        });
      }

      return res.status(200).json(sortedData);
    } catch (error) {
      console.error('Error fetching sorted data:', error.message);
      return res.status(500).json({ error: 'Unable to fetch sorted data' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
