// components/Header.tsx
import Link from 'next/link';
import Image from 'next/image';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useAuth } from './AuthContext';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  showDropdown: () => void;
  hideDropdown: () => void;
  dropdownVisible: boolean;
}

const Header: React.FC<HeaderProps> = ({
  darkMode,
  toggleDarkMode,
  showDropdown,
  hideDropdown,
  dropdownVisible,
}) => {
  const { loggedIn, firstName, lastName, setLoggedIn, isAdmin } = useAuth();

const handleLogout = () => {
  localStorage.removeItem('token');
  setLoggedIn(false);
  window.location.href = '/'; // Redirect to home page and refresh
};


  return (
    <header className="bg-gray-800 text-white py-6 font-mono">
      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between px-6">
        {/* Title and Logo */}
        <div className="flex items-center mb-4 lg:mb-0">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Scriptorium Logo" width={48} height={48} className="mr-4" />
            <h1 className="text-2xl font-bold">Scriptorium</h1>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6 items-center">
          <Link href="/blog" className="text-lg hover:underline">
            Blog Posts
          </Link>
          <Link href="/templates" className="text-lg hover:underline">
            Templates
          </Link>
          <Link href="/sandbox" className="text-lg hover:underline">
            Code Sandbox
          </Link>

          {/* My Account Dropdown */}
          <div
            className="relative group"
            onMouseEnter={showDropdown}
            onMouseLeave={hideDropdown}
          >
            <span className="text-lg cursor-pointer">My Account</span>
            {dropdownVisible && (
              <div className="absolute bg-gray-700 text-white shadow-md rounded-lg mt-2 py-2 px-4">
                {loggedIn ? (
                  <>
                    {firstName && lastName && (
                      <p className="text-sm mb-2">
                        Logged in as: <span className="font-semibold">{firstName} {lastName}</span>
                      </p>
                    )}
                    <Link
                      href="/profile"
                      className="block w-full px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 mb-2"
                    >
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block w-full px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 mb-2"
                      >
                        Admin
                      </Link>
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
                    <Link
                      href="/login"
                      className="block w-full px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 mb-2"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="block w-full px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button onClick={toggleDarkMode} className="text-lg ml-0 lg:ml-4 focus:outline-none">
            {darkMode ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-gray-700" />}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
