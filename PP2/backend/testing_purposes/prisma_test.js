const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const newPost = await prisma.blogPost.create({
      data: {
        title: "Hardcoded Title",
        description: "Hardcoded Description",
        content: "Hardcoded Content",
        user: {
          connect: { id: 3 }, // Replace `1` with the actual user ID in your database
        },
      },
    });
    console.log("New Post Created:", newPost);
  } catch (error) {
    console.error("Error in Prisma Test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
