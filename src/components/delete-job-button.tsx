'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function DeleteJobButton({ jobId }: { jobId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleDelete = async () => {
        if (!isConfirming) {
            setIsConfirming(true)
            return
        }

        setIsLoading(true)
        try {
            // First delete applications for this job
            await supabase
                .from('applications')
                .delete()
                .eq('job_id', jobId)

            // Then delete the job
            const { error } = await supabase
                .from('jobs')
                .delete()
                .eq('id', jobId)

            if (error) {
                toast.error('Silme başarısız', { description: error.message })
                return
            }

            toast.success('İlan silindi')
            router.refresh()
        } catch {
            toast.error('Bir hata oluştu')
        } finally {
            setIsLoading(false)
            setIsConfirming(false)
        }
    }

    return (
        <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
        >
            {isLoading ? 'Siliniyor...' : isConfirming ? 'Emin misiniz?' : 'Sil'}
        </Button>
    )
}
