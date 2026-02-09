import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JobForm from '@/components/job-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function NewJobPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth')
    }

    // Get user's company
    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!company) {
        redirect('/dashboard/employer')
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link href="/dashboard/employer/jobs">
                    <Button variant="ghost" size="sm">← Geri</Button>
                </Link>
            </div>
            <JobForm companyId={company.id} />
        </div>
    )
}
