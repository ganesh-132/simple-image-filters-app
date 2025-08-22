import { ImageEditor } from '@/components/image-editor';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow">
        <ImageEditor />
      </main>
      <Footer />
    </div>
  );
}
