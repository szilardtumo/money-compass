import Image from 'next/image';
import Link from 'next/link';

export default function LegalLayout({ children }: LayoutProps<'/'>) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 flex flex-col gap-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_a]:underline">
      <Link href="/" className="flex gap-2 items-center text-xl font-medium no-underline!">
        <Image src="/compass.svg" alt="logo" width={32} height={32} />
        Money Compass
      </Link>
      {children}
    </main>
  );
}
