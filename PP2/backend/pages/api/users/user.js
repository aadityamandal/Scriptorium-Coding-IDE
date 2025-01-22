import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../../../utils/auth';

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

  // Handle preflight request (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await authenticateUser(req, res);
    if (!user) return;

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        avatarUrl: true,
      },
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Unable to fetch user data' });
  }
}