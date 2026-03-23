import AppShellLayout from '@/components/AppShellLayout'

interface PurchaseOrdersLayoutProps {
    children: React.ReactNode
}

export default async function PurchaseOrdersLayout({children}: PurchaseOrdersLayoutProps) {
    return <AppShellLayout>{children}</AppShellLayout>
}

