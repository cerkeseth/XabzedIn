// Database types for XabzedIn

export type UserRole = 'seeker' | 'employer'

export type JobType = 'remote' | 'onsite' | 'hybrid'

export type ApplicationStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected'

export interface Profile {
    id: string
    email: string
    full_name: string | null
    role: UserRole | null
    avatar_url: string | null
    bio: string | null
    linkedin_url: string | null
    phone: string | null
    community_reference: string | null
    skills: string[] | null
    experience_summary: string | null
    education_summary: string | null
    created_at: string
    updated_at: string
}

export interface Company {
    id: string
    owner_id: string
    name: string
    logo_url: string | null
    sector: string | null
    location: string | null
    website: string | null
    description: string | null
    created_at: string
}

export interface Job {
    id: string
    company_id: string
    title: string
    description: string
    type: JobType | null
    location: string | null
    salary_range: string | null
    // Contact info
    contact_name: string | null
    contact_phone: string | null
    contact_email: string | null
    // Expiration
    expires_at: string | null
    is_active: boolean
    is_archived: boolean
    created_at: string
    updated_at: string
    // Joined data
    company?: Company
}

export interface Application {
    id: string
    job_id: string
    seeker_id: string
    status: ApplicationStatus
    cover_letter: string | null
    created_at: string
    // Joined data
    job?: Job
    seeker?: Profile
}

export interface Experience {
    id: string
    profile_id: string
    company_name: string
    position: string
    start_date: string | null
    end_date: string | null
    is_current: boolean
    description: string | null
    created_at: string
}

export interface Education {
    id: string
    profile_id: string
    school_name: string
    degree: string | null
    field_of_study: string | null
    start_date: string | null
    end_date: string | null
    description: string | null
    created_at: string
}

// Form types for creating/updating
export type ProfileFormData = Omit<Profile, 'id' | 'email' | 'created_at' | 'updated_at'>

export type CompanyFormData = Omit<Company, 'id' | 'owner_id' | 'created_at'>

export type JobFormData = Omit<Job, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'company'>

export type ApplicationFormData = {
    job_id: string
    cover_letter?: string
}

export type ExperienceFormData = Omit<Experience, 'id' | 'profile_id' | 'created_at'>

export type EducationFormData = Omit<Education, 'id' | 'profile_id' | 'created_at'>
