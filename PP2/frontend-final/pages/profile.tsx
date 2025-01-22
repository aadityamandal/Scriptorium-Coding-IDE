import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import router, { useRouter } from 'next/router';
import { FaSun, FaMoon, FaCamera } from 'react-icons/fa';
import Header from '../components/Header';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  avatarUrl?: string;
}

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    profilePicture: '',
    avatarUrl: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newProfilePicture, setNewProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme ? savedTheme === 'dark' : true;
    }
    return true;
  });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false); // Define the loggedIn state

  // Fetch user profile data
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/users/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber || '',
        profilePicture: data.avatarUrl || '',
        avatarUrl: data.avatarUrl || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to token data if fetch fails
      const payload = JSON.parse(atob(token.split('.')[1]));
      setProfile({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phoneNumber: payload.phoneNumber || '',
        profilePicture: payload.avatarUrl || '',
        avatarUrl: payload.avatarUrl || '',
      });
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const formData = new FormData();
      formData.append('firstName', profile.firstName);
      formData.append('lastName', profile.lastName);
      formData.append('email', profile.email);
      if (profile.phoneNumber) {
        formData.append('phoneNumber', profile.phoneNumber);
      }
      if (newProfilePicture) {
        formData.append('profilePicture', newProfilePicture);
      }

      const response = await fetch('http://localhost:3000/api/users/edit-profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      setNewProfilePicture(null);
      setPreviewUrl('');

      // Fetch latest data from database
      await fetchUserProfile();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      );
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:3000/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccessMessage('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to change password. Please try again.'
      );
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

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
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
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

      {/* Profile Content */}
      <div className="container mx-auto py-12 px-4">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8 max-w-4xl mx-auto`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Profile Picture Section */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-48 h-48 rounded-full overflow-hidden mx-auto relative">
                  <Image
                    src={
                      previewUrl ||
                      (profile.avatarUrl
                        ? `http://localhost:3000/${profile.avatarUrl}`
                        : '/default-avatar.jpg')
                    }
                    alt="Profile"
                    width={200}
                    height={200}
                    className="rounded-full object-cover"
                  />
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                    <FaCamera className="text-white" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              <h2 className="mt-4 text-xl font-bold">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-500">{profile.email}</p>
            </div>

            {/* Profile Information Section */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Profile Information</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Edit Profile
                  </button>
                ) : null}
              </div>

              {successMessage && (
                <div className="mb-4 p-3 bg-green-500 text-white rounded-lg">{successMessage}</div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-500 text-white rounded-lg">{errorMessage}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full p-3 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full p-3 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full p-3 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profile.phoneNumber || ''}
                      onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full p-3 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end mt-6 space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setPreviewUrl('');
                        setNewProfilePicture(null);
                        fetchUserProfile(); // Revert changes
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                      Save Changes
                    </button>
                  </div>
                )}
              </form>

              {/* Change Password Section */}
              <form onSubmit={handleChangePassword} className="mt-8">
                <h3 className="text-xl font-bold mb-4">Change Password</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Old Password</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className={`w-full p-3 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full p-3 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
