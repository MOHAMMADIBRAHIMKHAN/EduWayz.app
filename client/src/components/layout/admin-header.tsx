export default function AdminHeader() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-md bg-primary-500 flex items-center justify-center text-white font-bold text-lg">
              SMS
            </div>
            <h1 className="ml-3 text-xl font-semibold text-neutral-900">
              School Management System
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-neutral-600">Welcome, Super Admin</span>
            <div className="relative">
              <button className="flex items-center focus:outline-none">
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                  SA
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
