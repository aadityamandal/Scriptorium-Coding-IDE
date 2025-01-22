FROM gcc:latest

# Set the working directory inside the container
WORKDIR /usr/src/code

# Copy the C++ source code into the container
COPY temp.c .

# Compile the C++ code into an executable named "app"
RUN gcc -o app temp.c

# Set the default command to execute the compiled program
ENTRYPOINT ["./app"]

# # Use an Alpine base image for a minimal footprint
# FROM gcc:latest

# # Set working directory
# WORKDIR /usr/src/app

# # Default command to keep the container alive
# CMD ["/bash"]