import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DigitalCVForm from '@/components/digital-cv-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function SeekerDashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'seeker') {
        redirect('/dashboard')
    }

    // Get user's applications count
    const { count: applicationsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('seeker_id', user.id)

    // Get user's experiences
    const { data: experiences } = await supabase
        .from('experiences')
        .select('*')
        .eq('profile_id', user.id)
        .order('start_date', { ascending: false })

    // Get user's education
    const { data: education } = await supabase
        .from('education')
        .select('*')
        .eq('profile_id', user.id)
        .order('start_date', { ascending: false })

    // Count experiences for profile status
    const hasExperiences = experiences && experiences.length > 0

    return (
        <div className="space-y-8">
            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Başvurularım</CardDescription>
                        <CardTitle className="text-3xl">{applicationsCount || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/seeker/applications">
                            <Button variant="link" className="p-0 h-auto">
                                Başvuruları Görüntüle →
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Profil Durumu</CardDescription>
                        <CardTitle className="text-lg">
                            {hasExperiences ? '✓ Tamamlandı' : '⚠ Eksik'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500">
                            {hasExperiences ? 'Profiliniz hazır' : 'Deneyim ekleyin'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>İş İlanları</CardDescription>
                        <CardTitle className="text-lg">Keşfet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href="/jobs">
                            <Button variant="link" className="p-0 h-auto">
                                İlanları Görüntüle →
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Digital CV Form */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Dijital CV</h2>
                <DigitalCVForm
                    profile={profile}
                    experiences={experiences || []}
                    education={education || []}
                />
            </div>
        </div>
    )
}
