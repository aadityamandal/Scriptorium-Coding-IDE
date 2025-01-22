import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { FaSun, FaMoon } from 'react-icons/fa'
import Header from '@/components/Header'

interface Language {
  id: string
  label: string
}

const languages: Language[] = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'bash', label: 'Bash' },
  { id: 'haskell', label: 'Haskell' },
  { id: 'julia', label: 'Julia' },
  { id: 'php', label: 'PHP' },
  { id: 'swift', label: 'Swift' },
]

const EditCodeTemplate = () => {
  const router = useRouter()
  const { id } = router.query
  const [template, setTemplate] = useState<any | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [firstName, setFirstName] = useState<string | null>(null)
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      return savedTheme ? savedTheme === 'dark' : true
    }
    return true
  })

  // When initializing the template from query
  useEffect(() => {
    if (router.query.template) {
      const passedTemplate = JSON.parse(router.query.template as string)
      // Initialize tags as an array of objects if not present
      const initialTags = passedTemplate.tags || []
      setTemplate({
        ...passedTemplate,
        tags: initialTags
      })
      // Set initial tag input value from existing tags
      setTagInput(initialTags.map((tagObj: { tag: string }) => tagObj.tag).join(', '))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!template) {
      router.push('/sandbox')
      return
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      console.error('User not authenticated')
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`http://localhost:3000/api/template/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...template,
          tags: template.tags.map((tagObj: { tag: any }) => tagObj.tag)
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update template. Status: ${response.status}`)
      }

      setShowSuccessModal(true)
    } catch (error) {
      console.error('Error updating template:', error)
    }
  }

  // Add a new state to handle the tag input text
  const [tagInput, setTagInput] = useState('')
  
  // Update handleChange to handle tags differently
  const handleChange = (field: keyof any, value: any) => {
    if (!template) return
  
    if (field === 'tags') {
      setTagInput(value)  // Just update the input field value
      
      // Convert the input string to tag objects
      const tagStrings = value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '')
  
      const tagObjects = tagStrings.map(tag => ({
        tag: tag
      }))
  
      // Update template with new tags
      setTemplate(prev => ({
        ...prev,
        tags: tagObjects
      }))
    } else {
      setTemplate(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }
  const handleDelete = async () => {
    if (!template) return

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      console.error('User not authenticated')
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`http://localhost:3000/api/template/${template.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete template. Status: ${response.status}`)
      }

      setDeleteModal(true)
    } catch (error) {
      console.error('Error deleting template:', error)
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

      {/* Edit Template Form */}
      <div className="container mx-auto py-12 px-4 lg:px-0">
        <div className={darkMode ? 'bg-gray-800 rounded-lg shadow-lg p-8 max-w-lg mx-auto' : 'bg-white rounded-lg shadow-lg p-8 max-w-lg mx-auto'}>
          <h2 className="text-3xl font-bold mb-6 text-center">Edit Code Template</h2>
          {template ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={template.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={darkMode ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-4 py-2 border rounded-lg bg-white text-black'}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Description</label>
                <input
                  type="text"
                  value={template.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={darkMode ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-4 py-2 border rounded-lg bg-white text-black'}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={template.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className={darkMode ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-4 py-2 border rounded-lg bg-white text-black'}
                >
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Code</label>
                <textarea
                  value={template.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  className={darkMode ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-4 py-2 border rounded-lg bg-white text-black'}
                  rows={6}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagInput || template.tags?.map(tagObj => tagObj.tag).join(', ') || ''}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  className={darkMode ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-4 py-2 border rounded-lg bg-white text-black'}
                  placeholder="e.g. JavaScript, React, Algorithm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition duration-300"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="w-full bg-red-500 text-white py-3 mt-4 rounded-lg hover:bg-red-600 transition duration-300"
              >
                Delete Template
              </button>
            </form>
          ) : (
            <p>Loading template...</p>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg text-white text-center w-96">
            <h2 className="text-2xl font-bold mb-4">Template Updated Successfully</h2>
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

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg text-white text-center w-96">
            <h2 className="text-2xl font-bold mb-4">Template Deleted Successfully</h2>
            <div className="flex justify-center">
              <button
                onClick={() => router.push('/templates')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
              >
                View Templates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditCodeTemplate