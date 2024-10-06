"use client"
export { SessionProvider as AuthProvider } from 'next-auth/react'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import React from 'react'

const SessionData = () => {
    const { status, data: session } = useSession()

    if (status === 'loading') {
        return <div>Loading...</div>
    }
    if (status === 'unauthenticated') {
        return <div>Unauthenticated: Render the login link</div>
    }
    if (!session) {
        return <div>No session</div>
    }
    return (
        <div>
            <div>SessionData: {session?.user?.name}</div>
            <div><Link href="/api/auth/signout">Signout</Link></div>
        </div>
    )
}

export default SessionData