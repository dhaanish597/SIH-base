import React, { useState, useEffect } from 'react';
import { Leaderboard } from './Leaderboard';

interface User {
  id: string;
  name: string;
  email: string;
  class: string;
  role: string;
}

export function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoadingUser(true);
        
        const token = localStorage.getItem('stem_token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch user profile: ${response.status} ${errorText}`);
        }

        const userData = await response.json();
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Handle error appropriately - could set error state or redirect to login
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Dashboard</h1>
        
        <Leaderboard 
          isUserDataLoading={isLoadingUser} 
          userClass={currentUser?.class} 
        />
      </div>
    </div>
  );
}
