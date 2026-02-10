# XabzedIn

Diasporada yaşayan insanlarımızın birbirini bulmasını, tanışmasını ve iş hayatında birbirine destek olmasını kolaylaştırmak amacıyla gönüllü olarak geliştirilen açık kaynaklı bir platformdur. Herhangi bir ticari amacı yoktur.

**Canlı:** [xabzedin.com](https://xabzedin.com)

## Teknolojiler

- **Frontend:** Next.js 16 (App Router, Turbopack)
- **Backend:** Supabase (Auth, PostgreSQL, Storage, RPC)
- **UI:** shadcn/ui, Tailwind CSS
- **Deploy:** Vercel

## Kurulum

### 1. Projeyi klonlayın

```bash
git clone https://github.com/cerkeseth/XabzedIn.git
cd XabzedIn
npm install
```

### 2. Supabase projesini oluşturun

1. [supabase.com](https://supabase.com) üzerinde yeni bir proje oluşturun
2. SQL Editor'ı açın
3. `supabase/schema.sql` dosyasının tamamını kopyalayıp çalıştırın

Bu tek dosya tüm tabloları, fonksiyonları, RLS politikalarını ve başlangıç referans kodlarını oluşturacaktır.

### 3. Ortam değişkenlerini ayarlayın

`.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Bu değerleri Supabase Dashboard > Settings > API bölümünden alabilirsiniz.

### 4. Geliştirme sunucusunu başlatın

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresinden erişebilirsiniz.

## Veritabanı Yapısı

| Tablo | Açıklama |
|-------|----------|
| `profiles` | Kullanıcı profilleri (auth.users ile bağlantılı) |
| `experiences` | İş deneyimleri |
| `education` | Eğitim bilgileri |
| `companies` | Şirket bilgileri |
| `jobs` | İş ilanları (süre, konum, çalışma şekli) |
| `applications` | İş başvuruları |
| `referral_codes` | Referans kodları (davetiye sistemi) |

## Referans Sistemi

Platform davet ile çalışır. Yeni kullanıcılar mevcut bir kullanıcının oluşturduğu referans kodu ile kayıt olur. Her kullanıcının belirli bir hakkı vardır; hak bittiğinde admin tarafından yenisi verilebilir.

**Admin fonksiyonları** (Supabase SQL Editor'dan çalıştırılır):
```sql
-- Tek kullanıcıya hak ver
SELECT grant_referral_right('kullanici-uuid', 1);

-- Tüm kullanıcılara hak ver
SELECT grant_referral_right_to_all(1);

-- Mevcut kullanılmamış kodları listele
SELECT code FROM referral_codes WHERE is_used = false;
```

## Katkıda Bulunma

Proje gönüllü olarak geliştirilmektedir. Katkıda bulunmak isterseniz:

1. Fork edin
2. Branch oluşturun (`git checkout -b ozellik/yeni-ozellik`)
3. Değişikliklerinizi commit edin
4. Pull Request açın

Hatalar ve öneriler için: **iletisim@xabzedin.com**

## Lisans

Bu proje topluluk yararına açık kaynak olarak geliştirilmektedir.

Yapımcı: **Mertcan DAR**
