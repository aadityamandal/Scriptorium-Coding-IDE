import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { FaSun, FaMoon, FaThumbsUp, FaThumbsDown, FaArrowRight, FaEdit, FaTrash, FaFlag } from 'react-icons/fa'
import Header from '@/components/Header'

interface BlogPost {
  id: number
  title: string
  description: string
  content: string
  totalRating: number
  user: {
    id: number
    firstName: string
    lastName: string
  }
  tags: Array<{ tag: string }>
  comments: Array<Comment>
  createdAt: string
  codeTemplates: Array<{
    id: number
    title: string
    description: string
  }>
}

interface Comment {
  id: number
  user?: {
    id: number
    firstName: string
    lastName: string
  }
  content: string
  createdAt: string
  totalRating: number
  parentId: number | null
}

const BlogPostPage = () => {
  const router = useRouter()
  const { id } = router.query
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [newComment, setNewComment] = useState('')
  const [replyToggles, setReplyToggles] = useState<{ [key: number]: boolean }>({})
  const [replies, setReplies] = useState<{ [key: number]: string }>({})
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      return savedTheme ? savedTheme === 'dark' : true
    }
    return true
  })
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [loggedInUser, setLoggedInUser] = useState<{ id: number; firstName: string; lastName: string } | null>(null)
  const [showDeletePopup, setShowDeletePopup] = useState(false)
  const [showReportPopup, setShowReportPopup] = useState<{ type: 'blog' | 'comment'; content: string; id: number } | null>(null)
  const [reportReason, setReportReason] = useState<string>('')
  const [userVotes, setUserVotes] = useState<{ [key: string]: number }>({})

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

  const fetchBlogPost = async () => {
    if (!id) return

    try {
      const response = await fetch(`http://localhost:3000/api/blog/${id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setBlogPost(data)
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to fetch blog post: ${err.message}`)
      } else {
        setError('An unknown error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchBlogPost()
    }
  }, [id])

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

  const handleEditPost = () => {
    if (blogPost && loggedInUser && blogPost.user.id === loggedInUser.id) {
      router.push(`/blog/edit/${blogPost.id}`)
    }
  }

  const handleDeletePost = async () => {
    if (!isLoggedIn || !blogPost || loggedInUser?.id !== blogPost.user.id) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/blog/${blogPost.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete blog post')
      }

      router.push('/blog')
    } catch (error) {
      console.error('Error deleting blog post:', error)
    }
  }

  const handleReport = async () => {
    if (!showReportPopup || !reportReason.trim()) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/blog/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentType: showReportPopup.type === 'blog' ? 'BlogPost' : 'Comment',
          contentId: showReportPopup.id,
          reason: reportReason,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to report')
      }

      setShowReportPopup(null)
      setReportReason('')
    } catch (error) {
      console.error('Error reporting:', error)
    }
  }

  const handleNewCommentSubmit = async () => {
    if (!isLoggedIn || !newComment.trim()) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/blog/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newComment,
          blogPostId: Number(id),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const addedComment = await response.json()
      setBlogPost((prev) => ({
        ...prev!,
        comments: [
          ...(prev?.comments || []),
          {
            ...addedComment,
            user: loggedInUser,
          },
        ],
      }))
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const toggleReply = (commentId: number) => {
    if (!isLoggedIn) {
      return
    }
    setReplyToggles((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  const handleReplyChange = (commentId: number, value: string) => {
    setReplies((prev) => ({
      ...prev,
      [commentId]: value,
    }))
  }

  const handleReplySubmit = async (commentId: number) => {
    if (!isLoggedIn || !replies[commentId]?.trim()) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/blog/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: replies[commentId],
          blogPostId: Number(id),
          parentId: commentId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add reply')
      }

      const addedReply = await response.json()
      setBlogPost((prev) => ({
        ...prev!,
        comments: [
          ...(prev?.comments || []),
          {
            ...addedReply,
            user: loggedInUser,
          },
        ],
      }))
      setReplies((prev) => ({
        ...prev,
        [commentId]: '',
      }))
      setReplyToggles((prev) => ({
        ...prev,
        [commentId]: false,
      }))
    } catch (error) {
      console.error('Error adding reply:', error)
    }
  }

  const handleRating = async (rating: number, blogPostId?: number, commentId?: number) => {
    if (!isLoggedIn) return

    const contentType = blogPostId ? 'BlogPost' : 'Comment'
    const contentId = blogPostId || commentId!
    const key = `${contentType}-${contentId}`

    try {
      const token = localStorage.getItem('token')
      const previousVote = userVotes[key] || 0

      let newVote = rating
      if (previousVote === rating) {
        return;
      }

      const response = await fetch(`http://localhost:3000/api/blog/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: newVote, blogPostId, commentId }),
      })

      if (!response.ok) {
        throw new Error('Failed to rate')
      }

      setUserVotes((prevVotes) => ({
        ...prevVotes,
        [key]: newVote,
      }))

      await fetchBlogPost()
    } catch (error) {
      console.error('Error rating:', error)
    }
  }

  const renderComments = (comments: Comment[], parentId: number | null = null, level: number = 0) => {
    return comments
      .filter((comment) => comment.parentId === parentId)
      .map((comment) => (
        <div key={comment.id} style={{ marginLeft: level * 40 }}>
          <div className={darkMode ? 'bg-gray-700 rounded-lg p-4 shadow mb-4' : 'bg-gray-200 rounded-lg p-4 shadow mb-4'}>
            <p className="font-bold text-sm flex items-center">
              {level > 0 && <FaArrowRight className="mr-2 text-gray-400" />}
              {comment.user ? (
                <>
                  {comment.user.firstName} {comment.user.lastName} -{' '}
                  {new Date(comment.createdAt).toLocaleDateString()}
                </>
              ) : (
                <span className="text-gray-500">Unknown User</span>
              )}
            </p>
            <p className="mt-2">{comment.content}</p>
            <div className="flex items-center mt-4 space-x-4 justify-between">
              <div className="flex items-center space-x-4">
                {isLoggedIn && (
                  <>
                    <button
                      onClick={() => handleRating(1, undefined, comment.id)}
                      className="flex items-center text-blue-500 hover:text-blue-700"
                    >
                      <FaThumbsUp className="mr-1" /> Upvote
                    </button>
                    <button
                      onClick={() => handleRating(-1, undefined, comment.id)}
                      className="flex items-center text-red-500 hover:text-red-700"
                    >
                      <FaThumbsDown className="mr-1" /> Downvote
                    </button>
                  </>
                )}
                <span className="text-sm text-gray-400">
                  {comment.totalRating === 0 ? '0 points' : `${comment.totalRating} points`}
                </span>
              </div>
              {isLoggedIn && (
                <button
                  onClick={() => setShowReportPopup({ type: 'comment', content: comment.content, id: comment.id })}
                  className="flex items-center text-yellow-500 hover:text-yellow-700"
                >
                  <FaFlag className="mr-1" /> Report
                </button>
              )}
            </div>
            {isLoggedIn && (
              <>
                <button
                  onClick={() => toggleReply(comment.id)}
                  className="text-blue-500 hover:underline text-sm mt-2"
                >
                  Reply
                </button>
                {replyToggles[comment.id] && (
                  <div className="mt-4">
                    <textarea
                      value={replies[comment.id] || ''}
                      onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                      placeholder="Write your reply..."
                      className={darkMode ? 'w-full p-3 border rounded-lg mb-2 bg-gray-600 text-gray-300' : 'w-full p-3 border rounded-lg mb-2 bg-gray-300 text-gray-800'}
                    />
                    <button
                      onClick={() => handleReplySubmit(comment.id)}
                      className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg shadow-md transition duration-200"
                    >
                      Submit Reply
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          {renderComments(comments, comment.id, level + 1)}
        </div>
      ))
  }

  if (loading) {
    return <p>Loading...</p>
  }

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  if (!blogPost) {
    return <p>No blog post found.</p>
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

      {/* Blog Post Section */}
      <div className="container mx-auto py-12 px-4 lg:px-0">
        <article className={darkMode ? 'bg-gray-800 rounded-lg shadow-lg p-8 mb-12' : 'bg-white rounded-lg shadow-lg p-8 mb-12'}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold">{blogPost.title}</h1>
            {isLoggedIn && loggedInUser?.id === blogPost.user.id && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleEditPost}
                  className="flex items-center text-blue-500 hover:text-blue-700"
                >
                  <FaEdit className="mr-1" /> Edit
                </button>
                <button
                  onClick={() => setShowDeletePopup(true)}
                  className="flex items-center text-red-500 hover:text-red-700"
                >
                  <FaTrash className="mr-1" /> Delete
                </button>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-6">
            By {blogPost.user.firstName} {blogPost.user.lastName} -{' '}
            {new Date(blogPost.createdAt).toLocaleDateString()}
          </p>
          <div className="mt-2 mb-6">
            {blogPost.tags.map((tag, index) => (
              <span
                key={index}
                className={darkMode ? 'px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs mr-2' : 'px-2 py-1 bg-gray-300 text-gray-800 rounded-full text-xs mr-2'}
              >
                #{tag.tag}
              </span>
            ))}
          </div>
          <div className="leading-relaxed text-lg mt-6 whitespace-pre-line">
            {blogPost.content}
          </div>
          <div className="flex items-center mt-6 space-x-4 justify-between">
            <div className="flex items-center space-x-4">
              {isLoggedIn && (
                <>
                  <button
                    onClick={() => handleRating(1, Number(id))}
                    className="flex items-center text-blue-500 hover:text-blue-700"
                  >
                    <FaThumbsUp className="mr-1" /> Upvote
                  </button>
                  <button
                    onClick={() => handleRating(-1, Number(id))}
                    className="flex items-center text-red-500 hover:text-red-700"
                  >
                    <FaThumbsDown className="mr-1" /> Downvote
                  </button>
                </>
              )}
              <span className="text-sm text-gray-400">
                {blogPost.totalRating === 0 ? '0 points' : `${blogPost.totalRating} points`}
              </span>
            </div>
            {isLoggedIn && (
              <button
                onClick={() => setShowReportPopup({ type: 'blog', content: blogPost.title, id: blogPost.id })}
                className="flex items-center text-yellow-500 hover:text-yellow-700"
              >
                <FaFlag className="mr-1" /> Report
              </button>
            )}
          </div>
        </article>

        {/* Delete Confirmation Popup */}
        {showDeletePopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className={darkMode ? 'bg-gray-800 p-6 rounded-lg shadow-lg' : 'bg-white p-6 rounded-lg shadow-lg'}>
              <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
              <p className="mb-6">Are you sure you want to delete this blog post?</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeletePopup(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Popup */}
        {showReportPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className={darkMode ? 'bg-gray-800 p-6 rounded-lg shadow-lg' : 'bg-white p-6 rounded-lg shadow-lg'}>
              <h2 className="text-xl font-bold mb-4">Report {showReportPopup.type === 'blog' ? 'Blog Post' : 'Comment'}</h2>
              <p className="mb-4">
                {showReportPopup.type === 'blog' ? 'Title:' : 'Comment:'} <span className="font-semibold">{showReportPopup.content}</span>
              </p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Enter the reason for reporting..."
                className={darkMode ? 'w-full p-3 border rounded-lg mb-4 bg-gray-700 text-gray-300' : 'w-full p-3 border rounded-lg mb-4 bg-gray-300 text-gray-800'}
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowReportPopup(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Associated Code Templates Section */}
        {blogPost.codeTemplates && blogPost.codeTemplates.length > 0 && (
          <section className={darkMode ? 'bg-gray-800 rounded-lg shadow-lg p-6 mb-12' : 'bg-white rounded-lg shadow-lg p-6 mb-12'}>
            <h2 className="text-2xl font-bold mb-4">Associated Code Templates</h2>
            <ul className="list-disc ml-5">
              {blogPost.codeTemplates.map((template) => (
                <li key={template.id} className="mb-2">
                  <button
                    onClick={() =>
                      router.push({
                        pathname: '/sandbox',
                        query: {
                          template: JSON.stringify({
                            id: template.id,
                            title: template.title,
                            description: template.description,
                            code: template.code || '', // Ensure the code is passed
                            language: template.language || '', // Ensure the language is passed
                            user: {
                              firstName: blogPost.user.firstName,
                              lastName: blogPost.user.lastName,
                            },
                            isForked: template.isForked || false, // Update based on actual data
                          }),
                        },
                      })
                    }
                    className={darkMode ? 'text-blue-400 hover:underline' : 'text-blue-600 hover:underline'}
                  >
                    <strong>{template.title}</strong>
                  </button>
                  <p className="text-sm mt-1">{template.description}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
        
        {/* Comments Section */}
        <section className={darkMode ? 'bg-gray-800 rounded-lg shadow-lg p-6' : 'bg-white rounded-lg shadow-lg p-6'}>
          <h2 className="text-2xl font-bold mb-4">Comments</h2>

          {/* Add New Comment Section */}
          <div className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isLoggedIn ? 'Write a comment...' : 'You must be logged in to add a comment...'}
              className={darkMode ? 'w-full p-3 border rounded-lg mb-2 bg-gray-700 text-gray-300' : 'w-full p-3 border rounded-lg mb-2 bg-gray-300 text-gray-800'}
              disabled={!isLoggedIn}
            />
            <button
              onClick={handleNewCommentSubmit}
              className={`px-4 py-2 ${isLoggedIn ? 'bg-blue-500' : 'bg-gray-500 cursor-not-allowed'} text-white text-sm rounded-lg shadow-md transition duration-200`}
              disabled={!isLoggedIn}
            >
              Submit Comment
            </button>
          </div>

          {/* Existing Comments */}
          {blogPost.comments && blogPost.comments.length > 0 ? (
            renderComments(blogPost.comments)
          ) : (
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          )}
        </section>
      </div>
    </div>
  )
}

export default BlogPostPage