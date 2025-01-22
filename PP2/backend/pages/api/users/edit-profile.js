import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../../../utils/auth';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await authenticateUser(req, res);
    if (!user) return;

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Prepare update data
    const updateData = {};
    if (fields.firstName) updateData.firstName = fields.firstName[0];
    if (fields.lastName) updateData.lastName = fields.lastName[0];
    if (fields.email) updateData.email = fields.email[0];
    if (fields.phoneNumber) updateData.phoneNumber = fields.phoneNumber[0];

    // Handle profile picture upload
    if (files.profilePicture) {
      const file = Array.isArray(files.profilePicture) 
        ? files.profilePicture[0] 
        : files.profilePicture;

      if (file && file.filepath) {
        const fileName = `${Date.now()}-${file.originalFilename}`;
        const newPath = path.join(uploadDir, fileName);

        try {
          // Use copyFile instead of rename to handle cross-device moves
          fs.copyFileSync(file.filepath, newPath);
          fs.unlinkSync(file.filepath); // Clean up the temp file
          updateData.avatarUrl = `/uploads/${fileName}`;
        } catch (error) {
          console.error('Error handling file:', error);
        }
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
    });

    return res.status(200).json({ 
      message: 'User profile updated successfully', 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Unable to update user profile' });
  }
}