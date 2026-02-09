import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function JobApplicationsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id: jobId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth')
    }

    // Verify job belongs to user's company
    const { data: job } = await supabase
        .from('jobs')
        .select(`
      *,
      company:companies!inner(*)
    `)
        .eq('id', jobId)
        .eq('company.owner_id', user.id)
        .single()

    if (!job) {
        redirect('/dashboard/employer/jobs')
    }

    // Get applications for this job
    const { data: applications } = await supabase
        .from('applications')
        .select(`
      *,
      seeker:profiles(*)
    `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })

    const statusLabels = {
        pending: { label: 'Beklemede', variant: 'secondary' as const },
        reviewed: { label: 'İncelendi', variant: 'outline' as const },
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
                <div>
                    <Link href="/dashboard/employer/jobs">
                        <Button variant="ghost" size="sm" className="mb-2">← Geri</Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                    <p className="text-gray-600">Başvurular ({applications?.length || 0})</p>
                </div>
            </div>

            {applications && applications.length > 0 ? (
                <div className="space-y-4">
                    {applications.map((app) => (
                        <Card key={app.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={app.seeker?.avatar_url || ''} alt={app.seeker?.full_name || ''} />
                                            <AvatarFallback>
                                                {app.seeker?.full_name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">{app.seeker?.full_name || 'İsimsiz'}</CardTitle>
                                            <CardDescription>
                                                {app.seeker?.email} • Başvuru: {formatDate(app.created_at)}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={statusLabels[app.status as keyof typeof statusLabels]?.variant}>
                                        {statusLabels[app.status as keyof typeof statusLabels]?.label}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {app.cover_letter && (
                                    <div className="mb-4">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Ön Yazı:</p>
                                        <p className="text-sm text-gray-600">{app.cover_letter}</p>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    {app.seeker?.phone && (
                                        <div>
                                            <span className="font-medium">Telefon:</span> {app.seeker.phone}
                                        </div>
                                    )}
                                    {app.seeker?.linkedin_url && (
                                        <div>
                                            <span className="font-medium">LinkedIn:</span>{' '}
                                            <a href={app.seeker.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                Profil
                                            </a>
                                        </div>
                                    )}
                                    {app.seeker?.community_reference && (
                                        <div className="md:col-span-2">
                                            <span className="font-medium">Topluluk Referansı:</span> {app.seeker.community_reference}
                                        </div>
                                    )}
                                </div>

                                {app.seeker?.skills && app.seeker.skills.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Yetenekler:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {app.seeker.skills.map((skill: string) => (
                                                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 flex gap-2">
                                    <Link href={`/profile/${app.seeker_id}`}>
                                        <Button variant="outline" size="sm">Profili Görüntüle</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-600">Bu ilana henüz başvuru yapılmamış.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
