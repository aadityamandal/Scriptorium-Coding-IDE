import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaSun, FaMoon } from "react-icons/fa";

interface BlogPost {
  id: number;
  title: string;
  description: string;
  content: string;
  totalRating: number;
  user: {
    firstName: string;
    lastName: string;
  };
  tags: Array<{ tag: string }>;
}

interface Template {
  id: number;
  title: string;
  description: string;
  totalRating: number;
  user: {
    firstName: string;
    lastName: string;
  };
  tags: Array<{ tag: string }>;
}

const Home: React.FC = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // Track if user is an admin
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      return savedTheme ? savedTheme === "dark" : true;
    }
    return true;
  });

  // Fetch blog posts
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/blog/sorted?type=blogPosts&sortOrder=desc&page=1&limit=3"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBlogPosts(data);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
      }
    };
    fetchBlogPosts();
  }, []);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/template?page=1&pageSize=3"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTemplates(data.data || []);
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
    };
    fetchTemplates();
  }, []);

  // Detect if user is logged in by checking local storage for a token
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        setLoggedIn(true);
        const parsedToken = JSON.parse(atob(token.split(".")[1]));
        setFirstName(parsedToken.firstName);
        setIsAdmin(parsedToken.isAdmin || false); // Assuming the token contains an "isAdmin" field
      }
    }
  }, []);

  // Show dropdown immediately on hover
  const showDropdown = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setDropdownVisible(true);
  };

  // Hide dropdown after a delay
  const hideDropdown = () => {
    const timeout = setTimeout(() => setDropdownVisible(false), 300);
    setHoverTimeout(timeout);
  };

  // Simplified handleLogout function
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      setLoggedIn(false);
      setFirstName(null);
      setIsAdmin(false);
      window.location.href = "/";
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    if (typeof window !== "undefined") {
      setDarkMode((prev) => !prev);
      localStorage.setItem("theme", !darkMode ? "dark" : "light");
    }
  };

  return (
    <div
      className={
        darkMode
          ? "min-h-screen bg-gray-900 text-white"
          : "min-h-screen bg-gray-50 text-gray-900"
      }
    >
      {/* Header Section */}
      <header className="bg-gray-800 text-white py-6 px-4 font-mono">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center mb-4 sm:mb-0">
            <Image
              src="/logo.png" // Replace with your logo file path
              alt="Scriptorium Logo"
              className="h-16 w-16 mr-4"
              width={64}
              height={64}
            />
            <h1 className="text-3xl font-bold">Scriptorium</h1>
          </div>

          {/* Navbar Section */}
          <nav className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 relative items-center">
            <Link href="/blog" className="text-lg hover:underline">
              Blog Posts
            </Link>
            <Link href="/templates" className="text-lg hover:underline">
              Templates
            </Link>
            <Link href="/sandbox" className="text-lg hover:underline">
              Code Sandbox
            </Link>
            <div
              className="relative group"
              onMouseEnter={showDropdown}
              onMouseLeave={hideDropdown}
            >
              <span className="text-lg cursor-pointer">My Account</span>
              {dropdownVisible && (
                <div className="absolute bg-white text-gray-800 shadow-md rounded-lg mt-2 py-2 px-4">
                  {loggedIn ? (
                    <>
                      <button
                        onClick={() => (window.location.href = "/profile")}
                        className="block w-full px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 mb-2"
                      >
                        Profile
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => (window.location.href = "/admin")}
                          className="block w-full px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 mb-2"
                        >
                          Admin
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => (window.location.href = "/login")}
                        className="block w-full px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 mb-2"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => (window.location.href = "/signup")}
                        className="block w-full px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={toggleDarkMode}
              className="text-lg ml-4 sm:ml-0 focus:outline-none"
            >
              {darkMode ? (
                <FaSun className="text-yellow-500" />
              ) : (
                <FaMoon className="text-gray-700" />
              )}
            </button>
          </nav>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto text-center mt-16">
          {loggedIn && firstName && (
            <h3 className="text-2xl font-bold mb-4">Hello, {firstName}!</h3>
          )}
          <h2 className="text-4xl font-bold">
            Welcome to the Future of Collaborative Coding
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Explore templates, compile code, and share your ideas with the world.
          </p>
          <div className="mt-12 space-y-4">
            <button
              className="px-8 py-3 border-2 border-blue-500 text-blue-500 text-xl font-medium rounded-lg shadow-md hover:bg-blue-500 hover:text-white transition duration-200"
              onClick={() => (window.location.href = "/sandbox")}
            >
              Compile Your Code
            </button>
            {!loggedIn && (
              <>
                <div className="flex items-center justify-center space-x-2 text-gray-300">
                  <span className="block w-16 h-px bg-gray-300"></span>
                  <span className="text-sm">or</span>
                  <span className="block w-16 h-px bg-gray-300"></span>
                </div>
                <button
                  className="px-8 py-3 border-2 border-blue-500 text-blue-500 text-xl font-medium rounded-lg shadow-md hover:bg-blue-500 hover:text-white transition duration-200"
                  onClick={() => (window.location.href = "/login")}
                >
                  Login
                </button>
                <p className="text-sm text-gray-400 mt-2">
                  If you don't have an account,{" "}
                  <Link href="/signup" className="text-blue-400 hover:underline">
                    create an account
                  </Link>
                  .
                </p>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Trending Blog Posts Section */}
      <section className="py-8 bg-gray-100">
        <div className="container mx-auto">
          <div className="flex justify-between items-center text-black">
            <h2 className="text-2xl font-bold">Trending Blog Posts</h2>
            <Link href="/blog">
              <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg shadow-md hover:bg-blue-600">
                View All Blog Posts
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {blogPosts.length > 0 ? (
              blogPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 bg-white rounded-lg shadow-md"
                >
                  <h3 className="font-bold text-black">{post.title}</h3>
                  <p className="text-sm text-gray-600">{post.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    By {post.user.firstName} {post.user.lastName}
                  </p>
                  <div className="flex mt-2 space-x-2">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs"
                      >
                        #{tag.tag}
                      </span>
                    ))}
                  </div>
                  <button
                    className="mt-2 text-blue-500 hover:underline"
                    onClick={() => (window.location.href = `/blog/${post.id}`)}
                  >
                    Read More
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No trending blog posts available.</p>
            )}
          </div>
        </div>
      </section>

      {/* Popular Templates Section */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex justify-between items-center text-black">
            <h2 className="text-2xl font-bold">Popular Templates</h2>
            <Link href="/templates">
              <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg shadow-md hover:bg-blue-600">
                View All Templates
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {templates.length > 0 ? (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 bg-white rounded-lg shadow-md"
                >
                  <h3 className="font-bold text-black">{template.title}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    By {template.user.firstName} {template.user.lastName}
                  </p>
                  <div className="flex mt-2 space-x-2">
                    {template.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs"
                      >
                        #{tag.tag}
                      </span>
                    ))}
                  </div>
                  <button
                    className="mt-2 text-blue-500 hover:underline"
                    onClick={() => (window.location.href = `/template/${template.id}`)}
                  >
                    View Template
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No popular templates available.</p>
            )}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer
        className={darkMode ? "bg-gray-800 text-white py-4" : "bg-gray-200 text-gray-800 py-4"}
      >
        <div className="container mx-auto text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Scriptorium. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
