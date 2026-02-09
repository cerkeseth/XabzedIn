import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function SeekerApplicationsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth')
    }

    // Get all applications by this user
    const { data: applications } = await supabase
        .from('applications')
        .select(`
            *,
            job:jobs(
                *,
                company:companies(*)
            )
        `)
        .eq('seeker_id', user.id)
        .order('created_at', { ascending: false })

    const statusLabels = {
        pending: { label: 'Beklemede', variant: 'secondary' as const, color: 'text-gray-600' },
        reviewed: { label: 'İncelendi', variant: 'default' as const, color: 'text-blue-600' },
        accepted: { label: 'Kabul Edildi', variant: 'default' as const, color: 'text-green-600' },
        rejected: { label: 'Reddedildi', variant: 'destructive' as const, color: 'text-red-600' },
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Başvurularım</h1>
                <Link href="/jobs">
                    <Button>İş İlanlarına Git</Button>
                </Link>
            </div>

            {applications && applications.length > 0 ? (
                <div className="space-y-4">
                    {applications.map((app) => {
                        const status = statusLabels[app.status as keyof typeof statusLabels] || statusLabels.pending

                        return (
                            <Card key={app.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-12 h-12 rounded-lg">
                                                <AvatarImage src={app.job?.company?.logo_url || ''} />
                                                <AvatarFallback className="rounded-lg bg-gray-100">
                                                    {app.job?.company?.name?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-lg">
                                                    {app.job?.title || 'Bilinmeyen Pozisyon'}
                                                </CardTitle>
                                                <CardDescription>
                                                    {app.job?.company?.name} • Başvuru: {formatDate(app.created_at)}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant={status.variant}>
                                            {status.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {app.job?.type && (
                                            <Badge variant="outline">
                                                {app.job.type === 'remote' ? 'Uzaktan' :
                                                    app.job.type === 'onsite' ? 'Ofiste' : 'Hibrit'}
                                            </Badge>
                                        )}
                                        {app.job?.location && (
                                            <Badge variant="outline">{app.job.location}</Badge>
                                        )}
                                    </div>

                                    {app.cover_letter && (
                                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                            <p className="text-xs text-gray-500 mb-1">Ön Yazınız:</p>
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {app.cover_letter}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Link href={`/jobs/${app.job_id}`}>
                                            <Button variant="outline" size="sm">İlanı Görüntüle</Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-600 mb-4">Henüz başvuru yapmadınız.</p>
                        <Link href="/jobs">
                            <Button>İş İlanlarını Keşfet</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
