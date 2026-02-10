import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HeaderWrapper from '@/components/header-wrapper'
import Footer from '@/components/footer'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <HeaderWrapper />

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
                {children}
            </main>

            <Footer />
        </div>
    )
}
