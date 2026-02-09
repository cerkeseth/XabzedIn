import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold text-gray-900">
                        XabzedIn
                    </Link>
                    <Link href="/jobs">
                        <Button variant="ghost">İş İlanları</Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-start gap-6">
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
                                <AvatarFallback className="text-2xl">
                                    {profile.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl">{profile.full_name || 'İsimsiz'}</CardTitle>
                                <CardDescription className="text-base mt-1">{profile.email}</CardDescription>

                                <div className="flex flex-wrap gap-2 mt-4">
                                    {profile.phone && (
                                        <Badge variant="outline">{profile.phone}</Badge>
                                    )}
                                    {profile.linkedin_url && (
                                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                                            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                                                LinkedIn
                                            </Badge>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6 space-y-6">
                        {profile.bio && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Hakkında</h3>
                                <p className="text-gray-700">{profile.bio}</p>
                            </div>
                        )}

                        {profile.community_reference && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Topluluk Referansı</h3>
                                <p className="text-gray-700">{profile.community_reference}</p>
                            </div>
                        )}

                        {profile.skills && profile.skills.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Yetenekler</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill: string) => (
                                        <Badge key={skill} variant="secondary">{skill}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Structured Experiences */}
                        {experiences && experiences.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">İş Deneyimi</h3>
                                <div className="space-y-4">
                                    {experiences.map((exp: any) => (
                                        <div key={exp.id} className="border-l-2 border-gray-200 pl-4">
                                            <h4 className="font-medium">{exp.position}</h4>
                                            <p className="text-gray-600">{exp.company_name}</p>
                                            <p className="text-sm text-gray-500">
                                                {exp.start_date || '?'} - {exp.is_current ? 'Devam ediyor' : exp.end_date || '?'}
                                            </p>
                                            {exp.description && (
                                                <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Structured Education */}
                        {education && education.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Eğitim</h3>
                                <div className="space-y-4">
                                    {education.map((edu: any) => (
                                        <div key={edu.id} className="border-l-2 border-gray-200 pl-4">
                                            <h4 className="font-medium">{edu.school_name}</h4>
                                            <p className="text-gray-600">
                                                {edu.degree}{edu.field_of_study && ` - ${edu.field_of_study}`}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {edu.start_date || '?'} - {edu.end_date || '?'}
                                            </p>
                                            {edu.description && (
                                                <p className="text-sm text-gray-600 mt-1">{edu.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
