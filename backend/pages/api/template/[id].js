import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../utils/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end(); // End request for preflight check
    }
    // get the template id 
    const { id } = req.query;
    const templateId = parseInt(id);

    if (req.method === 'GET'){
        try {
            // Get the template associated with the template id
            const template = await prisma.codeTemplate.findUnique({
                where: { id: templateId },
                include: {
                    tags: true, // Include associated tags
                    user: true, // Include user information
                },
            });

            // If no template is found, return an error
            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }

            // Return the template data
            return res.status(200).json(template);
        } catch (error) {
            // Catch any errors not caught above
            console.error("Error retrieving template:", error.message);
            res.status(500).json({ error: 'Unable to retrieve code template' });
        }
    }
    // getting the authentication from headers and seeing if it is present for delete and put method
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

    if (req.method === 'DELETE'){
        // the Delete method to delete a template
        try {
            // getting the template associated with tenplate id
            const template = await prisma.codeTemplate.findUnique({
                where: { id: templateId },
            });

            // if no template found return error
            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }

            // if the user that did not create the template, is trying to delete it, return error
            if (template.userId !== userData.userId) {
                return res.status(403).json({ error: 'You do not have permission to delete this template' });
            }

            // delete the template from database
            await prisma.codeTemplate.delete({
                where: { id: templateId },
            });

            res.status(200).json({ message: 'Template deleted successfully' });
        } catch (error) {
            // catch any error from above
            console.error("Error deleting template:", error.message);
            res.status(500).json({ error: 'Unable to delete code template' });
        }
    } else if (req.method === 'PUT'){
        // PUT method to edit the template by id
        try {
            // getting the template associated with tenplate id
            const template = await prisma.codeTemplate.findUnique({
                where: { id: templateId },
                include: { tags: true },
            });

            // if no template found return error
            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }

            // if the user that did not create the template, is trying to edit it, return error
            if (template.userId !== userData.userId) {
                return res.status(403).json({ error: 'You do not have permission to edit this template' });
            }

            // get the new modified content for the template
            const { title, description, code, tags, language } = req.body;
            console.log(tags);

            // update the template and return after
            const updatedTemplate = await prisma.codeTemplate.update({
                where: { id: templateId },
                data: {
                    title: title || template.title, // modified title or current one
                    description: description || template.description, // modified description or current one
                    code: code || template.code,  // // modified code or current one
                    language: language || template.language,
                    tags: tags ? {  // if new tags given, remove old ones and map the new ones to the tags data
                        set: [], // Clear existing tags
                        connectOrCreate: tags.map(tag => ({
                            where: { tag },
                            create: { tag },
                        }))
                    } : undefined,
                },
            });

            res.status(200).json(updatedTemplate);
        } catch (error) {
            // catch any errors not caught above
            console.error("Error updating template:", error.message);
            res.status(500).json({ error: 'Unable to update code template' });
        }
    } else {
        // only three methods allowed: 'DELETE', 'PUT', and 'GET'
        res.setHeader('Allow', ['DELETE', 'PUT', 'GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}