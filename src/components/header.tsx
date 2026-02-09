'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState } from 'react'
import Logo from '@/components/logo'

interface HeaderProps {
    user: { id: string; email?: string } | null
    role: 'employer' | 'seeker' | null
}

export default function Header({ user, role }: HeaderProps) {
    const router = useRouter()
    const supabase = createClient()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success('Çıkış yapıldı')
        setIsMenuOpen(false)
        router.push('/')
        router.refresh()
    }

    const closeMenu = () => setIsMenuOpen(false)

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/">
                    <Logo size="sm" />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-9">
                    <Link href="/jobs" className="text-sm font-medium text-gray-900 hover:text-gray-600">
                        İş İlanları
                    </Link>

                    {user && role === 'employer' && (
                        <>
                            <Link href="/dashboard/employer" className="text-sm font-medium text-gray-900 hover:text-gray-600">
                                Şirketim
                            </Link>
                            <Link href="/dashboard/employer/jobs" className="text-sm font-medium text-gray-900 hover:text-gray-600">
                                İlanlarım
                            </Link>
                            <Link href="/dashboard/referrals" className="text-sm font-medium text-gray-900 hover:text-gray-600">
                                Referanslarım
                            </Link>
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                Çıkış Yap
                            </Button>
                        </>
                    )}

                    {user && role === 'seeker' && (
                        <>
                            <Link href="/dashboard/seeker" className="text-sm font-medium text-gray-900 hover:text-gray-600">
                                Profilim
                            </Link>
                            <Link href="/dashboard/referrals" className="text-sm font-medium text-gray-900 hover:text-gray-600">
                                Referanslarım
                            </Link>
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                Çıkış Yap
                            </Button>
                        </>
                    )}

                    {!user && (
                        <Link href="/auth">
                            <Button size="sm">Giriş Yap</Button>
                        </Link>
                    )}
                </nav>

                {/* Mobile Hamburger Button */}
                <button
                    className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Menü"
                >
                    {isMenuOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-gray-200 bg-white">
                    <nav className="flex flex-col px-4 py-3 space-y-3">
                        <Link
                            href="/jobs"
                            className="text-sm font-medium text-gray-900 hover:text-gray-600 py-2"
                            onClick={closeMenu}
                        >
                            İş İlanları
                        </Link>

                        {user && role === 'employer' && (
                            <>
                                <Link
                                    href="/dashboard/employer"
                                    className="text-sm font-medium text-gray-900 hover:text-gray-600 py-2"
                                    onClick={closeMenu}
                                >
                                    Şirketim
                                </Link>
                                <Link
                                    href="/dashboard/employer/jobs"
                                    className="text-sm font-medium text-gray-900 hover:text-gray-600 py-2"
                                    onClick={closeMenu}
                                >
                                    İlanlarım
                                </Link>
                                <Link
                                    href="/dashboard/referrals"
                                    className="text-sm font-medium text-gray-900 hover:text-gray-600 py-2"
                                    onClick={closeMenu}
                                >
                                    Referanslarım
                                </Link>
                                <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                                    Çıkış Yap
                                </Button>
                            </>
                        )}

                        {user && role === 'seeker' && (
                            <>
                                <Link
                                    href="/dashboard/seeker"
                                    className="text-sm font-medium text-gray-900 hover:text-gray-600 py-2"
                                    onClick={closeMenu}
                                >
                                    Profilim
                                </Link>
                                <Link
                                    href="/dashboard/referrals"
                                    className="text-sm font-medium text-gray-900 hover:text-gray-600 py-2"
                                    onClick={closeMenu}
                                >
                                    Referanslarım
                                </Link>
                                <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                                    Çıkış Yap
                                </Button>
                            </>
                        )}

                        {!user && (
                            <Link href="/auth" onClick={closeMenu}>
                                <Button size="sm" className="w-full">Giriş Yap</Button>
                            </Link>
                        )}
                    </nav>
                </div>
            )}
        </header>
    )
}
