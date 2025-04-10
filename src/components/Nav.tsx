'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Users, Home, Settings, ChevronDown } from 'lucide-react';

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
  Family: FamilyMember[];
}

interface NavProps {
  selectedUserId?: string;
  onSelectUser?: (userId: string) => void;
}

const Nav = ({ selectedUserId, onSelectUser }: NavProps) => {
  
  return (
    <header className="fixed top-0 left-0 right-0 h-14 border-b z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center">
          <Link
            href="/dashboard"
            className="inline-block transition-transform duration-200 ease-in-out hover:scale-105 mr-6"
          >
            <h1 className="text-2xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Family
              </span>
              <span className="text-gray-800 dark:text-gray-200">Manager</span>
            </h1>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <Link 
              href="/" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="flex items-center">
                <Home className="h-4 w-4 mr-2" />
                Home
              </span>
            </Link>
              
            
            <Link 
              href="/profile" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Nav;