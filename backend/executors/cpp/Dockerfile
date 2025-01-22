FROM gcc:latest

# Set the working directory inside the container
WORKDIR /usr/src/code

# Copy the C++ source code into the container
COPY temp.cpp .

# Compile the C++ code into an executable named "app"
RUN g++ -o app temp.cpp

# Set the default command to execute the compiled program
ENTRYPOINT ["./app"]
