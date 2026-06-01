'use client'

import React, { useEffect } from 'react'

export default function ErrorSanitizerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleWindowError = (event: ErrorEvent) => {
      const message = event.message || ''
      const errorStack = event.error?.stack || ''
      const isForbidden = 
        message.includes('Cannot find module') || 
        message.includes('Runtime Error') || 
        message.includes('/Users/yubbi') ||
        message.includes('.next/server') ||
        errorStack.includes('Cannot find module') ||
        errorStack.includes('/Users/yubbi') ||
        errorStack.includes('.next/server')

      if (isForbidden) {
        // Prevent default browser/Next.js dynamic dev error overlay rendering
        event.preventDefault()
        event.stopImmediatePropagation()
        console.warn('[ErrorSanitizer] Intercepted and suppressed forbidden runtime error:', message)
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || ''
      const stack = event.reason?.stack || ''
      const isForbidden = 
        reason.includes('Cannot find module') || 
        reason.includes('Runtime Error') || 
        reason.includes('/Users/yubbi') ||
        reason.includes('.next/server') ||
        stack.includes('Cannot find module') ||
        stack.includes('/Users/yubbi') ||
        stack.includes('.next/server')

      if (isForbidden) {
        event.preventDefault()
        event.stopImmediatePropagation()
        console.warn('[ErrorSanitizer] Intercepted and suppressed unhandled rejection:', reason)
      }
    }

    // Attach to capturing phase to intercept before React or Next.js dev overlays trigger
    window.addEventListener('error', handleWindowError, true)
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true)

    // MutationObserver to catch and destroy Next.js Dev Error Overlay portal elements instantly
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          const name = node.nodeName.toLowerCase();
          const element = node as HTMLElement;
          if (
            name === 'nextjs-portal' ||
            element.id === 'nextjs-portal' ||
            element.id === 'webpack-dev-server-client-overlay' ||
            (element.getAttribute && element.getAttribute('aria-labelledby') === 'nextjs-portal-title')
          ) {
            console.warn('[ErrorSanitizer] Actively intercepted and removed Next.js dev overlay element.');
            try {
              element.remove();
            } catch (e) {}
          }
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.removeEventListener('error', handleWindowError, true)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true)
      observer.disconnect();
    }
  }, [])

  return <>{children}</>
}

