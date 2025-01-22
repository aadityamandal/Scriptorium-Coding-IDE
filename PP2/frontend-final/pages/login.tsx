import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FaSun, FaMoon } from 'react-icons/fa'
import Image from 'next/image'
import Header from '@/components/Header'
import { useAuth } from '@/components/AuthContext' // Import AuthContext

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [darkMode, setDarkMode] = useState(true)
  const router = useRouter()

  // Use AuthContext to set login state
  const { setLoggedIn } = useAuth()

  useEffect(() => {
    const lastTheme = localStorage.getItem('theme')
    if (lastTheme) {
      setDarkMode(lastTheme === 'dark')
    }
  }, [])

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newTheme = !prev ? 'dark' : 'light'
      localStorage.setItem('theme', newTheme)
      return !prev
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invalid Credentials!')
      }

      const { token } = await response.json()
      localStorage.setItem('token', token)

      // Notify AuthContext about login
      setLoggedIn(true)

      // Redirect to home using router
      router.push('/')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred')
    }
  }

  const showDropdown = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout)
    setDropdownVisible(true)
  }

  const hideDropdown = () => {
    const timeout = setTimeout(() => setDropdownVisible(false), 300)
    setHoverTimeout(timeout)
  }

  return (
    <div className={darkMode ? 'min-h-screen bg-gray-900 text-white' : 'min-h-screen bg-gray-100 text-gray-900'}>
      {/* Header Bar */}
      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        showDropdown={showDropdown}
        hideDropdown={hideDropdown}
        dropdownVisible={dropdownVisible}
      />

      {/* Login Form Section */}
      <div className="container mx-auto py-12 px-6 lg:px-0">
        <div className={darkMode ? 'bg-gray-800 rounded-lg shadow-lg p-8 max-w-lg mx-auto' : 'bg-white rounded-lg shadow-lg p-8 max-w-lg mx-auto'}>
          <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>

          {errorMessage && <p className="text-red-500 text-center mb-4">{errorMessage}</p>}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label
                className={darkMode ? 'block text-gray-300 font-medium mb-2' : 'block text-gray-700 font-medium mb-2'}
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={
                  darkMode
                    ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500'
                    : 'w-full px-4 py-2 border rounded-lg bg-white text-black focus:outline-none focus:border-blue-500'
                }
                required
              />
            </div>

            <div className="mb-6">
              <label
                className={darkMode ? 'block text-gray-300 font-medium mb-2' : 'block text-gray-700 font-medium mb-2'}
                htmlFor="password"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={
                  darkMode
                    ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500'
                    : 'w-full px-4 py-2 border rounded-lg bg-white text-black focus:outline-none focus:border-blue-500'
                }
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Login
            </button>
          </form>

          {/* Sign Up Prompt */}
          <div className="text-center mt-6">
            <p className="text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-blue-500 hover:underline">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
