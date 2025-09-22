import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Camera, Save, X, Users, BookOpen, TrendingUp, BarChart3 } from 'lucide-react';

interface TeacherProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  school_id?: string;
  phone?: string;
  address?: string;
  language?: string;
  profile_photo?: string;
  department?: string;
  subjects_taught?: string[];
  classes_handled?: string[];
  analytics?: {
    total_students: number;
    lessons_taught: number;
    average_class_score: number;
  };
}

interface TeacherProfileProps {
  userId: string;
}

export function TeacherProfile({ userId }: TeacherProfileProps) {
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState<TeacherProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editable fields state
  const [editableFields, setEditableFields] = useState({
    phone: '',
    address: '',
    language: 'en',
    profile_photo: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('stem_token');
      
      // Check if this is a demo user
      if (userId.startsWith('demo_') || token === 'demo_token' || !token) {
        // Create demo profile data from stored user if present
        const stored = localStorage.getItem('stem_user');
        const storedUser = stored ? JSON.parse(stored) : null;
        const demoData: TeacherProfileData = {
          id: storedUser?.id || userId,
          name: storedUser?.name || 'Teacher Kumar',
          email: storedUser?.email || 'teacher@demo.com',
          role: 'teacher',
          department: 'Mathematics',
          subjects_taught: ['Mathematics', 'Physics'],
          classes_handled: ['Class 9', 'Class 10'],
          phone: '+91 9876543210',
          address: 'Demo School, Demo City',
          language: 'en',
          analytics: {
            total_students: 45,
            lessons_taught: 12,
            average_class_score: 85
          }
        };
        
        setProfileData(demoData);
        setEditableFields({
          phone: demoData.phone || '',
          address: demoData.address || '',
          language: demoData.language || 'en',
          profile_photo: demoData.profile_photo || '',
          password: '',
          confirmPassword: ''
        });
        return;
      }

      // Primary: fetch logged-in user's own data
      let data: any | null = null;
      let response = await fetch(`/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fallback: admin viewing or id-specific
      if (!response.ok && userId) {
        response = await fetch(`/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      data = await response.json();
      setProfileData(data);
      setEditableFields({
        phone: data.phone || '',
        address: data.address || '',
        language: data.language || 'en',
        profile_photo: data.profile_photo || '',
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(t('profile.updateFailed'));
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditableFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to a file service
      // For now, we'll use a placeholder
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setEditableFields(prev => ({
          ...prev,
          profile_photo: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Validate password if provided
      if (editableFields.password && editableFields.password.length < 6) {
        setError(t('profile.invalidPassword'));
        return;
      }

      if (editableFields.password && editableFields.password !== editableFields.confirmPassword) {
        setError(t('profile.passwordMismatch'));
        return;
      }

      // Check if this is a demo user
      if (userId.startsWith('demo_') || localStorage.getItem('stem_token') === 'demo_token') {
        // For demo users, just update the local state
        setSuccess('Demo mode: Profile changes saved locally');
        setIsEditing(false);
        
        // Update the profile data with new values
        setProfileData(prev => prev ? {
          ...prev,
          phone: editableFields.phone,
          address: editableFields.address,
          language: editableFields.language,
          profile_photo: editableFields.profile_photo
        } : null);
        // Persist edited fields back to stored user for consistency
        try {
          const stored = localStorage.getItem('stem_user');
          const storedUser = stored ? JSON.parse(stored) : {};
          const updated = {
            ...storedUser,
            id: storedUser?.id || userId,
            name: storedUser?.name, // teacher name not editable here
            email: storedUser?.email,
            role: 'teacher'
          };
          localStorage.setItem('stem_user', JSON.stringify(updated));
        } catch {}
        
        // Clear password fields
        setEditableFields(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
        return;
      }

      const token = localStorage.getItem('stem_token');
      const updateData: any = {
        phone: editableFields.phone,
        address: editableFields.address,
        language: editableFields.language,
        profile_photo: editableFields.profile_photo
      };

      if (editableFields.password) {
        updateData.password = editableFields.password;
      }

      const idToUpdate = profileData?.id || userId;
      const response = await fetch(`/api/users/${idToUpdate}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccess(t('profile.profileUpdated'));
      setIsEditing(false);
      await fetchProfileData();
      
      // Clear password fields
      setEditableFields(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError(t('profile.updateFailed'));
      console.error('Error updating profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    if (profileData) {
      setEditableFields({
        phone: profileData.phone || '',
        address: profileData.address || '',
        language: profileData.language || 'en',
        profile_photo: profileData.profile_photo || '',
        password: '',
        confirmPassword: ''
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{t('profile.updateFailed')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <User className="w-4 h-4" />
            {t('profile.editProfile')}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('common.loading') : t('profile.saveChanges')}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              {t('profile.cancel')}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {editableFields.profile_photo ? (
                    <img
                      src={editableFields.profile_photo}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mt-4">{profileData.name}</h2>
              <p className="text-gray-600">{profileData.email}</p>
              <p className="text-sm text-gray-500 mt-1">{profileData.department}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.personalInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.name')}</label>
                <input
                  type="text"
                  value={profileData.name}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.email')}</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.phone')}</label>
                <input
                  type="tel"
                  value={editableFields.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${
                    isEditing ? 'bg-white' : 'bg-gray-50 text-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.language')}</label>
                <select
                  value={editableFields.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${
                    isEditing ? 'bg-white' : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="hi">हिंदी</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.address')}</label>
                <textarea
                  value={editableFields.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${
                    isEditing ? 'bg-white' : 'bg-gray-50 text-gray-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.academicInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.school')}</label>
                <input
                  type="text"
                  value={profileData.school_id || 'N/A'}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.department')}</label>
                <input
                  type="text"
                  value={profileData.department || 'N/A'}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.subjectsTaught')}</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profileData.subjects_taught && profileData.subjects_taught.length > 0 ? (
                    profileData.subjects_taught.map((subject, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                      >
                        {subject}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No subjects assigned</span>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.classesHandled')}</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profileData.classes_handled && profileData.classes_handled.length > 0 ? (
                    profileData.classes_handled.map((className, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {className}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No classes assigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Summary */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t('profile.analytics')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">{profileData.analytics?.total_students || 0}</p>
                <p className="text-sm text-blue-700">{t('profile.totalStudents')}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">{profileData.analytics?.lessons_taught || 0}</p>
                <p className="text-sm text-green-700">{t('profile.lessonsTaught')}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">{Math.round(profileData.analytics?.average_class_score || 0)}%</p>
                <p className="text-sm text-purple-700">{t('profile.averageClassScore')}</p>
              </div>
            </div>
          </div>

          {/* Password Change */}
          {isEditing && (
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.password')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.newPassword')}</label>
                  <input
                    type="password"
                    value={editableFields.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.confirmPassword')}</label>
                  <input
                    type="password"
                    value={editableFields.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
