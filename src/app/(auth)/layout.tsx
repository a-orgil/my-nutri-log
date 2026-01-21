export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">My Nutri Log</h1>
          <p className="mt-2 text-sm text-gray-600">
            カロリー・PFCバランス管理アプリ
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
