import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { FaSun, FaMoon } from 'react-icons/fa'
import Header from '@/components/Header'

interface CodeTemplate {
  id: number
  title: string
  description?: string
  language: string
  code: string
}

const CreateCodeTemplate = () => {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('')
  const [code, setCode] = useState('')
  const [tags, setTags] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [firstName, setFirstName] = useState<string | null>(null)
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [templateId, setTemplateId] = useState<number | null>(null)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      return savedTheme ? savedTheme === 'dark' : true
    }
    return true
  })

  useEffect(() => {
    if (router.query.templateId) {
      const passedTemplateId = Number(router.query.templateId)
      setTemplateId(passedTemplateId)
      fetchTemplateById(passedTemplateId)
    } else {
      setLanguage(router.query.language as string || '')
      setCode(router.query.code as string || '')
    }
  }, [router.query])

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      setLoggedIn(true)
      const parsedToken = JSON.parse(atob(token.split('.')[1]))
      setFirstName(parsedToken.firstName)
    }
  }, [])

  const fetchTemplateById = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/template/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch template. Status: ${response.status}`)
      }
      const data: CodeTemplate = await response.json()
      setLanguage(data.language)
      setCode(data.code)
      setTitle(`Fork of: ${data.title}`)
      setDescription(data.description || '')
    } catch (error) {
      console.error('Error fetching template:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      console.error('User not authenticated')
      return
    }

    const tagArray = tags.split(',').map(tag => tag.trim())

    try {
      const response = await fetch('http://localhost:3000/api/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          code,
          language,
          tags: tagArray,
          ...(templateId && { isForked: true, forkedFromId: templateId }),
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save template. Status: ${response.status}`)
      }

      setShowSuccessModal(true)
    } catch (error) {
      console.error('Error creating a code template:', error)
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      router.push('/')
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', !darkMode ? 'dark' : 'light')
    }
  }

  return (
    <div className={darkMode ? 'min-h-screen bg-gray-900 text-white' : 'min-h-screen bg-gray-100 text-gray-900'}>
      {/* Header */}
      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        showDropdown={showDropdown}
        hideDropdown={hideDropdown}
        dropdownVisible={dropdownVisible}
        />

      {/* Create Template Form */}
      <div className="container mx-auto py-12 px-4 lg:px-0">
        <div className={darkMode ? 'bg-gray-800 rounded-lg shadow-lg p-8 max-w-lg mx-auto' : 'bg-white rounded-lg shadow-lg p-8 max-w-lg mx-auto'}>
          <h2 className="text-3xl font-bold mb-6 text-center">Create a New Code Template</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={darkMode ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-4 py-2 border rounded-lg bg-white text-black'}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={darkMode ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-4 py-2 border rounded-lg bg-white text-black'}
              />
            </div>

            {/* Display Selected Language */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Language</label>
              <input
                type="text"
                value={language}
                disabled
                className={darkMode ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-4 py-2 border rounded-lg bg-white text-black'}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Code</label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={darkMode ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-4 py-2 border rounded-lg bg-white text-black'}
                rows={6}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className={darkMode ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-4 py-2 border rounded-lg bg-white text-black'}
                placeholder="e.g. JavaScript, React, Algorithm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Save Template
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg text-white text-center w-96">
            <h2 className="text-2xl font-bold mb-4">Code Template Saved Successfully</h2>
            <p className="mb-6">What would you like to do next?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/templates')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
              >
                View Templates
              </button>
              <button
                onClick={() => router.push('/sandbox')}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
              >
                Create Another Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateCodeTemplate