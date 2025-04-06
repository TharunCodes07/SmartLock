'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import AddFamilyMemberModal from '@/components/AddFamilyMemberModal';
import AddCameraModal from '@/components/AddCameraModal';

interface Camera {
  id: string;
  name: string;
}

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  status: string;
  userId: string;
}

interface User {
  id: string;
  email: string;
  userName: string | null;
  password: string;
  family: FamilyMember[]; 
  cameras: Camera[];
}

export default function Profile() {
  const { data: session } = useSession();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUserData = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${session.user.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      setCurrentUser(userData);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchCurrentUserData();
    }
  }, [session]);

  const handleAddFamilyMember = () => {
    if (!session?.user?.id) return;
    setIsModalOpen(true);
  };

  const handleAddCamera = () => {
    if (!session?.user?.id) return;
    setIsCameraModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleCameraModalClose = () => {
    setIsCameraModalOpen(false);
  };

  const handleFamilyMemberAdded = () => {
    fetchCurrentUserData();
    handleModalClose();
  };

  const handleCameraAdded = () => {
    fetchCurrentUserData();
    handleCameraModalClose();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Not Authenticated</h2>
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Family Members Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {session.user.name || 'Your'} Family Members
              </h2>
              <button
                onClick={handleAddFamilyMember}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Add Family Member
              </button>
            </div>

            {currentUser && currentUser.family && currentUser.family.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentUser.family.map((familyMember) => (
                      <tr key={familyMember.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{familyMember.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{familyMember.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              familyMember.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {familyMember.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No family members added yet.</p>
                <p className="text-sm text-gray-500 mt-2">Click "Add Family Member" to get started.</p>
              </div>
            )}
          </div>

          {/* Cameras Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Your Cameras</h2>
              <button
                onClick={handleAddCamera}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Add Camera
              </button>
            </div>
            {currentUser?.cameras && currentUser.cameras.length > 0 ? (
              <ul className="space-y-2">
                {currentUser.cameras.map((camera) => (
                  <li key={camera.id} className="bg-gray-50 p-3 rounded-md text-gray-800">
                    {camera.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No cameras added yet.</p>
            )}
          </div>
        </div>
      </main>

      {isModalOpen && session?.user?.id && (
        <AddFamilyMemberModal
          userId={session.user.id}
          onClose={handleModalClose}
          onAdded={handleFamilyMemberAdded}
        />
      )}

      {isCameraModalOpen && session?.user?.id && (
        <AddCameraModal
          userId={session.user.id}
          onClose={handleCameraModalClose}
          onAdded={handleCameraAdded}
        />
      )}
    </div>
  );
}