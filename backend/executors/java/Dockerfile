FROM openjdk:17

# Set the working directory inside the container
WORKDIR /usr/src/code

# Copy the Java source code into the container
COPY Main.java .

# Compile the Java source file into a class file
RUN javac Main.java

# Set the default command to run the compiled Java program
ENTRYPOINT ["java", "Main"]
