'use server'

import { redirect } from 'next/navigation'

export async function signInWithGoogle() {
  redirect('/api/auth/signin/google?callbackUrl=/dashboard')
}

export async function signInWithGitHub() {
  redirect('/api/auth/signin/github?callbackUrl=/dashboard')
}
