'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Most admin load errors are a passing database hiccup that clears within
 * seconds. So an error screen first retries once by itself, quietly, and
 * only shows the "Try again" button if that fails too. The count lives at
 * module level (it outlives the error screen between tries) and resets
 * after a minute, so it can never loop.
 */
let autoTries = 0
let lastTry = 0
const AUTO_TRIES = 1
const WAIT_MS = 1500

const canAuto = () => autoTries < AUTO_TRIES || Date.now() - lastTry > 60_000

export function useAutoRetry(error: unknown, retry: () => void) {
  const retryRef = useRef(retry)
  useEffect(() => {
    retryRef.current = retry
  })

  // The error this screen is quietly retrying, if any. Any later error on
  // the same screen (the quiet try failed) shows the button instead.
  const [autoFor] = useState<unknown>(() => (canAuto() ? error : null))

  useEffect(() => {
    if (autoFor !== error) return
    if (Date.now() - lastTry > 60_000) autoTries = 0
    autoTries++
    lastTry = Date.now()
    const t = setTimeout(() => retryRef.current(), WAIT_MS)
    return () => clearTimeout(t)
  }, [error, autoFor])

  return autoFor === error
}
