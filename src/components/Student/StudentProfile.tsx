import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Camera, Save, X, Award, TrendingUp, Clock, BookOpen } from 'lucide-react';

interface StudentProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  class?: string;
  school_id?: string;
  phone?: string;
  address?: string;
  language?: string;
  profile_photo?: string;
  roll_number?: string;
  progress?: {
    lessons_completed: number;
    average_score: number;
    total_time_spent: number;
    total_attempts: number;
  };
  badges?: Array<{
    badge_name: string;
    description: string;
    earned_at: string;
  }>;
}

interface StudentProfileProps {
  userId: string;
  onUserUpdate?: (user: { id: string; name: string; role: string; class?: string; email?: string }) => void;
}

export function StudentProfile({ userId, onUserUpdate }: StudentProfileProps) {
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editable fields state
  const [editableFields, setEditableFields] = useState({
    name: '',
    class: '',
    email: '',
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
      if (userId.startsWith('demo_') || token === 'demo_token') {
        // Create demo profile data
        const demoData: StudentProfileData = {
          id: userId,
          name: 'Student Priya',
          email: 'student@demo.com',
          role: 'student',
          class: '9',
          roll_number: 'STU001',
          phone: '+91 9876543211',
          address: 'Student Address, Demo City',
          language: 'en',
          progress: {
            lessons_completed: 15,
            average_score: 88,
            total_time_spent: 1200,
            total_attempts: 25
          },
          badges: [
            {
              badge_name: 'First Steps',
              description: 'Complete your first lesson',
              earned_at: '2024-01-15T10:30:00Z'
            },
            {
              badge_name: 'Math Wizard',
              description: 'Complete 10 math lessons',
              earned_at: '2024-01-20T14:45:00Z'
            }
          ]
        };
        
        setProfileData(demoData);
        setEditableFields({
          name: demoData.name || '',
          class: demoData.class || '',
          email: demoData.email || '',
          phone: demoData.phone || '',
          address: demoData.address || '',
          language: demoData.language || 'en',
          profile_photo: demoData.profile_photo || '',
          password: '',
          confirmPassword: ''
        });
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const data = await response.json();
      setProfileData(data);
      setEditableFields({
        name: data.name || '',
        class: data.class || '',
        email: data.email || '',
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
          name: editableFields.name,
          class: editableFields.class,
          email: editableFields.email,
          phone: editableFields.phone,
          address: editableFields.address,
          language: editableFields.language,
          profile_photo: editableFields.profile_photo
        } : null);
        
        // Update the user state in the parent component for demo mode
        if (onUserUpdate) {
          onUserUpdate({
            id: userId,
            name: editableFields.name,
            role: 'student',
            class: editableFields.class,
            email: editableFields.email
          });
        }
        
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
        name: editableFields.name,
        class: editableFields.class,
        email: editableFields.email,
        phone: editableFields.phone,
        address: editableFields.address,
        language: editableFields.language,
        profile_photo: editableFields.profile_photo
      };

      if (editableFields.password) {
        updateData.password = editableFields.password;
      }

      const response = await fetch(`/api/users/${userId}`, {
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

      const responseData = await response.json();
      setSuccess(t('profile.profileUpdated'));
      setIsEditing(false);
      
      // Update the profile data with the response
      if (responseData.user) {
        setProfileData(responseData.user);
        setEditableFields({
          name: responseData.user.name || '',
          class: responseData.user.class || '',
          email: responseData.user.email || '',
          phone: responseData.user.phone || '',
          address: responseData.user.address || '',
          language: responseData.user.language || 'en',
          profile_photo: responseData.user.profile_photo || '',
          password: '',
          confirmPassword: ''
        });
        
        // Update the user state in the parent component
        if (onUserUpdate) {
          onUserUpdate({
            id: responseData.user.id,
            name: responseData.user.name,
            role: responseData.user.role,
            class: responseData.user.class,
            email: responseData.user.email
          });
        }
      } else {
        await fetchProfileData();
      }
      
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
        name: profileData.name || '',
        class: profileData.class || '',
        email: profileData.email || '',
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
              <p className="text-sm text-gray-500 mt-1">{profileData.class} • {profileData.roll_number}</p>
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
                  value={editableFields.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${
                    isEditing ? 'bg-white' : 'bg-gray-50 text-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.email')}</label>
                <input
                  type="email"
                  value={editableFields.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${
                    isEditing ? 'bg-white' : 'bg-gray-50 text-gray-500'
                  }`}
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

          {/* Academic Information */}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.class')}</label>
                <input
                  type="text"
                  value={editableFields.class}
                  onChange={(e) => handleInputChange('class', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${
                    isEditing ? 'bg-white' : 'bg-gray-50 text-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.rollNumber')}</label>
                <input
                  type="text"
                  value={profileData.roll_number || 'N/A'}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Progress & Achievements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Progress Stats */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {t('profile.progress')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('profile.lessonsCompleted')}</span>
                  <span className="font-semibold">{profileData.progress?.lessons_completed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('profile.averageScore')}</span>
                  <span className="font-semibold">{Math.round(profileData.progress?.average_score || 0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('profile.totalTimeSpent')}</span>
                  <span className="font-semibold">{Math.round((profileData.progress?.total_time_spent || 0) / 60)} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('profile.totalAttempts')}</span>
                  <span className="font-semibold">{profileData.progress?.total_attempts || 0}</span>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                {t('profile.badges')}
              </h3>
              {profileData.badges && profileData.badges.length > 0 ? (
                <div className="space-y-2">
                  {profileData.badges.slice(0, 3).map((badge, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                      <Award className="w-4 h-4 text-yellow-600" />
                      <div>
                        <p className="font-medium text-sm">{badge.badge_name}</p>
                        <p className="text-xs text-gray-500">{t('profile.earnedAt')} {new Date(badge.earned_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {profileData.badges.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">+{profileData.badges.length - 3} more</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">{t('profile.noBadges')}</p>
              )}
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
