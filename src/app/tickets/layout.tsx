import AppShellLayout from '@/components/AppShellLayout'

interface TasksLayoutProps {
    children: React.ReactNode
    modal: React.ReactNode
    child?: React.ReactNode
    params: Promise<Record<string, never>>
}

export default async function TasksLayout({ children, modal, child }: TasksLayoutProps) {
    return <AppShellLayout modal={modal} child={child}>{children}</AppShellLayout>
}
