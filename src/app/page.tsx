import { ImageEditor } from '@/components/image-editor';
import { SlidersHorizontal } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center h-16">
            <SlidersHorizontal className="h-6 w-6 text-primary" />
            <h1 className="ml-3 text-2xl font-bold text-foreground">
              FilterForge
            </h1>
          </div>
        </div>
      </header>
      <main className="flex-grow">
        <ImageEditor />
      </main>
    </div>
  );
}
