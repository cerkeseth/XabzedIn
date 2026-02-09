import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import RepublishButton from '@/components/republish-button'

export default async function EmployerJobsPage() {
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

    // Get all jobs for this company (including archived/expired)
    const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

    const jobTypeLabels = {
        remote: 'Uzaktan',
        onsite: 'Ofiste',
        hybrid: 'Hibrit',
    }

    const getJobStatus = (job: any) => {
        if (job.is_archived) return { label: 'Arşivlenmiş', variant: 'secondary' as const }
        if (job.expires_at && new Date(job.expires_at) < new Date()) return { label: 'Süresi Dolmuş', variant: 'destructive' as const }
        if (!job.is_active) return { label: 'Pasif', variant: 'secondary' as const }
        return { label: 'Aktif', variant: 'default' as const }
    }

    const formatExpiresAt = (expiresAt: string | null) => {
        if (!expiresAt) return null
        const date = new Date(expiresAt)
        const now = new Date()
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return 'Süresi doldu'
        if (diffDays === 0) return 'Bugün bitiyor'
        if (diffDays === 1) return 'Yarın bitiyor'
        return `${diffDays} gün kaldı`
    }

    const isExpiredOrArchived = (job: any) => {
        return job.is_archived || (job.expires_at && new Date(job.expires_at) < new Date())
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">İş İlanlarım</h1>
                <Link href="/dashboard/employer/jobs/new">
                    <Button>+ Yeni İlan</Button>
                </Link>
            </div>

            {jobs && jobs.length > 0 ? (
                <div className="space-y-4">
                    {jobs.map((job) => {
                        const status = getJobStatus(job)
                        const expiresText = formatExpiresAt(job.expires_at)
                        const canRepublish = isExpiredOrArchived(job)

                        return (
                            <Card key={job.id} className={canRepublish ? 'opacity-75' : ''}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{job.title}</CardTitle>
                                            <CardDescription className="mt-1">
                                                {job.location && `${job.location} • `}
                                                {job.type && jobTypeLabels[job.type as keyof typeof jobTypeLabels]}
                                                {expiresText && ` • ${expiresText}`}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={status.variant}>
                                            {status.label}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                        {job.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Link href={`/dashboard/employer/jobs/${job.id}`}>
                                            <Button variant="outline" size="sm">Düzenle</Button>
                                        </Link>
                                        <Link href={`/dashboard/employer/jobs/${job.id}/applications`}>
                                            <Button variant="outline" size="sm">Başvuruları Gör</Button>
                                        </Link>
                                        {!canRepublish && (
                                            <Link href={`/jobs/${job.id}`}>
                                                <Button variant="ghost" size="sm">Önizle</Button>
                                            </Link>
                                        )}
                                        {canRepublish && (
                                            <RepublishButton jobId={job.id} />
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
                        <p className="text-gray-600 mb-4">Henüz iş ilanı yayınlamadınız.</p>
                        <Link href="/dashboard/employer/jobs/new">
                            <Button>İlk İlanınızı Oluşturun</Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
