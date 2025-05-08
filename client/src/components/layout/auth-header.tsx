import { Link } from "wouter";

interface AuthHeaderProps {
  showLoginButton?: boolean;
  showRegisterButton?: boolean;
}

export default function AuthHeader({
  showLoginButton = false,
  showRegisterButton = false,
}: AuthHeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="h-10 w-10 rounded-md bg-primary-500 flex items-center justify-center text-white font-bold text-lg">
                SMS
              </div>
              <h1 className="ml-3 text-xl font-semibold text-neutral-900">
                School Management System
              </h1>
            </div>
          </Link>
          <div>
            {showLoginButton && (
              <Link href="/auth/login">
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  Login
                </button>
              </Link>
            )}
            {showRegisterButton && (
              <Link href="/auth/register">
                <button className="inline-flex items-center px-4 py-2 border border-primary-500 text-sm font-medium rounded-md shadow-sm text-primary-500 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  Register
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
