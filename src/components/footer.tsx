import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-white py-6 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <span>Gönüllü olarak geliştirildi —</span>
                        <a
                            href="https://github.com/cerkeseth/XabzedIn"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-700 hover:text-[#00A651] transition-colors font-medium"
                        >
                            Açık Kaynak
                        </a>
                    </div>
                    <div className="flex items-center gap-3">
                        <span>
                            Yapımcı: <span className="font-medium text-gray-700">Mertcan DAR</span>
                        </span>
                        <span className="text-gray-300">·</span>
                        <a
                            href="https://monakh.co"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Monakh Outdoor
                        </a>
                    </div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">
                    Karşılaştığınız hatalar, görüş ve önerileriniz için{' '}
                    <a href="mailto:iletisim@xabzedin.com" className="text-gray-500 hover:text-[#00A651] transition-colors">
                        iletisim@xabzedin.com
                    </a>
                    {' '}adresine yazabilirsiniz.
                </p>
            </div>
        </footer>
    )
}
