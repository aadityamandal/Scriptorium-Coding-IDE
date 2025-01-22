import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaSun, FaMoon } from 'react-icons/fa';
import Header from '@/components/Header';

interface Content {
  id: number;
  title?: string;
  description?: string;
  content: string;
  totalReports: number;
  isHidden: boolean;
  user: {
    firstName: string;
    lastName: string;
  };
  blogPost?: {
    title: string;
    id: number;
  };
}

const AdminPage = () => {
  const [contentType, setContentType] = useState<'blogPosts' | 'comments'>('blogPosts');
  const [viewFilter, setViewFilter] = useState<'all' | 'reportedOnly' | 'hidden'>('reportedOnly');
  const [reportedContent, setReportedContent] = useState<Content[]>([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('totalReports_desc');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme ? savedTheme === 'dark' : true;
    }
    return true;
  });
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }
  }, [darkMode]);

  // Fetch reported content
  const fetchReportedContent = async () => {
    try {
      const queryParams = new URLSearchParams({
        type: contentType,
        sortOrder: sort.includes('asc') ? 'asc' : 'desc',
        page: page.toString(),
        limit: '9',
      }).toString();

      const response = await fetch(`http://localhost:3000/api/admin/sorted-reports?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();

      // Apply filter to show only reported or hidden content if necessary
      if (viewFilter === 'reportedOnly') {
        data = data.filter((content: Content) => content.totalReports > 0 && !content.isHidden);
      } else if (viewFilter === 'hidden') {
        data = data.filter((content: Content) => content.isHidden);
      }

      setReportedContent(data || []);
    } catch (error) {
      console.error('Error fetching reported content:', error);
    }
  };

  useEffect(() => {
    fetchReportedContent();
  }, [contentType, viewFilter, sort, page]);

  const showDropdown = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setDropdownVisible(true);
  };

  const hideDropdown = () => {
    const timeout = setTimeout(() => setDropdownVisible(false), 300);
    setHoverTimeout(timeout);
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleHideContent = async (contentId: number, action: 'hide' | 'unhide') => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/hide-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          contentType: contentType === 'blogPosts' ? 'BlogPost' : 'Comment',
          contentId: contentId,
          action: action,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} content`);
      }

      setNotification(`Content successfully ${action === 'hide' ? 'hidden' : 'unhidden'}.`);
      setTimeout(() => setNotification(null), 3000);
      fetchReportedContent();
    } catch (error) {
      console.error(`Error trying to ${action} content:`, error);
    }
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

      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Reported Content</h2>
          <div className="flex items-center space-x-4">
            {/* Switch between Blog Posts and Comments */}
            <div className="flex items-center space-x-2">
              <label htmlFor="content-type-toggle" className="text-lg font-medium">
                Content Type:
              </label>
              <select
                id="content-type-toggle"
                value={contentType}
                onChange={(e) => setContentType(e.target.value as 'blogPosts' | 'comments')}
                className={darkMode ? 'px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'px-4 py-2 border rounded-lg bg-white text-black'}
              >
                <option value="blogPosts">Blog Posts</option>
                <option value="comments">Comments</option>
              </select>
            </div>

            {/* Filter between all content or reported only */}
            <div className="flex items-center space-x-2">
              <label htmlFor="view-filter" className="text-lg font-medium">
                View:
              </label>
              <select
                id="view-filter"
                value={viewFilter}
                onChange={(e) => setViewFilter(e.target.value as 'all' | 'reportedOnly' | 'hidden')}
                className={darkMode ? 'px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'px-4 py-2 border rounded-lg bg-white text-black'}
              >
                <option value="all">All Content</option>
                <option value="reportedOnly">Reported Only</option>
                <option value="hidden">Hidden Content</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <label htmlFor="sort-select" className="text-lg font-medium">
                Sort By:
              </label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={darkMode ? 'px-4 py-2 border rounded-lg bg-gray-700 text-white' : 'px-4 py-2 border rounded-lg bg-white text-black'}
              >
                <option value="totalReports_desc">Reports: High to Low</option>
                <option value="totalReports_asc">Reports: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="bg-green-500 text-white p-4 rounded-lg mb-4">
            {notification}
          </div>
        )}

        {/* Reported Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reportedContent.length > 0 ? (
            reportedContent.map((content) => (
              <div key={content.id} className={darkMode ? 'bg-gray-800 p-4 rounded-lg shadow' : 'bg-white p-4 rounded-lg shadow'}>
                {contentType === 'blogPosts' && content.title && (
                  <Link href={`/blog/${content.id}`} className="text-lg font-bold hover:underline cursor-pointer">
                    {content.title}
                  </Link>
                )}
                {contentType === 'comments' && content.blogPost && (
                  <Link href={`/blog/${content.blogPost.id}`} className="text-lg font-bold hover:underline cursor-pointer">
                    {content.blogPost.title}
                  </Link>
                )}
                <p className={darkMode ? 'text-sm text-gray-300 mt-2' : 'text-sm text-gray-600 mt-2'}>
                  {content.content}
                </p>
                <p className={darkMode ? 'text-xs text-gray-400 mt-2' : 'text-xs text-gray-500 mt-2'}>
                  By {content.user.firstName} {content.user.lastName}
                </p>
                <p className={darkMode ? 'text-xs text-red-500 mt-2' : 'text-xs text-red-600 mt-2'}>
                  Reports: {content.totalReports} {content.isHidden && '[HIDDEN]'}
                </p>
                {content.isHidden ? (
                  <button
                    className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600"
                    onClick={() => handleHideContent(content.id, 'unhide')}
                  >
                    Unhide Content
                  </button>
                ) : (
                  <button
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600"
                    onClick={() => handleHideContent(content.id, 'hide')}
                  >
                    Hide Content
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No reported content available.</p>
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
          {reportedContent.length === 9 && (
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

export default AdminPage;
