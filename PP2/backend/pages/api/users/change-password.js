// pages/api/users/change-password.js

import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../utils/auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust origin as needed
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Ensure the request method is POST, return error otherwise
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'OPTIONS, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { oldPassword, newPassword } = req.body;

  // Check if oldPassword and newPassword are provided
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Both old and new passwords are required.' });
  }

  try {
    // Verify token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    const userData = verifyToken(token);

    if (!userData) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Retrieve the user from the database
    const user = await prisma.user.findUnique({
      where: { id: userData.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the provided old password matches the one in the database
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return res.status(403).json({ error: 'Old password is incorrect.' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
