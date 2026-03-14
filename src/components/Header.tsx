import { getSessionUser } from '@/lib/auth/session'
import { HeaderAuthControls } from '@/components/HeaderAuthControls'

export async function Header() {
  const sessionUser = await getSessionUser()
  const isAnonymous = !sessionUser
  const userLabel = isAnonymous
    ? 'Anonymous'
    : sessionUser.fullName ?? sessionUser.displayName ?? sessionUser.networkUserName ?? sessionUser.employeeNumber ?? 'Signed in'

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Metrology Ticket System</h1>
        <HeaderAuthControls fullName={userLabel} isAnonymous={isAnonymous} />
      </div>
    </header>
  )
}



