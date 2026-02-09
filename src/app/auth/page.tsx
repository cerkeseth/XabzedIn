'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/logo'

// Eye Icons
const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
)

const EyeOffIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
)

export default function AuthPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [referralCode, setReferralCode] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showResetForm, setShowResetForm] = useState(false)
    const [resetEmail, setResetEmail] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                toast.error('Giriş başarısız', {
                    description: error.message === 'Invalid login credentials'
                        ? 'E-posta veya şifre hatalı.'
                        : error.message,
                })
                return
            }

            toast.success('Giriş başarılı!')
            router.push('/dashboard')
            router.refresh()
        } catch {
            toast.error('Bir hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // 1. Check if referral code is valid
            const { data: codeData, error: codeError } = await supabase
                .from('referral_codes')
                .select('id, code, is_used')
                .eq('code', referralCode.toUpperCase())
                .eq('is_used', false)
                .single()

            if (codeError || !codeData) {
                toast.error('Geçersiz referans kodu', {
                    description: 'Girdiğiniz referans kodu geçersiz veya daha önce kullanılmış.',
                })
                setIsLoading(false)
                return
            }

            // 2. Create user account
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        referral_code: referralCode.toUpperCase(),
                    },
                },
            })

            if (authError) {
                toast.error('Kayıt başarısız', {
                    description: authError.message,
                })
                return
            }

            // 3. If user was created, mark the referral code as used
            if (authData.user) {
                await supabase.rpc('use_referral_code', {
                    p_code: referralCode.toUpperCase(),
                    p_user_id: authData.user.id,
                })
            }

            toast.success('Kayıt başarılı!', {
                description: 'Lütfen e-posta adresinizi doğrulayın.',
            })
        } catch {
            toast.error('Bir hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            })

            if (error) {
                toast.error('Şifre sıfırlama başarısız', {
                    description: error.message,
                })
                return
            }

            toast.success('Şifre sıfırlama e-postası gönderildi!', {
                description: 'Lütfen e-posta kutunuzu kontrol edin.',
            })
            setShowResetForm(false)
            setResetEmail('')
        } catch {
            toast.error('Bir hata oluştu')
        } finally {
            setIsLoading(false)
        }
    }

    // Password Reset Form
    if (showResetForm) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">Şifre Sıfırlama</CardTitle>
                        <CardDescription>
                            E-posta adresinize şifre sıfırlama linki göndereceğiz.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reset-email">E-posta</Label>
                                <Input
                                    id="reset-email"
                                    type="email"
                                    placeholder="ornek@email.com"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full"
                                onClick={() => setShowResetForm(false)}
                            >
                                ← Giriş sayfasına dön
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <Link href="/">
                        <Logo size="md" />
                    </Link>
                    <CardDescription>
                        Çerkes toplumu için kariyer platformu
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Giriş Yap</TabsTrigger>
                            <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email">E-posta</Label>
                                    <Input
                                        id="login-email"
                                        type="email"
                                        placeholder="ornek@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password">Şifre</Label>
                                    <div className="relative">
                                        <Input
                                            id="login-password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            minLength={6}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                                        onClick={() => setShowResetForm(true)}
                                    >
                                        Şifremi unuttum
                                    </button>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="register">
                            <form onSubmit={handleRegister} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="register-referral">Referans Kodu *</Label>
                                    <Input
                                        id="register-referral"
                                        type="text"
                                        placeholder="Örn: AB12CD34"
                                        value={referralCode}
                                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                        required
                                        disabled={isLoading}
                                        maxLength={8}
                                        className="uppercase font-mono tracking-wider"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Kayıt olmak için geçerli bir referans kodu gereklidir.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-name">Ad Soyad</Label>
                                    <Input
                                        id="register-name"
                                        type="text"
                                        placeholder="Adınız Soyadınız"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-email">E-posta</Label>
                                    <Input
                                        id="register-email"
                                        type="email"
                                        placeholder="ornek@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-password">Şifre</Label>
                                    <div className="relative">
                                        <Input
                                            id="register-password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="En az 6 karakter"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            minLength={6}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
