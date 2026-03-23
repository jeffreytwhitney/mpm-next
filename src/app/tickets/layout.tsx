import AppShellLayout from '@/components/AppShellLayout'

interface TicketsLayoutProps {
    children: React.ReactNode
}

export default async function TicketsLayout({children}: TicketsLayoutProps) {
    return <AppShellLayout>{children}</AppShellLayout>
}

