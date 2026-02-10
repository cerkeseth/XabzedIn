import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import ApplyButton from '@/components/apply-button'
import HeaderWrapper from '@/components/header-wrapper'
import Footer from '@/components/footer'

export default async function JobDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // Get job with company info
    const { data: job } = await supabase
        .from('jobs')
        .select(`
      *,
      company:companies(*)
    `)
        .eq('id', id)
        .eq('is_active', true)
        .single()

    if (!job) {
        notFound()
    }

    // Check if user is logged in and is a seeker
    const { data: { user } } = await supabase.auth.getUser()

    let profileRole = null
    let hasApplied = false

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        profileRole = profile?.role

        // Check if already applied
        if (profileRole === 'seeker') {
            const { data: application } = await supabase
                .from('applications')
                .select('id')
                .eq('job_id', id)
                .eq('seeker_id', user.id)
                .single()

            hasApplied = !!application
        }
    }

    const jobTypeLabels = {
        remote: 'Uzaktan',
        onsite: 'Ofiste',
        hybrid: 'Hibrit',
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <HeaderWrapper />

            <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
                <div className="mb-6">
                    <Link href="/jobs">
                        <Button variant="ghost" size="sm">← Tüm İlanlar</Button>
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-start gap-4">
                                    <Avatar className="w-16 h-16 rounded-lg">
                                        <AvatarImage src={job.company?.logo_url || ''} alt={job.company?.name} />
                                        <AvatarFallback className="rounded-lg bg-gray-100 text-xl">
                                            {job.company?.name?.charAt(0) || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-2xl">{job.title}</CardTitle>
                                        <CardDescription className="text-base mt-1">
                                            {job.company?.name}
                                        </CardDescription>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-4">
                                    {job.type && (
                                        <Badge variant="secondary">
                                            {jobTypeLabels[job.type as keyof typeof jobTypeLabels]}
                                        </Badge>
                                    )}
                                    {job.location && (
                                        <Badge variant="outline">{job.location}</Badge>
                                    )}
                                    {job.expires_at && (() => {
                                        const date = new Date(job.expires_at)
                                        const now = new Date()
                                        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                                        if (diffDays > 0) {
                                            let text = ''
                                            if (diffDays === 1) text = 'Son 1 gün'
                                            else if (diffDays <= 7) text = `${diffDays} gün kaldı`
                                            else if (diffDays <= 30) text = `${diffDays} gün kaldı`
                                            else text = `${Math.floor(diffDays / 7)} hafta kaldı`
                                            return (
                                                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                                                    ⏳ {text}
                                                </Badge>
                                            )
                                        }
                                        return null
                                    })()}
                                </div>
                            </CardHeader>

                            <Separator />

                            <CardContent className="pt-6">
                                <h3 className="font-semibold text-gray-900 mb-3">İlan Detayı</h3>
                                <div className="prose prose-gray max-w-none">
                                    <p className="whitespace-pre-wrap text-gray-700">
                                        {job.description}
                                    </p>
                                </div>

                                <div className="mt-6 text-sm text-gray-500">
                                    Yayınlanma tarihi: {formatDate(job.created_at)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Apply Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Başvuru</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!user ? (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Başvuru yapmak için giriş yapmanız gerekiyor.
                                        </p>
                                        <Link href="/auth" className="w-full">
                                            <Button className="w-full">Giriş Yap</Button>
                                        </Link>
                                    </div>
                                ) : profileRole !== 'seeker' ? (
                                    <p className="text-sm text-gray-600">
                                        Sadece iş arayanlar başvuru yapabilir.
                                    </p>
                                ) : hasApplied ? (
                                    <div className="text-center">
                                        <Badge className="bg-green-100 text-green-800">
                                            ✓ Başvuru Yapıldı
                                        </Badge>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Bu ilana zaten başvurdunuz.
                                        </p>
                                    </div>
                                ) : (
                                    <ApplyButton jobId={id} />
                                )}
                            </CardContent>
                        </Card>

                        {/* Company Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Şirket Hakkında</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 rounded-lg">
                                        <AvatarImage src={job.company?.logo_url || ''} alt={job.company?.name} />
                                        <AvatarFallback className="rounded-lg bg-gray-100">
                                            {job.company?.name?.charAt(0) || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{job.company?.name}</p>
                                        {job.company?.sector && (
                                            <p className="text-sm text-gray-500">{job.company.sector}</p>
                                        )}
                                    </div>
                                </div>

                                {job.company?.description && (
                                    <p className="text-sm text-gray-600">
                                        {job.company.description}
                                    </p>
                                )}

                                {job.company?.website && (
                                    <a
                                        href={job.company.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        {job.company.website.replace(/^https?:\/\//, '')}
                                    </a>
                                )}
                            </CardContent>
                        </Card>

                        {/* Contact Info Card */}
                        {(job.contact_name || job.contact_phone || job.contact_email) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">İletişim Bilgileri</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {job.contact_name && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500">İlgili Kişi:</span>
                                            <span className="font-medium">{job.contact_name}</span>
                                        </div>
                                    )}
                                    {job.contact_phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500">Telefon:</span>
                                            <a href={`tel:${job.contact_phone}`} className="font-medium text-blue-600 hover:underline">
                                                {job.contact_phone}
                                            </a>
                                        </div>
                                    )}
                                    {job.contact_email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500">E-posta:</span>
                                            <a href={`mailto:${job.contact_email}`} className="font-medium text-blue-600 hover:underline">
                                                {job.contact_email}
                                            </a>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
