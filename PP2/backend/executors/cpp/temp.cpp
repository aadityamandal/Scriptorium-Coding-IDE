#include <iostream> // Include the library for input and output

int main() {
    // Declare variables
    std::string name;
    int age;

    // Prompt the user for input
    std::cout << "Enter your name: ";
    std::getline(std::cin, name); // Use getline for strings with spaces
    std::cout << "Enter your age: ";
    std::cin >> age;

    // Output a message based on the input
    std::cout << "Hello, " << name << "! ";
    std::cout << "You are " << age << " years old.\n";

    // End the program
    return 0;
}
