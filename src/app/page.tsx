import { ImageEditor } from '@/components/image-editor';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <ImageEditor />
      </main>
      <Footer />
    </div>
  );
}
