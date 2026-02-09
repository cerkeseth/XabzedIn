import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function EmployerApplicationsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth')
    }

    // Get user's company
    const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .single()

    if (!company) {
        redirect('/dashboard/employer')
    }

    // Get all applications for this company's jobs
    const { data: applications } = await supabase
        .from('applications')
        .select(`
            *,
            job:jobs!inner(*),
            seeker:profiles(*)
        `)
        .eq('job.company_id', company.id)
        .order('created_at', { ascending: false })

    const statusLabels = {
        pending: { label: 'Beklemede', variant: 'secondary' as const },
        reviewed: { label: 'İncelendi', variant: 'default' as const },
        accepted: { label: 'Kabul Edildi', variant: 'default' as const },
        rejected: { label: 'Reddedildi', variant: 'destructive' as const },
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
                <h1 className="text-2xl font-bold text-gray-900">Tüm Başvurular</h1>
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
                                            <Avatar>
                                                <AvatarImage src={app.seeker?.avatar_url || ''} />
                                                <AvatarFallback>
                                                    {app.seeker?.full_name?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-lg">
                                                    {app.seeker?.full_name || 'İsimsiz Aday'}
                                                </CardTitle>
                                                <CardDescription>
                                                    {app.job?.title} • {formatDate(app.created_at)}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant={status.variant}>
                                            {status.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {app.cover_letter && (
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                            {app.cover_letter}
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <Link href={`/dashboard/employer/jobs/${app.job_id}/applications`}>
                                            <Button variant="outline" size="sm">Başvuruları Gör</Button>
                                        </Link>
                                        {app.seeker && (
                                            <Link href={`/profiles/${app.seeker_id}`}>
                                                <Button variant="ghost" size="sm">Profili İncele</Button>
                                            </Link>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-600 mb-4">Henüz başvuru almadınız.</p>
                        <Link href="/dashboard/employer/jobs">
                            <Button variant="outline">İlanlarımı Gör</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
