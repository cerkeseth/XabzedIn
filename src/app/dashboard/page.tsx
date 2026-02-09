import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RoleSelection from '@/components/role-selection'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth')
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // If no role selected, show role selection
    if (!profile?.role) {
        return <RoleSelection userId={user.id} />
    }

    // Redirect based on role
    if (profile.role === 'employer') {
        redirect('/dashboard/employer')
    } else {
        redirect('/dashboard/seeker')
    }
}
