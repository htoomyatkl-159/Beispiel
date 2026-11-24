import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './premium.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from './lib/queryClient'
import { routes } from './router'
import './i18n'
import { AuthProvider } from './auth/AuthProvider'
import '@fontsource-variable/inter'

const queryClient = createQueryClient()
const router = createBrowserRouter(routes)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider><RouterProvider router={router} /></AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
