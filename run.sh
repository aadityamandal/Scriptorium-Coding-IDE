#!/bin/bash

# Set the script to exit if any command fails
set -e

# Navigate to the backend folder
echo "Starting the backend server..."
cd backend

# Start Docker containers for code execution
# echo "Starting Docker container for code execution..."
# docker run -d --name code_executor -p 8080:8080 scriptorium-code-executor || echo "Docker container already running."

# Start the backend server in the background
npm run dev &

# Navigate to the frontend folder
echo "Starting the frontend server..."
cd ../frontend-final

# Start the frontend server in the background
npm run dev &

# Wait for both servers to start
wait