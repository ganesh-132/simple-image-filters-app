"use client";

import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="py-4 px-6 flex items-center justify-between border-b sticky top-0 z-50 bg-background">
        <h1 className="text-xl font-semibold">Simple Image Filters – By Ganesh Upadhyay</h1>
        <ThemeToggle />
    </header>
  )
}
