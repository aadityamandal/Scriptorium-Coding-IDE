import nextConnect from 'next-connect';
import multer from 'multer';
import { hashPassword } from "@/utils/auth";
import prisma from "@/utils/db";
import path from 'path';

// Configure Multer for file upload
const upload = multer({
  storage: multer.diskStorage({
    destination: './public/uploads', // Save in public/uploads directory
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Create a handler using nextConnect and add Multer middleware to handle the file upload
const handler = nextConnect();

handler.use(upload.single('profilePicture')); // Handle file upload for the "profilePicture" field

handler.post(async (req, res) => {
  // Extract user details from the request body
  const { email, password, firstName, lastName, phoneNumber } = req.body;
  const profilePicture = req.file;

  // Check if all required fields are provided, otherwise return an error
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      message: "Please provide all required fields: email, password, first name, and last name.",
    });
  }

  try {
    // Check if a user with the provided email already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // If a user with the same email exists, return a conflict error
    if (existingUser) {
      return res.status(409).json({ message: "Email is already in use. Please log in." });
    }

    // Set avatarUrl to the uploaded file URL if it exists
    let avatarUrl = null;
    if (profilePicture) {
      avatarUrl = `/uploads/${profilePicture.filename}`;
    }

    // Create a new user with hashed password
    const user = await prisma.user.create({
      data: {
        email,
        password: await hashPassword(password), // Hash the password before storing it in the database
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        avatarUrl: avatarUrl || null,
      },
      // Select only specific fields to return in the response
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    // Return success response with created user data
    res.status(200).json({
      message: "User created successfully.",
      user,
    });
  } catch (error) {
    // Handle any errors that occur during the user creation process
    console.error("Signup error:", error);
    res.status(500).json({
      message: "An error occurred while creating the account.",
    });
  }
});

export default handler;

export const config = {
  api: {
    bodyParser: false, // Disallow default body parsing since multer is used
  },
};
