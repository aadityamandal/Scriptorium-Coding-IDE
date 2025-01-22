import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserOwnership() {
  const postId = 1; // Replace `1` with the blog post ID you want to check
  const userId = 3; // Replace `3` with the authenticated user's ID

  const post = await prisma.blogPost.findFirst({
    where: {
      id: postId,
      userId: userId,
    },
  });

  if (post) {
    console.log("User is authorized to edit this post.");
  } else {
    console.log("User is not authorized or blog post not found.");
  }

  await prisma.$disconnect();
}

checkUserOwnership();
