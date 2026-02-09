import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CompanyForm from '@/components/company-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function EmployerDashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'employer') {
        redirect('/dashboard')
    }

    // Get user's company
    const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .single()

    // Get job stats if company exists
    let jobsCount = 0
    let applicationsCount = 0

    if (company) {
        const { count: jCount } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)

        jobsCount = jCount || 0

        // Get total applications for all company jobs
        const { data: jobs } = await supabase
            .from('jobs')
            .select('id')
            .eq('company_id', company.id)

        if (jobs && jobs.length > 0) {
            const jobIds = jobs.map(j => j.id)
            const { count: aCount } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .in('job_id', jobIds)

            applicationsCount = aCount || 0
        }
    }

    return (
        <div className="space-y-8">
            {/* Stats */}
            {company && (
                <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Aktif İlanlar</CardDescription>
                            <CardTitle className="text-3xl">{jobsCount}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Link href="/dashboard/employer/jobs">
                                <Button variant="link" className="p-0 h-auto">
                                    İlanları Yönet →
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Toplam Başvuru</CardDescription>
                            <CardTitle className="text-3xl">{applicationsCount}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Link href="/dashboard/employer/applications">
                                <Button variant="link" className="p-0 h-auto">
                                    Başvuruları İncele →
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Yeni İlan</CardDescription>
                            <CardTitle className="text-lg">Oluştur</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Link href="/dashboard/employer/jobs/new">
                                <Button variant="link" className="p-0 h-auto">
                                    İlan Yayınla →
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Company Form */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {company ? 'Şirket Bilgileri' : 'Şirket Oluştur'}
                </h2>
                {!company && (
                    <p className="text-gray-600 mb-6">
                        İş ilanı yayınlamak için önce şirket profilinizi oluşturmanız gerekiyor.
                    </p>
                )}
                <CompanyForm company={company} userId={user.id} />
            </div>
        </div>
    )
}
