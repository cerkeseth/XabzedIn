import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import JobForm from '@/components/job-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function EditJobPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth')
    }

    // Get job and verify ownership via company
    const { data: job } = await supabase
        .from('jobs')
        .select(`
      *,
      company:companies!inner(*)
    `)
        .eq('id', id)
        .eq('company.owner_id', user.id)
        .single()

    if (!job) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/employer/jobs">
                    <Button variant="ghost" size="sm">← Geri Dön</Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">İlanı Düzenle</h1>
            </div>

            <JobForm job={job} companyId={job.company_id} />
        </div>
    )
}
