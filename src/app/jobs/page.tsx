import { createClient } from '@/lib/supabase/server'
import JobCard from '@/components/job-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import HeaderWrapper from '@/components/header-wrapper'
import Footer from '@/components/footer'

export default async function JobsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; type?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()

    // Get all active jobs with company info
    let query = supabase
        .from('jobs')
        .select(`
      *,
      company:companies(*)
    `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    // Apply search filter
    if (params.q) {
        query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`)
    }

    // Apply type filter
    if (params.type) {
        query = query.eq('type', params.type)
    }

    const { data: jobs } = await query

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <HeaderWrapper />

            <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
                {/* Search & Filters */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">İş İlanları</h1>

                    <form className="flex gap-4 mb-4">
                        <Input
                            name="q"
                            placeholder="Pozisyon veya anahtar kelime ara..."
                            defaultValue={params.q || ''}
                            className="max-w-md"
                        />
                        <Button type="submit">Ara</Button>
                    </form>

                    <div className="flex gap-2">
                        <Link href="/jobs">
                            <Button
                                variant={!params.type ? 'default' : 'outline'}
                                size="sm"
                            >
                                Tümü
                            </Button>
                        </Link>
                        <Link href="/jobs?type=remote">
                            <Button
                                variant={params.type === 'remote' ? 'default' : 'outline'}
                                size="sm"
                            >
                                Uzaktan
                            </Button>
                        </Link>
                        <Link href="/jobs?type=onsite">
                            <Button
                                variant={params.type === 'onsite' ? 'default' : 'outline'}
                                size="sm"
                            >
                                Ofiste
                            </Button>
                        </Link>
                        <Link href="/jobs?type=hybrid">
                            <Button
                                variant={params.type === 'hybrid' ? 'default' : 'outline'}
                                size="sm"
                            >
                                Hibrit
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Job Listings */}
                {jobs && jobs.length > 0 ? (
                    <div className="grid gap-4">
                        {jobs.map((job) => (
                            <JobCard key={job.id} job={job as any} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-600 mb-4">
                            {params.q || params.type
                                ? 'Arama kriterlerinize uygun ilan bulunamadı.'
                                : 'Henüz iş ilanı yayınlanmamış.'}
                        </p>
                        {(params.q || params.type) && (
                            <Link href="/jobs">
                                <Button variant="outline">Tüm İlanları Gör</Button>
                            </Link>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}
