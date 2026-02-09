'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Job, JobType } from '@/types/database'

interface JobFormProps {
    job?: Job | null
    companyId: string
    onSuccess?: () => void
}

export default function JobForm({ job, companyId, onSuccess }: JobFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: job?.title || '',
        description: job?.description || '',
        type: job?.type || 'onsite' as JobType,
        location: job?.location || '',
        contact_name: job?.contact_name || '',
        contact_phone: job?.contact_phone || '',
        contact_email: job?.contact_email || '',
        duration_days: '30', // Default 30 days
    })
    const supabase = createClient()
    const router = useRouter()

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const calculateExpiresAt = (days: string) => {
        const daysNum = parseInt(days) || 30
        const date = new Date()
        date.setDate(date.getDate() + daysNum)
        return date.toISOString()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (job) {
                // Update existing job
                const { error } = await supabase
                    .from('jobs')
                    .update({
                        title: formData.title,
                        description: formData.description,
                        type: formData.type,
                        location: formData.location,
                        contact_name: formData.contact_name || null,
                        contact_phone: formData.contact_phone || null,
                        contact_email: formData.contact_email || null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', job.id)

                if (error) {
                    toast.error('Güncelleme başarısız', { description: error.message })
                    return
                }

                toast.success('İş ilanı güncellendi!')
            } else {
                // Create new job
                const { error } = await supabase
                    .from('jobs')
                    .insert({
                        company_id: companyId,
                        title: formData.title,
                        description: formData.description,
                        type: formData.type,
                        location: formData.location,
                        contact_name: formData.contact_name || null,
                        contact_phone: formData.contact_phone || null,
                        contact_email: formData.contact_email || null,
                        expires_at: calculateExpiresAt(formData.duration_days),
                    })

                if (error) {
                    toast.error('Kayıt başarısız', { description: error.message })
                    return
                }

                toast.success('İş ilanı yayınlandı!')
            }

            if (onSuccess) {
                onSuccess()
            }
            router.refresh()
        } catch {
            toast.error('Bir hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{job ? 'İlanı Düzenle' : 'Yeni İş İlanı'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Pozisyon Adı *</Label>
                        <Input
                            id="title"
                            placeholder="Örn: Frontend Developer"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Çalışma Şekli</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => handleInputChange('type', value)}
                                disabled={isLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="onsite">Ofiste</SelectItem>
                                    <SelectItem value="remote">Uzaktan</SelectItem>
                                    <SelectItem value="hybrid">Hibrit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Konum</Label>
                            <Input
                                id="location"
                                placeholder="Örn: İstanbul, Türkiye"
                                value={formData.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {!job && (
                        <div className="space-y-2">
                            <Label htmlFor="duration_days">İlan Süresi</Label>
                            <Select
                                value={formData.duration_days}
                                onValueChange={(value) => handleInputChange('duration_days', value)}
                                disabled={isLoading}
                            >
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
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="description">İlan Açıklaması *</Label>
                        <Textarea
                            id="description"
                            placeholder="Pozisyon hakkında detaylı bilgi, aranan özellikler, sunulan imkanlar..."
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={8}
                            required
                            disabled={isLoading}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Contact Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>İrtibat Bilgileri</CardTitle>
                    <CardDescription>Adayların size ulaşabileceği bilgiler</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="contact_name">İlgili Kişi Ad Soyad</Label>
                        <Input
                            id="contact_name"
                            placeholder="Örn: Ahmet Yılmaz"
                            value={formData.contact_name}
                            onChange={(e) => handleInputChange('contact_name', e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contact_phone">Telefon</Label>
                            <Input
                                id="contact_phone"
                                type="tel"
                                placeholder="+90 5XX XXX XX XX"
                                value={formData.contact_phone}
                                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact_email">E-posta</Label>
                            <Input
                                id="contact_email"
                                type="email"
                                placeholder="ik@sirket.com"
                                value={formData.contact_email}
                                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button type="submit" size="lg" disabled={isLoading}>
                    {isLoading ? 'Kaydediliyor...' : job ? 'Güncelle' : 'İlanı Yayınla'}
                </Button>
            </div>
        </form>
    )
}
