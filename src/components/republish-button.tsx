'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface RepublishButtonProps {
    jobId: string
}

export default function RepublishButton({ jobId }: RepublishButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [duration, setDuration] = useState('30')
    const supabase = createClient()
    const router = useRouter()

    const handleRepublish = async () => {
        setIsLoading(true)

        try {
            const daysNum = parseInt(duration) || 30
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + daysNum)

            const { error } = await supabase
                .from('jobs')
                .update({
                    is_active: true,
                    is_archived: false,
                    expires_at: expiresAt.toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', jobId)

            if (error) {
                toast.error('Yayınlama başarısız', { description: error.message })
                return
            }

            toast.success('İlan tekrar yayınlandı!')
            setIsOpen(false)
            router.refresh()
        } catch {
            toast.error('Bir hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm">
                    Tekrar Yayınla
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>İlanı Tekrar Yayınla</DialogTitle>
                    <DialogDescription>
                        Bu ilan tekrar aktif olacak ve iş arayanlar görebilecek.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>İlan Süresi</Label>
                        <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">7 Gün</SelectItem>
                                <SelectItem value="14">14 Gün</SelectItem>
                                <SelectItem value="30">30 Gün</SelectItem>
                                <SelectItem value="60">60 Gün</SelectItem>
                                <SelectItem value="90">90 Gün</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                            İptal
                        </Button>
                        <Button onClick={handleRepublish} disabled={isLoading}>
                            {isLoading ? 'Yayınlanıyor...' : 'Yayınla'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
