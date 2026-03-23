import AppShellLayout from '@/components/AppShellLayout'

interface ServiceTicketsLayoutProps {
    children: React.ReactNode
}

export default async function ServiceTicketsLayout({children}: ServiceTicketsLayoutProps) {
    return <AppShellLayout>{children}</AppShellLayout>
}

