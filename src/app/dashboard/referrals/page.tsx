import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import HeaderWrapper from '@/components/header-wrapper'

export default async function ReferralsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth')
    }

    // Get user's referral code
    const { data: myCode } = await supabase
        .from('referral_codes')
        .select('code, is_used, used_at')
        .eq('owner_id', user.id)
        .single()

    // Get who referred this user
    const { data: profile } = await supabase
        .from('profiles')
        .select('referred_by')
        .eq('id', user.id)
        .single()

    // Get referrer's info if exists
    let referrerName = null
    if (profile?.referred_by) {
        const { data: referrer } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', profile.referred_by)
            .single()
        referrerName = referrer?.full_name || referrer?.email
    }

    // Get who this user referred (people who used their code)
    const { data: referredUsers } = await supabase
        .from('referral_codes')
        .select(`
            used_by_id,
            used_at,
            profiles:used_by_id (
                full_name,
                email,
                created_at
            )
        `)
        .eq('owner_id', user.id)
        .eq('is_used', true)

    return (
        <div className="min-h-screen bg-gray-50">
            <HeaderWrapper />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Referanslarım</h1>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* My Referral Code */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Referans Kodum</CardTitle>
                            <CardDescription>
                                Bu kodu paylaşarak arkadaşlarınızı davet edebilirsiniz.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {myCode ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <code className="text-2xl font-mono font-bold tracking-wider bg-gray-100 px-4 py-2 rounded-lg">
                                            {myCode.code}
                                        </code>
                                        {myCode.is_used ? (
                                            <Badge variant="secondary">Kullanıldı</Badge>
                                        ) : (
                                            <Badge variant="default" className="bg-green-500">Aktif</Badge>
                                        )}
                                    </div>
                                    {myCode.is_used && myCode.used_at && (
                                        <p className="text-sm text-gray-500">
                                            Kullanım tarihi: {new Date(myCode.used_at).toLocaleDateString('tr-TR')}
                                        </p>
                                    )}
                                    {!myCode.is_used && (
                                        <p className="text-sm text-gray-500">
                                            Bu kod henüz kullanılmadı. Bir arkadaşınızla paylaşın!
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500">Referans kodunuz henüz oluşturulmamış.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Who Referred Me */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Beni Davet Eden</CardTitle>
                            <CardDescription>
                                Sizi platforma davet eden kişi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {referrerName ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <span className="font-medium">{referrerName}</span>
                                </div>
                            ) : (
                                <p className="text-gray-500">Admin tarafından oluşturulan kodla kaydoldunuz.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* People I Referred */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Davet Ettiklerim</CardTitle>
                        <CardDescription>
                            Referans kodunuzu kullanarak kayıt olan kişiler.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {referredUsers && referredUsers.length > 0 ? (
                            <div className="space-y-3">
                                {referredUsers.map((item) => {
                                    const profile = item.profiles as unknown as { full_name: string | null; email: string; created_at: string } | null
                                    return (
                                        <div key={item.used_by_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-medium">{profile?.full_name || 'İsimsiz Kullanıcı'}</p>
                                                    <p className="text-sm text-gray-500">{profile?.email}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                {item.used_at && new Date(item.used_at).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p>Henüz kimseyi davet etmediniz.</p>
                                <p className="text-sm mt-1">Referans kodunuzu paylaşarak arkadaşlarınızı davet edin!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
