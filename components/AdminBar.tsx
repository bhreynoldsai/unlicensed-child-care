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
    <div className="mb-s6 flex flex-wrap items-center justify-between gap-3 border-b border-ink/[.16] pb-s3 text-sm">
      <span className="text-ink/[.78]">
        {email ? (
          <>
            Signed in as <strong className="font-semibold text-ink">{email}</strong>
          </>
        ) : (
          'Signed in'
        )}
      </span>
      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="rounded-full border-[1.5px] border-ink/[.16] px-3.5 py-1.5 transition hover:border-ink/[.45] disabled:opacity-50"
      >
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  )
}
