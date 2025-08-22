"use client";

import { Github, Linkedin } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-black text-white py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-lg">Created by Ganesh Upadhyay</p>
        <div className="flex justify-center space-x-6 my-4">
          <Link href="https://www.linkedin.com/in/ganesh-upadhyay-663299263/" target="_blank" rel="noopener noreferrer">
            <Linkedin className="h-8 w-8 text-gray-400 hover:text-white transition-colors" />
          </Link>
          <Link href="https://github.com/ganesh-132" target="_blank" rel="noopener noreferrer">
            <Github className="h-8 w-8 text-gray-400 hover:text-white transition-colors" />
          </Link>
        </div>
        <p className="text-sm text-gray-500">Connect above</p>
      </div>
    </footer>
  );
}
