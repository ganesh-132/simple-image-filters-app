import { ImageEditor } from '@/components/image-editor';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow">
        <ImageEditor />
      </main>
    </div>
  );
}
