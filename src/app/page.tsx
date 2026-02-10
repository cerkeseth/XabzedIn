import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HeaderWrapper from '@/components/header-wrapper'
import Footer from '@/components/footer'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <HeaderWrapper />

      {/* Hero */}
      <section className="py-16 sm:py-24 px-4 flex-1">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Diasporada Dayanışma,
            <br />
            <span className="text-[#00A651]">İş Hayatında Güç</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
            XabzedIn, gönüllüler tarafından geliştirilen ve kâr amacı gütmeyen bir platformdur.
            Amacımız diasporada yaşayan insanlarımızın birbirini bulmasını, tanışmasını ve
            iş hayatında birbirine destek olmasını kolaylaştırmaktır.
          </p>
          <p className="text-sm sm:text-base text-gray-500 mb-8 max-w-xl mx-auto">
            Referans sistemi ile güvene dayalı bir ağ oluşturuyoruz.
            Tanıdığınız birinin daveti ile katılabilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
            <Link href="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 bg-[#00A651] hover:bg-[#008c44]">
                Katıl
              </Button>
            </Link>
            <Link href="/jobs" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                İlanları Gör
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Nasıl Çalışır */}
      <section className="py-12 sm:py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-10">
            Nasıl Çalışır?
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-[#00A651]/10 rounded-full flex items-center justify-center text-[#00A651] font-bold text-xl">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Davet Al</h3>
              <p className="text-sm text-gray-600">
                Platformdaki bir tanıdığınızdan referans kodu alarak kayıt olun.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-[#00A651]/10 rounded-full flex items-center justify-center text-[#00A651] font-bold text-xl">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Profilini Oluştur</h3>
              <p className="text-sm text-gray-600">
                Deneyimlerinizi, becerilerinizi ve eğitim bilgilerinizi ekleyin.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-[#00A651]/10 rounded-full flex items-center justify-center text-[#00A651] font-bold text-xl">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Bağlan</h3>
              <p className="text-sm text-gray-600">
                İş ilanlarına başvurun veya işveren olarak doğru adayları bulun.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Açıklama */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-gray-500 leading-relaxed">
            XabzedIn açık kaynaklı ve gönüllü bir projedir.
            Herhangi bir ticari amacı yoktur. Topluluk bilincini güçlendirmek
            ve karşılıklı yardımlaşmayı desteklemek için geliştirilmektedir.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
