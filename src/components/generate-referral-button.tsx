'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function GenerateReferralButton({ hasRights }: { hasRights: boolean }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleGenerate = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase.rpc('generate_my_referral_code')

            if (error) {
                toast.error('Hata', { description: error.message })
                return
            }

            const result = data as { success: boolean; code?: string; error?: string }

            if (result.success) {
                toast.success('Referans kodunuz oluşturuldu!', {
                    description: `Kodunuz: ${result.code}`,
                })
                router.refresh()
            } else {
                toast.error('İşlem başarısız', {
                    description: result.error,
                })
            }
        } catch {
            toast.error('Bir hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    if (!hasRights) {
        return (
            <p className="text-sm text-gray-500">
                Referans kodu oluşturma hakkınız bulunmuyor.
            </p>
        )
    }

    return (
        <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-[#00A651] hover:bg-[#008c44] text-white"
        >
            {isLoading ? 'Oluşturuluyor...' : 'Referans Kodu Oluştur'}
        </Button>
    )
}
