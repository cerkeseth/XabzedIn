'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Profile, Experience, Education } from '@/types/database'

interface DigitalCVFormProps {
    profile: Profile
    experiences: Experience[]
    education: Education[]
}

export default function DigitalCVForm({ profile, experiences: initialExperiences, education: initialEducation }: DigitalCVFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        linkedin_url: profile.linkedin_url || '',
        community_reference: profile.community_reference || '',
        skills: profile.skills || [],
    })
    const [newSkill, setNewSkill] = useState('')
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
    const [experiences, setExperiences] = useState<Experience[]>(initialExperiences)
    const [education, setEducation] = useState<Education[]>(initialEducation)
    const [expDialogOpen, setExpDialogOpen] = useState(false)
    const [eduDialogOpen, setEduDialogOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    // New experience form state
    const [newExp, setNewExp] = useState({
        company_name: '',
        position: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: '',
    })

    // New education form state
    const [newEdu, setNewEdu] = useState({
        school_name: '',
        degree: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        description: '',
    })

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const addSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, newSkill.trim()]
            }))
            setNewSkill('')
        }
    }

    const removeSkill = (skillToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 1048576) {
            toast.error('Dosya çok büyük', { description: 'Maksimum dosya boyutu 1MB olmalıdır.' })
            return
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Geçersiz dosya türü', { description: 'Lütfen bir resim dosyası seçin.' })
            return
        }

        setIsLoading(true)
        const fileExt = file.name.split('.').pop()
        const fileName = `${profile.id}/avatar.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, file, { upsert: true })

        if (uploadError) {
            toast.error('Yükleme başarısız', { description: uploadError.message })
            setIsLoading(false)
            return
        }

        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(fileName)

        setAvatarUrl(publicUrl)
        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
        toast.success('Fotoğraf yüklendi!')
        setIsLoading(false)
    }

    // Add Experience
    const handleAddExperience = async () => {
        if (!newExp.company_name || !newExp.position) {
            toast.error('Şirket adı ve pozisyon zorunludur')
            return
        }

        setIsLoading(true)
        const { data, error } = await supabase
            .from('experiences')
            .insert({
                profile_id: profile.id,
                company_name: newExp.company_name,
                position: newExp.position,
                start_date: newExp.start_date || null,
                end_date: newExp.is_current ? null : newExp.end_date || null,
                is_current: newExp.is_current,
                description: newExp.description || null,
            })
            .select()
            .single()

        if (error) {
            toast.error('Deneyim eklenemedi', { description: error.message })
        } else {
            setExperiences([data, ...experiences])
            setNewExp({ company_name: '', position: '', start_date: '', end_date: '', is_current: false, description: '' })
            setExpDialogOpen(false)
            toast.success('Deneyim eklendi!')
        }
        setIsLoading(false)
    }

    // Delete Experience
    const handleDeleteExperience = async (id: string) => {
        const { error } = await supabase.from('experiences').delete().eq('id', id)
        if (error) {
            toast.error('Silinemedi', { description: error.message })
        } else {
            setExperiences(experiences.filter(e => e.id !== id))
            toast.success('Deneyim silindi')
        }
    }

    // Add Education
    const handleAddEducation = async () => {
        if (!newEdu.school_name) {
            toast.error('Okul adı zorunludur')
            return
        }

        setIsLoading(true)
        const { data, error } = await supabase
            .from('education')
            .insert({
                profile_id: profile.id,
                school_name: newEdu.school_name,
                degree: newEdu.degree || null,
                field_of_study: newEdu.field_of_study || null,
                start_date: newEdu.start_date || null,
                end_date: newEdu.end_date || null,
                description: newEdu.description || null,
            })
            .select()
            .single()

        if (error) {
            toast.error('Eğitim eklenemedi', { description: error.message })
        } else {
            setEducation([data, ...education])
            setNewEdu({ school_name: '', degree: '', field_of_study: '', start_date: '', end_date: '', description: '' })
            setEduDialogOpen(false)
            toast.success('Eğitim eklendi!')
        }
        setIsLoading(false)
    }

    // Delete Education
    const handleDeleteEducation = async (id: string) => {
        const { error } = await supabase.from('education').delete().eq('id', id)
        if (error) {
            toast.error('Silinemedi', { description: error.message })
        } else {
            setEducation(education.filter(e => e.id !== id))
            toast.success('Eğitim silindi')
        }
    }

    // Save Profile
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    bio: formData.bio,
                    phone: formData.phone,
                    linkedin_url: formData.linkedin_url,
                    community_reference: formData.community_reference,
                    skills: formData.skills,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profile.id)

            if (error) {
                toast.error('Kayıt başarısız', { description: error.message })
                return
            }

            toast.success('Profil güncellendi!')
        } catch {
            toast.error('Bir hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo */}
            <Card>
                <CardHeader>
                    <CardTitle>Profil Fotoğrafı</CardTitle>
                    <CardDescription>Kare (1:1) formatta, maksimum 1MB</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-6">
                    <Avatar className="w-24 h-24">
                        <AvatarImage src={avatarUrl} alt={formData.full_name} />
                        <AvatarFallback className="text-2xl">{formData.full_name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                            Fotoğraf Yükle
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Basic Info */}
            <Card>
                <CardHeader><CardTitle>Kişisel Bilgiler</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Ad Soyad *</Label>
                            <Input id="full_name" value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)} required disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon</Label>
                            <Input id="phone" type="tel" placeholder="+90 5XX XXX XX XX" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} disabled={isLoading} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="linkedin_url">LinkedIn Profili</Label>
                        <Input id="linkedin_url" type="url" placeholder="https://linkedin.com/in/kullaniciadi" value={formData.linkedin_url} onChange={(e) => handleInputChange('linkedin_url', e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio">Hakkımda</Label>
                        <Textarea id="bio" placeholder="Kendinizi kısaca tanıtın..." value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} rows={3} disabled={isLoading} />
                    </div>
                </CardContent>
            </Card>

            {/* Community Reference */}
            <Card>
                <CardHeader>
                    <CardTitle>Topluluk Referansı</CardTitle>
                    <CardDescription>Çerkes topluluğundaki bağlantınız veya referansınız</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea id="community_reference" placeholder="Örn: Kayseri Çerkes Derneği üyesiyim..." value={formData.community_reference} onChange={(e) => handleInputChange('community_reference', e.target.value)} rows={2} disabled={isLoading} />
                </CardContent>
            </Card>

            {/* Skills */}
            <Card>
                <CardHeader><CardTitle>Yetenekler</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input placeholder="Yetenek ekle..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} disabled={isLoading} />
                        <Button type="button" onClick={addSkill} disabled={isLoading}>Ekle</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="cursor-pointer hover:bg-red-100" onClick={() => removeSkill(skill)}>
                                {skill} ✕
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* EXPERIENCE SECTION */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>İş Deneyimi</CardTitle>
                        <CardDescription>Geçmiş iş deneyimlerinizi ekleyin</CardDescription>
                    </div>
                    <Dialog open={expDialogOpen} onOpenChange={setExpDialogOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline">+ Deneyim Ekle</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Yeni Deneyim Ekle</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Şirket Adı *</Label>
                                    <Input value={newExp.company_name} onChange={(e) => setNewExp({ ...newExp, company_name: e.target.value })} placeholder="Örn: ABC Teknoloji" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Pozisyon *</Label>
                                    <Input value={newExp.position} onChange={(e) => setNewExp({ ...newExp, position: e.target.value })} placeholder="Örn: Frontend Developer" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Başlangıç</Label>
                                        <Input type="month" value={newExp.start_date} onChange={(e) => setNewExp({ ...newExp, start_date: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bitiş</Label>
                                        <Input type="month" value={newExp.end_date} onChange={(e) => setNewExp({ ...newExp, end_date: e.target.value })} disabled={newExp.is_current} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="is_current" checked={newExp.is_current} onChange={(e) => setNewExp({ ...newExp, is_current: e.target.checked })} />
                                    <Label htmlFor="is_current">Hala burada çalışıyorum</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label>Açıklama</Label>
                                    <Textarea value={newExp.description} onChange={(e) => setNewExp({ ...newExp, description: e.target.value })} placeholder="Görevleriniz ve başarılarınız..." rows={3} />
                                </div>
                                <Button type="button" className="w-full" onClick={handleAddExperience} disabled={isLoading}>
                                    {isLoading ? 'Ekleniyor...' : 'Ekle'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {experiences.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Henüz deneyim eklenmedi</p>
                    ) : (
                        <div className="space-y-4">
                            {experiences.map((exp) => (
                                <div key={exp.id} className="border rounded-lg p-4 relative">
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteExperience(exp.id)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                    >
                                        ✕
                                    </button>
                                    <h4 className="font-semibold">{exp.position}</h4>
                                    <p className="text-gray-600">{exp.company_name}</p>
                                    <p className="text-sm text-gray-500">
                                        {exp.start_date || '?'} - {exp.is_current ? 'Devam ediyor' : exp.end_date || '?'}
                                    </p>
                                    {exp.description && <p className="text-sm text-gray-600 mt-2">{exp.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* EDUCATION SECTION */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Eğitim</CardTitle>
                        <CardDescription>Eğitim geçmişinizi ekleyin</CardDescription>
                    </div>
                    <Dialog open={eduDialogOpen} onOpenChange={setEduDialogOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline">+ Eğitim Ekle</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Yeni Eğitim Ekle</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Okul Adı *</Label>
                                    <Input value={newEdu.school_name} onChange={(e) => setNewEdu({ ...newEdu, school_name: e.target.value })} placeholder="Örn: İstanbul Teknik Üniversitesi" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Derece</Label>
                                        <Input value={newEdu.degree} onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })} placeholder="Örn: Lisans" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bölüm</Label>
                                        <Input value={newEdu.field_of_study} onChange={(e) => setNewEdu({ ...newEdu, field_of_study: e.target.value })} placeholder="Örn: Bilgisayar Mühendisliği" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Başlangıç</Label>
                                        <Input type="month" value={newEdu.start_date} onChange={(e) => setNewEdu({ ...newEdu, start_date: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bitiş</Label>
                                        <Input type="month" value={newEdu.end_date} onChange={(e) => setNewEdu({ ...newEdu, end_date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Açıklama</Label>
                                    <Textarea value={newEdu.description} onChange={(e) => setNewEdu({ ...newEdu, description: e.target.value })} placeholder="Ek bilgiler..." rows={2} />
                                </div>
                                <Button type="button" className="w-full" onClick={handleAddEducation} disabled={isLoading}>
                                    {isLoading ? 'Ekleniyor...' : 'Ekle'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {education.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Henüz eğitim eklenmedi</p>
                    ) : (
                        <div className="space-y-4">
                            {education.map((edu) => (
                                <div key={edu.id} className="border rounded-lg p-4 relative">
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteEducation(edu.id)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                    >
                                        ✕
                                    </button>
                                    <h4 className="font-semibold">{edu.school_name}</h4>
                                    <p className="text-gray-600">{edu.degree} {edu.field_of_study && `- ${edu.field_of_study}`}</p>
                                    <p className="text-sm text-gray-500">
                                        {edu.start_date || '?'} - {edu.end_date || '?'}
                                    </p>
                                    {edu.description && <p className="text-sm text-gray-600 mt-2">{edu.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Separator />

            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isLoading}>
                    {isLoading ? 'Kaydediliyor...' : 'Profili Kaydet'}
                </Button>
            </div>
        </form>
    )
}
