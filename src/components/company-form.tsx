'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Company } from '@/types/database'

interface CompanyFormProps {
    company?: Company | null
    userId: string
}

export default function CompanyForm({ company, userId }: CompanyFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: company?.name || '',
        sector: company?.sector || '',
        location: company?.location || '',
        website: company?.website || '',
        description: company?.description || '',
    })
    const [logoUrl, setLogoUrl] = useState(company?.logo_url || '')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()
    const router = useRouter()

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file size (max 1MB)
        if (file.size > 1048576) {
            toast.error('Dosya çok büyük', {
                description: 'Maksimum dosya boyutu 1MB olmalıdır.',
            })
            return
        }

        // Check if image
        if (!file.type.startsWith('image/')) {
            toast.error('Geçersiz dosya türü', {
                description: 'Lütfen bir resim dosyası seçin.',
            })
            return
        }

        setIsLoading(true)

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/company-logo.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, file, { upsert: true })

        if (uploadError) {
            toast.error('Yükleme başarısız', {
                description: uploadError.message,
            })
            setIsLoading(false)
            return
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(fileName)

        setLogoUrl(publicUrl)
        toast.success('Logo yüklendi!')
        setIsLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (company) {
                // Update existing company
                const { error } = await supabase
                    .from('companies')
                    .update({
                        name: formData.name,
                        sector: formData.sector,
                        location: formData.location,
                        website: formData.website,
                        description: formData.description,
                        logo_url: logoUrl,
                    })
                    .eq('id', company.id)

                if (error) {
                    toast.error('Güncelleme başarısız', { description: error.message })
                    return
                }

                toast.success('Şirket bilgileri güncellendi!')
            } else {
                // Create new company
                const { error } = await supabase
                    .from('companies')
                    .insert({
                        owner_id: userId,
                        name: formData.name,
                        sector: formData.sector,
                        location: formData.location,
                        website: formData.website,
                        description: formData.description,
                        logo_url: logoUrl,
                    })

                if (error) {
                    toast.error('Kayıt başarısız', { description: error.message })
                    return
                }

                toast.success('Şirket oluşturuldu!')
                router.refresh()
            }
        } catch {
            toast.error('Bir hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Logo */}
            <Card>
                <CardHeader>
                    <CardTitle>Şirket Logosu</CardTitle>
                    <CardDescription>Kare formatta, maksimum 1MB</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-6">
                    <Avatar className="w-24 h-24 rounded-lg">
                        <AvatarImage src={logoUrl} alt={formData.name} />
                        <AvatarFallback className="text-2xl rounded-lg">
                            {formData.name?.charAt(0) || '?'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                        >
                            Logo Yükle
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Şirket Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Şirket Adı *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sector">Sektör</Label>
                            <Input
                                id="sector"
                                placeholder="Örn: Teknoloji, Finans, Sağlık"
                                value={formData.sector}
                                onChange={(e) => handleInputChange('sector', e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
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
                        <div className="space-y-2">
                            <Label htmlFor="website">Web Sitesi</Label>
                            <Input
                                id="website"
                                type="url"
                                placeholder="https://sirket.com"
                                value={formData.website}
                                onChange={(e) => handleInputChange('website', e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Şirket Hakkında</Label>
                        <Textarea
                            id="description"
                            placeholder="Şirketinizi kısaca tanıtın..."
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={4}
                            disabled={isLoading}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isLoading}>
                    {isLoading ? 'Kaydediliyor...' : company ? 'Güncelle' : 'Şirket Oluştur'}
                </Button>
            </div>
        </form>
    )
}
