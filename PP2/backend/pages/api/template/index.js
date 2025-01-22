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

    if (req.method === 'POST') {
        // Handle POST request for creating a code template
        try {
            // getting the authentication from headers and seeing if it is present
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: 'Authorization header missing' });
            }

            // verifying the token for the logged in user
            const token = authHeader.split(' ')[1];
            const userData = verifyToken(token);

            if (!userData) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            // Destructure required data from the request body
            const { title, description, tags, code, isForked = false, forkedFromId = null, language } = req.body;

            // If the template is forked, validate the forkedFromId by finding the original template
            if (isForked && forkedFromId) {
                const parentTemplate = await prisma.codeTemplate.findUnique({
                    where: { id: forkedFromId },
                    include: { tags: true },
                });

                if (!parentTemplate) {
                    return res.status(404).json({ error: 'The template to fork from was not found' });
                }

                // since parent/original template found, create the forked template for logged in user
                const newTemplate = await prisma.codeTemplate.create({
                    data: {
                        title: title || parentTemplate.title, // Use new title if provided
                        description: description || parentTemplate.description, // use new description is provided
                        code: parentTemplate.code, // Copy code from original template
                        language: parentTemplate.language,
                        user: { connect: { id: userData.userId } }, // Set to current user
                        tags: {
                            connect: parentTemplate.tags.map(tag => ({
                                id: tag.id, // Connect existing tags
                            })),
                        },
                        isForked: true,
                        forkedFrom: {
                            connect: { id: parentTemplate.id }, // Connect to the original template
                        },
                    },
                });
    
                // Respond with the created forked template
                return res.status(201).json(newTemplate);
            }

            // Validate required fields since it is a new template without forked
            if (!title || !code) {
                return res.status(400).json({ error: 'Title and code are required fields' });
            }

            // Create the code template in the database
            const newTemplate = await prisma.codeTemplate.create({
                data: {
                title, // new title, has to be unique for a user
                description: description || null, // new description
                code, // new code to be saved
                language,
                isForked,
                forkedFrom: forkedFromId ? { connect: { id: forkedFromId } } : undefined,
                user: { connect: { id: userData.userId } },
                ...(tags && tags.length > 0 ? { // Only include 'tags' if they exist
                    tags: {
                        connectOrCreate: tags.map((tag) => ({
                            where: { tag }, // Assuming 'tag' is unique, create or connect it
                            create: { tag },
                        })),
                    }
                } : {})
                },
            });

            // Respond with the created template
            return res.status(201).json(newTemplate);
        }
        catch (error) {
            // catch the uneexpected error 
            console.error("Error during code template creation:", error.message);
            res.status(500).json({ error: `Unable to create code template: ${error.message}` });
        }
    }
    else if (req.method === 'GET') {
        // Handle GET request for fetching code templates with filtering, pagination, and sorting
        try {
            // Getting filters, pagination, and sorting parameters from query
            const { title, code, tags, author, description, sortOrder = 'desc', page = 1, pageSize = 9 } = req.query;
    
            // Creating the tags filter if tags were provided
            const tagArray = tags ? tags.split(',') : [];
    
            // Creating the filters variable from the query params
            const filters = {};
            if (description) filters.description = { contains: description };
            if (title) filters.title = { contains: title };
            if (code) filters.code = { contains: code };
            if (tagArray.length > 0) {
                filters.tags = {
                    some: {
                        tag: {
                            in: tagArray,
                        },
                    },
                };
            }
    
            // Add an author filter by matching firstName or lastName
            if (author) {
                filters.user = {
                    OR: [
                        { firstName: { contains: author } },
                        { lastName: { contains: author } },
                    ],
                };
            }
    
            // Calculate pagination variables
            const skip = (page - 1) * pageSize;
            const take = parseInt(pageSize);
    
            // Fetch the total count of items for pagination metadata
            const totalCount = await prisma.codeTemplate.count({
                where: filters,
            });
    
            // Fetch the templates based on query with pagination and sorting by createdAt
            const templates = await prisma.codeTemplate.findMany({
                where: filters,
                include: {
                    user: true,        // Include the user who created the template
                    tags: true,        // Include tags if they exist
                    forkedFrom: true,  // Include forkedFrom reference if it exists
                },
                orderBy: {
                    createdAt: sortOrder, // Sort by creation date in the specified order
                },
                skip,
                take,
            });
    
            // Calculate total pages
            const totalPages = Math.ceil(totalCount / pageSize);
    
            // Return paginated response with metadata
            res.status(200).json({
                data: templates,
                pagination: {
                    page: parseInt(page),
                    pageSize: take,
                    totalCount,
                    totalPages,
                },
            });
        } catch (error) {
            // Catch any error not handled above
            console.error("Error fetching code templates:", error.message);
            res.status(500).json({ error: 'Unable to fetch code templates' });
        }
    } else {
            // no other methods other than POST or GET allowed
            res.setHeader('Allow', ['POST', 'GET']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }   
}
