import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../utils/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    // method to templtes, specific to a user (can provide optional filters)

    // Allow CORS
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(200).end();
        return;
    }
    
    if (req.method === 'GET') {
        try {
            // Get the authorization header and validate the token
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: 'Authorization header missing' });
            }

            const token = authHeader.split(' ')[1];
            const userData = verifyToken(token);
            
            // did not have a authenticated user
            if (!userData) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            // Destructure the search parameters
            const { title, description, tags, code, page = 1, pageSize = 10 } = req.query;
            const tagArray = tags ? tags.split(',') : [];

            // Define filters for searching the user's templates
            const filters = { userId: userData.userId };  // Filter by the logged-in user's ID
            if (title) filters.title = { contains: title };
            if (description) filters.description = { contains: description };
            if (code) filters.code = { contains: code };
            if (tagArray.length > 0) {  // if there are tags, create a array of tags
                filters.tags = {
                    some: {
                        tag: {
                            in: tagArray,
                        },
                    },
                };
            }

            // Calculate pagination variables
            const skip = (page - 1) * pageSize;
            const take = parseInt(pageSize);

            // Fetch the total count of items for pagination metadata
            const totalCount = await prisma.codeTemplate.count({
                where: filters,
            });

            // Query the user's saved templates with filters
            const userTemplates = await prisma.codeTemplate.findMany({
                where: filters,
                include: {
                    user: true,    
                    tags: true,    
                    forkedFrom: true,
                },
                skip,
                take,
            });

            const totalPages = Math.ceil(totalCount / pageSize);

            // Return paginated response with metadata
            res.status(200).json({
                data: userTemplates,
                pagination: {
                    page: parseInt(page),
                    pageSize: take,
                    totalCount,
                    totalPages,
                },
            });
        } catch (error) {
            // error for the catch block
            console.error("Error fetching user's saved templates:", error.message);
            res.status(500).json({ error: 'Unable to fetch saved templates for a user' });
        }
    } else {
        // only get method allowed
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}