# Use a lightweight Node.js base image
FROM node:18-slim

# Install optional linters or libraries if needed
RUN npm install -g eslint

# Set working directory inside the container
WORKDIR /usr/src/app

# CMD specifies the default command to run in the container
CMD ["node"]


# FROM node:16

# # Set the working directory inside the container
# WORKDIR /usr/src/code

# # Copy the JavaScript source code into the container
# COPY temp.js .

# # Set the default command to execute the JavaScript file
# ENTRYPOINT ["node", "temp.js"]
