'use client'

import { Menu } from 'lucide-react'
import { useMobileMenu } from './MobileMenuContext'

export default function MobileMenuButton() {
  const { isOpen, toggle } = useMobileMenu()

  return (
    <button
      onClick={toggle}
      className="lg:hidden w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
      aria-label="Buka menu navigasi"
      aria-expanded={isOpen}
    >
      <Menu size={22} />
    </button>
  )
}
