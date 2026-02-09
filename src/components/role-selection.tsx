'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { UserRole } from '@/types/database'

interface RoleSelectionProps {
    userId: string
}

export default function RoleSelection({ userId }: RoleSelectionProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleRoleSelect = async (role: UserRole) => {
        setIsLoading(true)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role })
                .eq('id', userId)

            if (error) {
                toast.error('Rol seçimi başarısız', {
                    description: error.message,
                })
                return
            }

            toast.success('Rol seçildi!')

            if (role === 'employer') {
                router.push('/dashboard/employer')
            } else {
                router.push('/dashboard/seeker')
            }
            router.refresh()
        } catch {
            toast.error('Bir hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Hoş Geldiniz!</h1>
                    <p className="text-gray-600 mt-2">
                        XabzedIn&apos;de nasıl devam etmek istersiniz?
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card
                        className="cursor-pointer transition-all hover:shadow-lg hover:border-gray-400"
                        onClick={() => !isLoading && handleRoleSelect('seeker')}
                    >
                        <CardHeader className="text-center pb-2">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-8 h-8 text-gray-700"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            <CardTitle className="text-xl">İş Arıyorum</CardTitle>
                            <CardDescription>
                                Yeni kariyer fırsatları arıyorum
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <ul className="text-sm text-gray-600 space-y-2 mb-4">
                                <li>✓ Dijital CV oluştur</li>
                                <li>✓ İş ilanlarına başvur</li>
                                <li>✓ Profil oluştur</li>
                            </ul>
                            <Button
                                className="w-full"
                                disabled={isLoading}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleRoleSelect('seeker')
                                }}
                            >
                                {isLoading ? 'Seçiliyor...' : 'İş Arayan Olarak Devam Et'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer transition-all hover:shadow-lg hover:border-gray-400"
                        onClick={() => !isLoading && handleRoleSelect('employer')}
                    >
                        <CardHeader className="text-center pb-2">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-8 h-8 text-gray-700"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                </svg>
                            </div>
                            <CardTitle className="text-xl">İş Veriyorum</CardTitle>
                            <CardDescription>
                                Şirketim için çalışan arıyorum
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <ul className="text-sm text-gray-600 space-y-2 mb-4">
                                <li>✓ Şirket profili oluştur</li>
                                <li>✓ İş ilanı yayınla</li>
                                <li>✓ Başvuruları incele</li>
                            </ul>
                            <Button
                                className="w-full"
                                disabled={isLoading}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleRoleSelect('employer')
                                }}
                            >
                                {isLoading ? 'Seçiliyor...' : 'İşveren Olarak Devam Et'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
