import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { FaSun, FaMoon } from 'react-icons/fa'
import Header from '@/components/Header'

const EditBlogPostPage = () => {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [blogPost, setBlogPost] = useState({
    title: '',
    description: '',
    content: '',
    tags: [] as string[],
    codeTemplates: [] as number[],
  })
  const [userTemplates, setUserTemplates] = useState<Array<{ id: number; title: string }>>([])
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      return savedTheme ? savedTheme === 'dark' : true
    }
    return true
  })
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [loggedInUser, setLoggedInUser] = useState<{ id: number; firstName: string; lastName: string } | null>(null)
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', darkMode ? 'dark' : 'light')
    }
  }, [darkMode])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        setIsLoggedIn(true)
        const decodedToken: any = parseJwt(token)
        setLoggedInUser({ id: decodedToken.userId, firstName: decodedToken.firstName, lastName: decodedToken.lastName })
      } else {
        setIsLoggedIn(false)
        setLoggedInUser(null)
      }
    }
  }, [])

  const parseJwt = (token: string) => {
    try {
      return JSON.parse(atob(token.split('.')[1]))
    } catch (e) {
      console.error('Failed to parse token', e)
      return null
    }
  }

  useEffect(() => {
    if (id) {
      fetchBlogPost()
      fetchUserTemplates()
    }
  }, [id])

  const fetchBlogPost = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/blog/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch blog post')
      }
      const data = await response.json()
      setBlogPost({
        title: data.title,
        description: data.description,
        content: data.content,
        tags: data.tags.map((tag: { tag: string }) => tag.tag),
        codeTemplates: data.codeTemplates.map((template: { id: number }) => template.id),
      })
    } catch (error) {
      if (error instanceof Error) {
        setError(`Failed to load blog post: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchUserTemplates = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        console.error('No token found. User is not authenticated.')
        return
      }

      const response = await fetch('http://localhost:3000/api/template/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setUserTemplates(data.data)
    } catch (error) {
      console.error('Error fetching user templates:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/blog/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: blogPost.title,
          description: blogPost.description,
          content: blogPost.content,
          tags: blogPost.tags,
          codeTemplates: blogPost.codeTemplates,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update blog post')
      }

      router.push(`/blog/${id}`)
    } catch (error) {
      if (error instanceof Error) {
        setError(`Failed to update blog post: ${error.message}`)
      }
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      router.push('/')
      window.location.reload()
    }
  }

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev)
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
    <div className={darkMode ? 'min-h-screen bg-gray-900 text-gray-100' : 'min-h-screen bg-gray-100 text-gray-900'}>
      {/* Header Bar */}
      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        showDropdown={showDropdown}
        hideDropdown={hideDropdown}
        dropdownVisible={dropdownVisible}
        />

      {/* Edit Blog Post Section */}
      <div className="container mx-auto py-12 px-4 lg:px-0">
        <h1 className="text-4xl font-bold mb-8">Edit Blog Post</h1>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={blogPost.title}
                onChange={(e) => setBlogPost({ ...blogPost, title: e.target.value })}
                className={darkMode ? 'w-full p-3 border rounded-lg bg-gray-700 text-white' : 'w-full p-3 border rounded-lg'}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <input
                type="text"
                id="description"
                value={blogPost.description}
                onChange={(e) => setBlogPost({ ...blogPost, description: e.target.value })}
                className={darkMode ? 'w-full p-3 border rounded-lg bg-gray-700 text-white' : 'w-full p-3 border rounded-lg'}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium mb-2">
                Content
              </label>
              <textarea
                id="content"
                value={blogPost.content}
                onChange={(e) => setBlogPost({ ...blogPost, content: e.target.value })}
                className={darkMode ? 'w-full p-3 border rounded-lg h-48 bg-gray-700 text-white' : 'w-full p-3 border rounded-lg h-48'}
              />
            </div>

            {/* Tags Section */}
            <div className="mb-6">
              <label htmlFor="tags" className="block text-sm font-medium mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                value={blogPost.tags.join(', ')}
                onChange={(e) =>
                  setBlogPost({ ...blogPost, tags: e.target.value.split(',').map((tag) => tag.trim()) })
                }
                className={darkMode ? 'w-full p-3 border rounded-lg bg-gray-700 text-white' : 'w-full p-3 border rounded-lg'}
              />
              <p className="text-sm text-gray-500 mt-2">Separate tags with commas (e.g., "React, JavaScript, UI").</p>
            </div>

            {/* Code Templates Section */}
            <div className="mb-6">
              <label htmlFor="codeTemplates" className="block text-sm font-medium mb-2">
                Code Templates
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userTemplates.map((template) => (
                  <div key={template.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`template-${template.id}`}
                      checked={blogPost.codeTemplates.includes(template.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBlogPost((prev) => ({
                            ...prev,
                            codeTemplates: [...prev.codeTemplates, template.id],
                          }))
                        } else {
                          setBlogPost((prev) => ({
                            ...prev,
                            codeTemplates: prev.codeTemplates.filter((id) => id !== template.id),
                          }))
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={`template-${template.id}`} className="text-sm">
                      {template.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default EditBlogPostPage