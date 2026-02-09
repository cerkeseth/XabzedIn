import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Job, Company } from '@/types/database'

interface JobCardProps {
    job: Job & { company: Company }
}

export default function JobCard({ job }: JobCardProps) {
    const jobTypeLabels = {
        remote: 'Uzaktan',
        onsite: 'Ofiste',
        hybrid: 'Hibrit',
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - date.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Bugün'
        if (diffDays === 1) return 'Dün'
        if (diffDays < 7) return `${diffDays} gün önce`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`
        return `${Math.floor(diffDays / 30)} ay önce`
    }

    const formatExpiresAt = (expiresAt: string | null) => {
        if (!expiresAt) return null
        const date = new Date(expiresAt)
        const now = new Date()
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays <= 0) return null
        if (diffDays === 1) return 'Son 1 gün'
        if (diffDays <= 7) return `${diffDays} gün kaldı`
        if (diffDays <= 30) return `${diffDays} gün kaldı`
        return `${Math.floor(diffDays / 7)} hafta kaldı`
    }

    const expirationText = formatExpiresAt(job.expires_at)

    return (
        <Link href={`/jobs/${job.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12 rounded-lg">
                            <AvatarImage src={job.company?.logo_url || ''} alt={job.company?.name} />
                            <AvatarFallback className="rounded-lg bg-gray-100">
                                {job.company?.name?.charAt(0) || '?'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg">{job.title}</CardTitle>
                            <CardDescription className="mt-1">
                                {job.company?.name}
                                {job.company?.location && ` • ${job.company.location}`}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {job.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {job.type && (
                            <Badge variant="secondary">
                                {jobTypeLabels[job.type as keyof typeof jobTypeLabels]}
                            </Badge>
                        )}
                        {job.location && (
                            <Badge variant="outline">{job.location}</Badge>
                        )}
                        {expirationText && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                                ⏳ {expirationText}
                            </Badge>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">
                            {formatDate(job.created_at)}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
