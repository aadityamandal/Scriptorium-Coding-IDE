import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBlogPost() {
  const postId = 1; // Replace `1` with the ID of the blog post you want to check
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
  });

  if (post) {
    console.log("Blog post found:", post);
  } else {
    console.log("Blog post not found.");
  }

  await prisma.$disconnect();
}

checkBlogPost();
