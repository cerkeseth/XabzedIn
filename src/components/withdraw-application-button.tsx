'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function WithdrawApplicationButton({ applicationId }: { applicationId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleWithdraw = async () => {
        if (!isConfirming) {
            setIsConfirming(true)
            return
        }

        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('applications')
                .delete()
                .eq('id', applicationId)

            if (error) {
                toast.error('İşlem başarısız', { description: error.message })
                return
            }

            toast.success('Başvurunuz geri çekildi')
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
            onClick={handleWithdraw}
            disabled={isLoading}
        >
            {isLoading ? 'İşleniyor...' : isConfirming ? 'Emin misiniz?' : 'Başvuruyu Geri Çek'}
        </Button>
    )
}
