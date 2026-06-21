import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <Sidebar />
      <div className="md:ml-[260px] min-h-screen">
        {children}
      </div>
    </div>
  );
}
