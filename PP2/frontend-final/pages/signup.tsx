import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { FaSun, FaMoon } from 'react-icons/fa'
import Header from '@/components/Header'

const SignUpPage = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [darkMode, setDarkMode] = useState(() => {
    // Load the theme preference from localStorage if available
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      return savedTheme ? savedTheme === 'dark' : true
    }
    return true
  })
  const [step, setStep] = useState(1)
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const router = useRouter()

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setErrorMessage('All fields except phone number are required.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage('Invalid email address.')
      return
    }

    setErrorMessage('')
    setStep(2)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const formData = new FormData()
      formData.append('firstName', firstName)
      formData.append('lastName', lastName)
      formData.append('email', email)
      formData.append('phoneNumber', phoneNumber)
      formData.append('password', password)
      if (profilePicture) {
        formData.append('profilePicture', profilePicture)
      }

      const response = await fetch('http://localhost:3000/api/users/signup', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to sign up.')
      }

      router.push('/login')
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

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev)
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

      {/* Sign Up Form Section */}
      <div className="container mx-auto py-12 px-6 lg:px-0">
        <div className={darkMode ? 'bg-gray-800 rounded-lg shadow-lg p-8 max-w-lg mx-auto' : 'bg-white rounded-lg shadow-lg p-8 max-w-lg mx-auto'}>
          <h2 className="text-3xl font-bold mb-6 text-center">Sign Up</h2>

          {errorMessage && <p className="text-red-500 text-center mb-4">{errorMessage}</p>}

          {step === 1 && (
            <form onSubmit={handleNext}>
              <div className="mb-4">
                <label className={darkMode ? "block text-gray-300 font-medium mb-2" : "block text-black font-medium mb-2"} htmlFor="firstName">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={
                    darkMode
                      ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500'
                      : 'w-full px-4 py-2 border rounded-lg bg-white text-black focus:outline-none focus:border-blue-500'
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <label className={darkMode ? "block text-gray-300 font-medium mb-2" : "block text-black font-medium mb-2"} htmlFor="lastName">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={
                    darkMode
                      ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500'
                      : 'w-full px-4 py-2 border rounded-lg bg-white text-black focus:outline-none focus:border-blue-500'
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <label className={darkMode ? "block text-gray-300 font-medium mb-2" : "block text-black font-medium mb-2"} htmlFor="email">
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

              <div className="mb-4">
                <label className={darkMode ? "block text-gray-300 font-medium mb-2" : "block text-black font-medium mb-2"} htmlFor="phoneNumber">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={
                    darkMode
                      ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500'
                      : 'w-full px-4 py-2 border rounded-lg bg-white text-black focus:outline-none focus:border-blue-500'
                  }
                />
              </div>

              <div className="mb-4">
                <label className={darkMode ? "block text-gray-300 font-medium mb-2" : "block text-black font-medium mb-2"} htmlFor="password">
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

              <div className="mb-6">
                <label className={darkMode ? "block text-gray-300 font-medium mb-2" : "block text-black font-medium mb-2"} htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                Next
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSignUp}>
              <div className="mb-6">
                <label className={darkMode ? "block text-gray-300 font-medium mb-2" : "block text-black font-medium mb-2"} htmlFor="profilePicture">
                  Add Profile Picture (Optional)
                </label>
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                  className={
                    darkMode
                      ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white focus:outline-none focus:border-blue-500'
                      : 'w-full px-4 py-2 border rounded-lg bg-white text-black focus:outline-none focus:border-blue-500'
                  }
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleSignUp}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                >
                  Complete Sign Up
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default SignUpPage