import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create 15 users
  const users = [];
  const hashedPassword = await bcrypt.hash('password', 10);
  for (let i = 1; i <= 15; i++) {
    const user = await prisma.user.create({
      data: {
        firstName: `User${i}`,
        lastName: `Last${i}`,
        email: `user${i}@example.com`,
        password: hashedPassword,
        avatarUrl: `https://example.com/avatar${i}.png`,
        phoneNumber: `123-456-78${i.toString().padStart(2, '0')}`,
        isAdmin: i === 1, // Make the first user an admin
      },
    });
    users.push(user);
  }
  console.log('Users created successfully');

  // Create 30 code templates
  const templates = [];
  for (let i = 1; i <= 30; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const template = await prisma.codeTemplate.create({
      data: {
        userId: randomUser.id,
        title: `Template ${i}`,
        description: `This is the description for template ${i}`,
        code: `console.log("This is template ${i}");`,
        language: 'JavaScript',
        tags: {
          create: [{ tag: `TemplateTag${i}` }],
        },
        isForked: false,
      },
    });
    templates.push(template);
  }
  console.log('Templates created successfully');

  // Create 30 blog posts and link some to code templates
  const blogPosts = [];
  for (let i = 1; i <= 30; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const linkedTemplates = i % 3 === 0 ? [templates[i % templates.length]] : []; // Link every 3rd blog post to a template
    const blogPost = await prisma.blogPost.create({
      data: {
        userId: randomUser.id,
        title: `Blog Post ${i}`,
        description: `This is the description for blog post ${i}`,
        content: `Lorem ipsum content for blog post ${i}.`,
        tags: {
          create: [{ tag: `Tag${i}` }],
        },
        codeTemplates: {
          connect: linkedTemplates.map((template) => ({ id: template.id })),
        },
      },
    });
    blogPosts.push(blogPost);
  }
  console.log('Blog posts created successfully');

  // Add comments to blog posts
  for (let i = 0; i < blogPosts.length; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomBlogPost = blogPosts[i];
    const numberOfComments = Math.floor(Math.random() * 3); // Add up to 2 comments per post
    for (let j = 0; j < numberOfComments; j++) {
      await prisma.comment.create({
        data: {
          blogPostId: randomBlogPost.id,
          userId: randomUser.id,
          content: `This is a comment ${j + 1} on blog post ${randomBlogPost.id} by ${randomUser.firstName}.`,
        },
      });
    }
  }
  console.log('Comments added successfully');

  // Add ratings for blog posts
  for (const blogPost of blogPosts) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    await prisma.blogPostRating.create({
      data: {
        blogPostId: blogPost.id,
        userId: randomUser.id,
        rating: Math.random() > 0.5 ? 1 : -1, // Randomly upvote or downvote
      },
    });
  }
  console.log('Blog post ratings added successfully');

  // Add ratings for code templates
  for (const template of templates) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    await prisma.commentRating.create({
      data: {
        commentId: template.id,
        userId: randomUser.id,
        rating: Math.random() > 0.5 ? 1 : -1, // Randomly upvote or downvote
      },
    });
  }
  console.log('Template ratings added successfully');

  // Add reports for some blog posts
  for (let i = 0; i < 5; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomBlogPost = blogPosts[Math.floor(Math.random() * blogPosts.length)];
    await prisma.report.create({
      data: {
        userId: randomUser.id,
        contentType: 'BlogPost',
        contentId: randomBlogPost.id,
        reason: `Report reason for blog post ${randomBlogPost.id}`,
      },
    });
  }
  console.log('Reports for blog posts added successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
