'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/** Who is signed in, and a way out. */
export function AdminBar({ email }: { email: string | null }) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function signOut() {
    setSigningOut(true)
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {})
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-navy-100 pb-s3 text-sm">
      <span className="text-navy-500">
        {email ? (
          <>
            Signed in as <strong className="font-semibold text-navy-900">{email}</strong>
          </>
        ) : (
          'Signed in'
        )}
      </span>
      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="rounded-full border-[1.5px] border-navy-100 px-3.5 py-1.5 transition hover:border-navy-500 disabled:opacity-50"
      >
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  )
}
