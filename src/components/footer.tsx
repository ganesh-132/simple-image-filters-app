"use client";

import { Github, Linkedin } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-black text-white py-6">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <p className="text-lg">Created with</p>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6 text-red-500"
            aria-hidden="true"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <p className="text-lg">by</p>
          <p className="text-lg font-bold">Ganesh Upadhyay</p>
        </div>
        <div className="flex justify-center items-center space-x-4 my-4">
          <Link href="https://github.com/ganesh-132" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <Github className="h-6 w-6" />
            <span>GitHub</span>
          </Link>
          <div className="border-l h-6 border-gray-600"></div>
          <Link href="https://www.linkedin.com/in/ganesh-upadhyay-663299263/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <Linkedin className="h-6 w-6" />
            <span>LinkedIn</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
