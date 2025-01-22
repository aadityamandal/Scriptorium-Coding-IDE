import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { FaSun, FaMoon } from 'react-icons/fa'
import Header from '@/components/Header'

interface Template {
  id: number
  title: string
  description: string
  totalRating: number
  code: string
  language: string
  isForked: boolean
  user: {
    firstName: string
    lastName: string
  }
  tags: Array<{ tag: string }>
}

const TemplatesPage = () => {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('totalRating')
  const [filters, setFilters] = useState({
    tags: '',
    author: '',
    minRating: '',
    title: '',
  })
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [hasMoreTemplates, setHasMoreTemplates] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      return savedTheme ? savedTheme === 'dark' : true
    }
    return true
  })
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [viewingUserTemplates, setViewingUserTemplates] = useState(false)
  const [totalPages, setTotalPages] = useState(1); // Add total pages


  const pageSize = 9

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', darkMode ? 'dark' : 'light')
    }
  }, [darkMode])

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      setIsLoggedIn(true)
    }
  }, [])

  const fetchTemplates = async () => {
    try {
      const queryParams = new URLSearchParams({
        type: 'templates',
        sortBy: sort.split('_')[0],
        sortOrder: sort.includes('asc') ? 'asc' : 'desc',
        title: filters.title || '',
        tags: filters.tags || '',
        author: filters.author || '',
        minRating: filters.minRating || '',
        page: page.toString(),
        limit: pageSize.toString(),
      }).toString();
  
      const response = await fetch(
        `http://localhost:3000/api/template?${queryParams}`
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
  
      setTemplates(data.data || []);
      setTotalPages(data.pagination.totalPages); // Update total pages from response
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };
  

  const fetchUserTemplates = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('http://localhost:3000/api/template/user', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setTemplates(data.data || [])
      setHasMoreTemplates(false) // No pagination for user templates
    } catch (error) {
      console.error('Error fetching user templates:', error)
    }
  }

  useEffect(() => {
    if (!viewingUserTemplates) {
      fetchTemplates()
    }
  }, [page, sort])

  const applyFilters = () => {
    setPage(1)
    if (!viewingUserTemplates) {
      fetchTemplates()
    }
  }

  const clearFilters = () => {
    setFilters({
      tags: '',
      author: '',
      minRating: '',
      title: '',
    })
    setPage(1)
    if (!viewingUserTemplates) {
      fetchTemplates()
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

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible)
  }

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', !darkMode ? 'dark' : 'light')
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      router.push('/')
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

      {/* Toggle Filters Section */}
      <div className="container mx-auto mt-6">
        <button
          onClick={toggleFilters}
          className="bg-gray-800 text-white px-6 py-2 rounded-lg shadow-lg w-full text-left"
        >
          Filters {filtersVisible ? '▲' : '▼'}
        </button>
        {filtersVisible && (
          <aside className="bg-gray-800 text-white p-6 rounded-lg shadow-lg mt-2">
            <h3 className="text-xl font-bold mb-4">Filters</h3>
            {/* Sorting Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={darkMode ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-4 py-2 border rounded-lg bg-white text-black'}
              >
                <option value="createdAt_desc">Newest First</option>
                <option value="createdAt_asc">Oldest First</option>
              </select>
            </div>
            {/* Additional Filters */}
            <div className="space-y-4">



              {/* Title Filter */}
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g., My First Template"
                  value={filters.title}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, title: e.target.value }))
                  }
                  disabled={viewingUserTemplates}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode
                      ? viewingUserTemplates
                        ? 'bg-gray-700 text-gray-500'
                        : 'bg-gray-700 text-white'
                      : viewingUserTemplates
                      ? 'bg-gray-300 text-gray-500'
                      : 'bg-white text-black'
                  }`}
                />
              </div>
              
              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input
                  type="text"
                  placeholder="e.g., JavaScript"
                  value={filters.tags}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  disabled={viewingUserTemplates}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode
                      ? viewingUserTemplates
                        ? 'bg-gray-700 text-gray-500'
                        : 'bg-gray-700 text-white'
                      : viewingUserTemplates
                      ? 'bg-gray-300 text-gray-500'
                      : 'bg-white text-black'
                  }`}
                />
              </div>
              
              {/* Author Filter */}
              <div>
                <label className="block text-sm font-medium mb-1">Author</label>
                <input
                  type="text"
                  placeholder="e.g., John Doe"
                  value={filters.author}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, author: e.target.value }))
                  }
                  disabled={viewingUserTemplates}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode
                      ? viewingUserTemplates
                        ? 'bg-gray-700 text-gray-500'
                        : 'bg-gray-700 text-white'
                      : viewingUserTemplates
                      ? 'bg-gray-300 text-gray-500'
                      : 'bg-white text-black'
                  }`}
                />
              </div>
              


            </div>
            {/* Filter and Clear Buttons */}
            <div className="flex space-x-4 mt-6">
              <button
                onClick={applyFilters}
                className="w-1/2 bg-green-500 text-white py-2 rounded-lg shadow-lg hover:bg-green-600"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="w-1/2 bg-red-500 text-white py-2 rounded-lg shadow-lg hover:bg-red-600"
              >
                Clear Filters
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Templates Section */}
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {viewingUserTemplates ? 'My Code Templates' : 'All Code Templates'}
          </h2>
          {isLoggedIn && (
            <button
              onClick={() => {
                setViewingUserTemplates(!viewingUserTemplates)
                if (!viewingUserTemplates) {
                  fetchUserTemplates()
                } else {
                  fetchTemplates()
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {viewingUserTemplates ? 'View All Templates' : 'View My Templates'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.length > 0 ? (
            templates.map((template) => (
              <div key={template.id} className={darkMode ? 'bg-gray-800 p-4 rounded-lg shadow' : 'bg-white p-4 rounded-lg shadow'}>
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold">{template.title}</h3>
                  {template.isForked && (
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                      Forked
                    </span>
                  )}
                </div>
                <p className={darkMode ? 'text-sm text-gray-300' : 'text-sm text-gray-600'}>{template.description}</p>
                <p className={darkMode ? 'text-xs text-gray-400 mt-2' : 'text-xs text-gray-500 mt-2'}>
                  By {template.user.firstName} {template.user.lastName}
                </p>
                <div className="mt-2">
                  {template.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={darkMode ? 'px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs mr-2' : 'px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs mr-2'}
                    >
                      #{tag.tag}
                    </span>
                  ))}
                </div>
                <button
                  className="mt-4 text-blue-500 hover:underline"
                  onClick={() => {
                    router.push({
                      pathname: '/sandbox',
                      query: { 
                        template: JSON.stringify({
                          id: template.id,
                          title: template.title,
                          description: template.description,
                          code: template.code,
                          language: template.language,
                          user: template.user,
                          isForked: template.isForked
                        })
                      }
                    })
                  }}
                >
                  View Template
                </button>
              </div>
            ))
          ) : (
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No templates available.</p>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex justify-center items-center">
          {page > 1 && (
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded mr-4"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Previous
            </button>
          )}
          <span className="text-lg font-bold mx-4">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </button>
          )}
        </div>
        
      </div>
    </div>
  )
}

export default TemplatesPage