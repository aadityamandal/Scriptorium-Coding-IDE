import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FaSun, FaMoon } from 'react-icons/fa';
import Header from '@/components/Header';

interface BlogPost {
  id: number;
  title: string;
  description: string;
  content: string;
  totalRating: number;
  isHidden: boolean;
  user: {
    firstName: string;
    lastName: string;
    id: number;
  };
  tags: Array<{ tag: string }>;
}

const BlogsPage = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('totalRating');
  const [filters, setFilters] = useState({
    tags: '',
    author: '',
    minRating: '',
    title: '',
    content: '',
  });
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme ? savedTheme === 'dark' : true;
    }
    return true;
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [viewOwnPosts, setViewOwnPosts] = useState<boolean>(false);
  const [userData, setUserData] = useState<{ firstName: string; lastName: string; userId: number } | null>(null);
  const [showTemplatesOnly, setShowTemplatesOnly] = useState<boolean>(false);
  const [showHiddenPosts, setShowHiddenPosts] = useState<boolean>(false);

  const pageSize = 9;
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserData({ firstName: payload.firstName, lastName: payload.lastName, userId: payload.userId });
      }
    }
  }, []);

  const fetchBlogPosts = async () => {
    try {
      let currentFilters = { ...filters };

      if (viewOwnPosts && userData) {
        currentFilters.author = `${userData.firstName} ${userData.lastName}`;
      }

      const queryParams = new URLSearchParams({
        type: 'blogPosts',
        sortBy: sort.split('_')[0],
        sortOrder: sort.includes('asc') ? 'asc' : 'desc',
        title: currentFilters.title || '',
        tags: currentFilters.tags || '',
        author: currentFilters.author || '',
        minRating: currentFilters.minRating || '',
        content: currentFilters.content || '',
        hasTemplate: showTemplatesOnly ? 'true' : 'false', // Corrected to ensure "true" or "false" is passed correctly
        showHidden: showHiddenPosts ? 'true' : 'false',
        ...(showHiddenPosts && userData ? { userId: userData.userId.toString() } : {}),
        page: page.toString(),
        limit: pageSize.toString(),
      }).toString();

      const response = await fetch(`http://localhost:3000/api/blog/sorted?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setBlogPosts(data || []);
      setHasMorePosts(data.length === pageSize);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    }
  };

  useEffect(() => {
    fetchBlogPosts();
  }, [page, sort, viewOwnPosts, showTemplatesOnly, showHiddenPosts]);

  const applyFilters = () => {
    setPage(1);
    fetchBlogPosts();
  };

  const clearFilters = () => {
    setFilters({
      tags: '',
      author: '',
      minRating: '',
      title: '',
      content: '',
    });
    setShowTemplatesOnly(false);
    setShowHiddenPosts(false);
    setPage(1);
    fetchBlogPosts();
  };

  const showDropdown = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setDropdownVisible(true);
  };

  const hideDropdown = () => {
    const timeout = setTimeout(() => setDropdownVisible(false), 300);
    setHoverTimeout(timeout);
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
    router.reload();
  };

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
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={darkMode ? 'w-full px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-4 py-2 border rounded-lg bg-white text-black'}
              >
                <option value="totalRating_desc">Rating: High to Low</option>
                <option value="totalRating_asc">Rating: Low to High</option>
                <option value="createdAt_desc">Newest First</option>
                <option value="createdAt_asc">Oldest First</option>
              </select>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g., My First Post"
                  value={filters.title}
                  onChange={(e) => setFilters((prev) => ({ ...prev, title: e.target.value }))}
                  className={darkMode ? 'w-full px-3 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-3 py-2 border rounded-lg bg-white text-black'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input
                  type="text"
                  placeholder="e.g., JavaScript"
                  value={filters.tags}
                  onChange={(e) => setFilters((prev) => ({ ...prev, tags: e.target.value }))}
                  className={darkMode ? 'w-full px-3 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-3 py-2 border rounded-lg bg-white text-black'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Author</label>
                <input
                  type="text"
                  placeholder={viewOwnPosts && userData ? `Set to ${userData.firstName} ${userData.lastName}` : 'e.g., John Doe'}
                  value={filters.author}
                  onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))}
                  disabled={viewOwnPosts}
                  className={darkMode ? 'w-full px-3 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-3 py-2 border rounded-lg bg-white text-black'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Rating</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  placeholder="e.g., 4"
                  value={filters.minRating}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minRating: e.target.value }))}
                  className={darkMode ? 'w-full px-3 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-3 py-2 border rounded-lg bg-white text-black'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content (Contains)</label>
                <input
                  type="text"
                  placeholder="e.g., keyword"
                  value={filters.content}
                  onChange={(e) => setFilters((prev) => ({ ...prev, content: e.target.value }))}
                  className={darkMode ? 'w-full px-3 py-2 border rounded-lg bg-gray-700 text-white' : 'w-full px-3 py-2 border rounded-lg bg-white text-black'}
                />
              </div>
            </div>
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                checked={showTemplatesOnly}
                onChange={() => setShowTemplatesOnly((prev) => !prev)}
                className="mr-2"
              />
              <label className="text-sm font-medium">Show Blog Posts with Code Templates Only</label>
            </div>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={showHiddenPosts}
                onChange={() => setShowHiddenPosts((prev) => !prev)}
                className="mr-2"
              />
              <label className="text-sm font-medium">Show My Hidden Blog Posts</label>
            </div>
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

      {/* Blog Posts Section */}
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {viewOwnPosts && userData ? `${userData.firstName}'s Blog Posts` : 'All Blog Posts'}
          </h2>
          {isLoggedIn && (
            <div className="flex space-x-4">
              <button
                onClick={() => setViewOwnPosts((prev) => !prev)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-700"
              >
                {viewOwnPosts ? 'View All Blog Posts' : 'View My Blog Posts'}
              </button>
              <button
                onClick={() => router.push('/blog/createpost')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600"
              >
                Create Blog Post
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogPosts.length > 0 ? (
            blogPosts.map((post) => (
              <div key={post.id} className={darkMode ? 'bg-gray-800 p-4 rounded-lg shadow' : 'bg-white p-4 rounded-lg shadow'}>
                <h3 className="text-lg font-bold">
                  {post.title} {post.isHidden && userData && post.user.id === userData.userId && <span className="text-red-500">(Hidden by Admin)</span>}
                </h3>
                <p className={darkMode ? 'text-sm text-gray-300' : 'text-sm text-gray-600'}>{post.description}</p>
                <p className={darkMode ? 'text-xs text-gray-400 mt-2' : 'text-xs text-gray-500 mt-2'}>
                  By {post.user.firstName} {post.user.lastName}
                </p>
                <div className="mt-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={darkMode ? 'px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs mr-2' : 'px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs mr-2'}
                    >
                      #{tag.tag}
                    </span>
                  ))}
                </div>
                {/* Remove Read More button for hidden posts */}
                {!post.isHidden && (
                  <button
                    className="mt-4 text-blue-500 hover:underline"
                    onClick={() => router.push(`/blog/${post.id}`)}
                  >
                    Read More
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No blog posts available.</p>
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
          <span className="text-lg font-bold mx-4">Page {page}</span>
          {hasMorePosts && (
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
  );
};

export default BlogsPage;
