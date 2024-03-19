import AuthForm from './_components/auth-form';

export default function AuthPage() {
  return (
    <div className="container relative hidden h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full min-h-screen flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          {/* TODO: Add logo */}
          Money Compass
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <h1 className="text-2xl text-center font-semibold tracking-tight">
            Log in or Create an account
          </h1>
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
