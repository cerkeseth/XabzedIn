// XabzedIn Logo Component
// LinkedIn-style logo with Circassian flag green color

interface LogoProps {
    size?: 'sm' | 'md' | 'lg'
    showText?: boolean
    className?: string
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
    const sizes = {
        sm: { box: 24, text: 'text-lg' },
        md: { box: 32, text: 'text-xl' },
        lg: { box: 48, text: 'text-3xl' },
    }

    const { box, text } = sizes[size]

    // Çerkes bayrağı yeşili: #00A651 (resmi renk)
    const circassianGreen = '#00A651'

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* LinkedIn-style icon with "in" text */}
            <svg
                width={box}
                height={box}
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Rounded rectangle background */}
                <rect
                    width="32"
                    height="32"
                    rx="4"
                    fill={circassianGreen}
                />
                {/* "in" text */}
                <text
                    x="16"
                    y="23"
                    textAnchor="middle"
                    fill="white"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="16"
                    fontWeight="bold"
                >
                    in
                </text>
            </svg>

            {showText && (
                <span className={`${text} font-bold text-gray-900`}>
                    Xabzed<span style={{ color: circassianGreen }}>In</span>
                </span>
            )}
        </div>
    )
}

// Simple text logo for inline use
export function LogoText({ className = '' }: { className?: string }) {
    const circassianGreen = '#00A651'

    return (
        <span className={`font-bold ${className}`}>
            Xabzed<span style={{ color: circassianGreen }}>In</span>
        </span>
    )
}
