'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ApplyButtonProps {
    jobId: string
}

export default function ApplyButton({ jobId }: ApplyButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [coverLetter, setCoverLetter] = useState('')
    const supabase = createClient()
    const router = useRouter()

    const handleApply = async () => {
        setIsLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Lütfen giriş yapın')
                return
            }

            const { error } = await supabase
                .from('applications')
                .insert({
                    job_id: jobId,
                    seeker_id: user.id,
                    cover_letter: coverLetter || null,
                })

            if (error) {
                if (error.code === '23505') {
                    toast.error('Bu ilana zaten başvurdunuz')
                } else {
                    toast.error('Başvuru başarısız', { description: error.message })
                }
                return
            }

            toast.success('Başvurunuz alındı!', {
                description: 'İşveren profilinizi inceleyecektir.',
            })
            router.refresh()
        } catch {
            toast.error('Bir hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    if (!showForm) {
        return (
            <Button
                className="w-full"
                size="lg"
                onClick={() => setShowForm(true)}
            >
                Başvur
            </Button>
        )
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="cover_letter">Ön Yazı (Opsiyonel)</Label>
                <Textarea
                    id="cover_letter"
                    placeholder="Kendinizi tanıtın, neden bu pozisyona uygun olduğunuzu belirtin..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={4}
                    disabled={isLoading}
                />
            </div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={isLoading}
                >
                    İptal
                </Button>
                <Button
                    className="flex-1"
                    onClick={handleApply}
                    disabled={isLoading}
                >
                    {isLoading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
                </Button>
            </div>
        </div>
    )
}
