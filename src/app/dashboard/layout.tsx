import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Logo from '@/components/logo'

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

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, avatar_url')
        .eq('id', user.id)
        .single()

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/dashboard">
                        <Logo size="sm" />
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Link href="/jobs">
                            <Button variant="ghost" size="sm">İş İlanları</Button>
                        </Link>
                        {profile?.role === 'seeker' && (
                            <Link href="/dashboard/seeker">
                                <Button variant="ghost" size="sm">Profilim</Button>
                            </Link>
                        )}
                        {profile?.role === 'employer' && (
                            <>
                                <Link href="/dashboard/employer">
                                    <Button variant="ghost" size="sm">Şirketim</Button>
                                </Link>
                                <Link href="/dashboard/employer/jobs">
                                    <Button variant="ghost" size="sm">İlanlarım</Button>
                                </Link>
                            </>
                        )}
                        <form action="/auth/signout" method="post">
                            <Button variant="outline" size="sm" type="submit">
                                Çıkış Yap
                            </Button>
                        </form>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    )
}
