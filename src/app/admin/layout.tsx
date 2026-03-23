import AppShellLayout from '@/components/AppShellLayout'

interface AdminLayoutProps {
    children: React.ReactNode
}

export default async function AdminLayout({children}: AdminLayoutProps) {
    return <AppShellLayout>{children}</AppShellLayout>
}

