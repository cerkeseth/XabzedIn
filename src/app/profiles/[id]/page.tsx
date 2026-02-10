import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import HeaderWrapper from '@/components/header-wrapper'
import Footer from '@/components/footer'

export default async function ProfilePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // Get profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (!profile) {
        notFound()
    }

    // Get experiences
    const { data: experiences } = await supabase
        .from('experiences')
        .select('*')
        .eq('profile_id', id)
        .order('start_date', { ascending: false })

    // Get education
    const { data: education } = await supabase
        .from('education')
        .select('*')
        .eq('profile_id', id)
        .order('start_date', { ascending: false })

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <HeaderWrapper />

            <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
                {/* Profile Header Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-start gap-6">
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
                                <AvatarFallback className="text-2xl">
                                    {profile.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <CardTitle className="text-2xl">
                                    {profile.full_name || 'İsimsiz Kullanıcı'}
                                </CardTitle>
                                <CardDescription className="text-base mt-1">
                                    {profile.email}
                                </CardDescription>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    {profile.phone && (
                                        <Badge variant="outline">📞 {profile.phone}</Badge>
                                    )}
                                    {profile.linkedin_url && (
                                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                                            <Badge variant="outline" className="hover:bg-blue-50">
                                                LinkedIn
                                            </Badge>
                                        </a>
                                    )}
                                    {profile.community_reference && (
                                        <Badge variant="secondary">
                                            🏛️ {profile.community_reference}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    {profile.bio && (
                        <>
                            <Separator />
                            <CardContent className="pt-4">
                                <h3 className="font-semibold text-gray-900 mb-2">Hakkında</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
                            </CardContent>
                        </>
                    )}
                </Card>

                {/* Skills */}
                {profile.skills && profile.skills.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Yetenekler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill: string, index: number) => (
                                    <Badge key={index} variant="secondary">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Experience */}
                {experiences && experiences.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-lg">İş Deneyimi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {experiences.map((exp: any) => (
                                <div key={exp.id} className="border-l-2 border-gray-200 pl-4">
                                    <h4 className="font-semibold">{exp.position}</h4>
                                    <p className="text-gray-600">{exp.company_name}</p>
                                    <p className="text-sm text-gray-500">
                                        {exp.start_date} - {exp.is_current ? 'Devam Ediyor' : exp.end_date || 'Bilinmiyor'}
                                    </p>
                                    {exp.description && (
                                        <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Education */}
                {education && education.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Eğitim</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {education.map((edu: any) => (
                                <div key={edu.id} className="border-l-2 border-gray-200 pl-4">
                                    <h4 className="font-semibold">{edu.school_name}</h4>
                                    {edu.degree && (
                                        <p className="text-gray-600">
                                            {edu.degree}
                                            {edu.field_of_study && ` - ${edu.field_of_study}`}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-500">
                                        {edu.start_date} - {edu.end_date || 'Devam Ediyor'}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Legacy summaries (if no structured data) */}
                {(!experiences || experiences.length === 0) && profile.experience_summary && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-lg">İş Deneyimi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 whitespace-pre-wrap">{profile.experience_summary}</p>
                        </CardContent>
                    </Card>
                )}

                {(!education || education.length === 0) && profile.education_summary && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Eğitim</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 whitespace-pre-wrap">{profile.education_summary}</p>
                        </CardContent>
                    </Card>
                )}
            </main>

            <Footer />
        </div>
    )
}
