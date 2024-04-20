import Image from 'next/image';

import AuthForm from './_components/auth-form';

export default function AuthPage() {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="hidden bg-muted lg:block">
        <div className="text-xl font-medium m-8 flex gap-2 items-center">
          <Image src="/compass.svg" alt="logo" width={48} height={48} />
          Money Compass
        </div>
      </div>

      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <h1 className="text-2xl text-center font-semibold tracking-tight">
            Log in or Create an account
          </h1>
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
