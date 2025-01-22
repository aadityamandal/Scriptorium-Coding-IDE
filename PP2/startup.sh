set -e

echo "Starting the  setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Node.js is not installed. Please install Node.js before running this script."
  exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Docker is not installed. Please install Docker before running this script."
  exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Check required compilers/interpreters on the host
# echo "Checking required compilers/interpreters..."
# for cmd in python3 java gcc g++ bash haskell julia php swift; do
#   if ! command -v $cmd &> /dev/null; then
#     echo "$cmd could not be found. Please install it."
#     exit 1
#   fi
# done
# echo "All required compilers/interpreters are installed."

# Build Docker images for code execution - change
# make it build all of the docker files in the backend/executers
echo "Building Docker images for code execution..."

# Navigate to the backend folder
cd backend

docker build -t code-executor-python ./executors/python
docker build -t code-executor-javascript ./executors/javascript
docker build -t code-executor-php ./executors/php
docker build -t code-executor-swift ./executors/swift
docker build -t code-executor-bash ./executors/bash
docker build -t code-executor-julia ./executors/julia
docker build -t code-executor-haskell ./executors/haskell
docker build -t code-executor-cpp ./executors/cpp
docker build -t code-executor-c ./executors/c
docker build -t code-executor-java ./executors/java



# Create environment variables
echo "Setting up environment variables..."
cat <<EOT > .env
# Environment Variables
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1h"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
BCRYPT_SALT_ROUNDS=10
EOT

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Run Prisma migrations to set up the database
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Prepopulate the database with data
echo "Seeding the database with initial data..."
node seed.js

# Create admin user
echo "Creating initial admin user..."
node createAdminUser.js

echo "Setup is complete!"