import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex gap-6 py-4">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-blue-600 font-medium [&.active]:text-blue-600 [&.active]:font-semibold"
                activeOptions={{ exact: true }}
              >
                Home
              </Link>
              <Link 
                to="/editor" 
                className="text-gray-700 hover:text-blue-600 font-medium [&.active]:text-blue-600 [&.active]:font-semibold"
              >
                Editor
              </Link>
              <Link 
                to="/templates" 
                className="text-gray-700 hover:text-blue-600 font-medium [&.active]:text-blue-600 [&.active]:font-semibold"
              >
                Templates
              </Link>
            </div>
          </div>
        </nav>
        
        <main className="max-w-4xl mx-auto p-4">
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </>
  ),
}) 