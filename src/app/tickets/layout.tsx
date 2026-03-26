/**
 * AUTO-GENERATED MODULE DOC
 * App Router layout module for '/tickets'.
 */
import AppShellLayout from '@/components/AppShellLayout'

/**
 * Parallel route slots used by the tickets section.
 */
interface TasksLayoutProps {
    children: React.ReactNode
    modal: React.ReactNode
    child?: React.ReactNode
    params: Promise<Record<string, never>>
}

/**
 * Tickets section layout that forwards modal/child parallel routes
 * into the shared app shell.
 */
export default async function TasksLayout({ children, modal, child }: TasksLayoutProps) {
    return <AppShellLayout modal={modal} child={child}>{children}</AppShellLayout>
}
