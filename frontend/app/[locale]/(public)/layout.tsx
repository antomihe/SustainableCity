// frontend\app\(public)\layout.tsx
import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main> 
        {children}
      </main>
      <Footer />
    </>
  );
}