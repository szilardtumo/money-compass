import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="hidden bg-muted lg:block">
        <div className="text-xl font-medium m-8 flex gap-2 items-center">
          <Image src="/compass.svg" alt="logo" width={48} height={48} />
          Money Compass
        </div>
      </div>

      <div className="flex items-center justify-center py-12 h-screen">{children}</div>
    </div>
  );
}
