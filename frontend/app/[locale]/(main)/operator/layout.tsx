// frontend\app\(main)\operator\layout.tsx
import OperatorSidebar from '@/components/shared/OperatorSidebar';
import Header from '@/components/shared/Header';
import { SocketProvider } from '@/contexts/SocketContext'; 

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SocketProvider namespace="containers">
      <div className="flex h-screen bg-background text-foreground">
        <OperatorSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SocketProvider>
  );
}