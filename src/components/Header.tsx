import { getCurrentUser } from '@/lib/auth/currentUser'
import { HeaderAuthControls } from '@/components/HeaderAuthControls'

export async function Header() {
  const currentUser = await getCurrentUser()
  const isAnonymous = !currentUser
  const userLabel = isAnonymous
    ? 'Anonymous'
    : currentUser.fullName ?? currentUser.displayName ?? currentUser.networkUserName ?? currentUser.employeeNumber ?? 'Signed in'

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Metrology Ticket System</h1>
        <HeaderAuthControls fullName={userLabel} isAnonymous={isAnonymous} />
      </div>
    </header>
  )
}



