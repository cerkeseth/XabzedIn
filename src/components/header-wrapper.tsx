import { createClient } from '@/lib/supabase/server'
import Header from '@/components/header'

export default async function HeaderWrapper() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    let role: 'employer' | 'seeker' | null = null

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        role = profile?.role || null
    }

    return <Header user={user} role={role} />
}
