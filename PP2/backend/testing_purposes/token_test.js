import jwt from 'jsonwebtoken';

// Define the JWT secret (must match .env JWT_SECRET)
const JWT_SECRET = 'temporarySecretKey1234567890'; // Replace with your exact secret

// Replace `your_token_here` with the actual token you have
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoiYWFkaXR5YS50ZXN0QGV4YW1wbGUuY29tIiwiZmlyc3ROYW1lIjoiQWFkaXR5YSIsImxhc3ROYW1lIjoiVGVzdCIsInBob25lTnVtYmVyIjoiMTIzNDU2Nzg5MCIsImlhdCI6MTczMDQwNjc1NCwiZXhwIjoxNzMwNDEwMzU0fQ.pK8KM_AzF3iMlrv8GEkwVY1IZi2RPJMHwY0QlaqSTzI';

try {
  // Attempt to decode the token using the secret
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log("Decoded user data:", decoded);
} catch (error) {
  console.error("Token verification error:", error.message);
}
