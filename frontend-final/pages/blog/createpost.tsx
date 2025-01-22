import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FaSun, FaMoon } from 'react-icons/fa';
import Header from '@/components/Header';

interface CodeTemplate {
  id: number;
  title: string;
  description?: string;
}

const CreatePostPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string>('');
  const [allTemplates, setAllTemplates] = useState<CodeTemplate[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme ? savedTheme === 'dark' : true;
    }
    return true;
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchAllTemplates = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          console.error('No token found. User is not authenticated.');
          return;
        }

        const response = await fetch('http://localhost:3000/api/template?page=1&pageSize=10&sortOrder=desc', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setAllTemplates(data.data);
      } catch (error) {
        console.error('Error fetching all templates:', error);
      }
    };

    fetchAllTemplates();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const showDropdown = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setDropdownVisible(true);
  };

  const hideDropdown = () => {
    const timeout = setTimeout(() => setDropdownVisible(false), 300);
    setHoverTimeout(timeout);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      console.error('User not authenticated');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          content,
          tags: tags.split(',').map((tag) => tag.trim()),
          codeTemplates: selectedTemplates,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create a new blog post. Status: ${response.status}`);
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating a new blog post:', error);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      router.push('/');
      window.location.reload();
    }
  };

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

      {/* Blog Post Form */}
      <div className="container mx-auto py-12 px-4 lg:px-0">
        <div className={darkMode ? 'bg-gray-800 rounded-lg shadow-lg p-8 max-w-lg mx-auto' : 'bg-white rounded-lg shadow-lg p-8 max-w-lg mx-auto'}>
          <h2 className="text-3xl font-bold mb-6 text-center">Create a New Blog Post</h2>
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
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
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
              />
            </div>
            {/* All Code Templates */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Attach Code Templates (optional)</label>
              <div className="max-h-40 overflow-y-auto">
                {allTemplates.length > 0 ? (
                  allTemplates.map((template) => (
                    <div key={template.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        value={template.id}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTemplates((prev) => [...prev, template.id]);
                          } else {
                            setSelectedTemplates((prev) => prev.filter((id) => id !== template.id));
                          }
                        }}
                      />
                      <label className="ml-2">{template.title}</label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">
                    No code templates available.{' '}
                    <Link href="/blog/createtemplate" className="text-blue-400 hover:underline">
                      Create a code template first.
                    </Link>
                  </p>
                )}
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Create Blog Post
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg text-white text-center w-96">
            <h2 className="text-2xl font-bold mb-4">Blog Post Created Successfully</h2>
            <p className="mb-6">What would you like to do next?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/blog')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
              >
                Back to Blog Posts
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setTitle('');
                  setDescription('');
                  setContent('');
                  setTags('');
                  setSelectedTemplates([]);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
              >
                Create Another Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePostPage;
