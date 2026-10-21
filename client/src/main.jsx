
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/react'
import { dark } from '@clerk/themes'
import { AppProvider } from './context/AppContext.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if(!PUBLISHABLE_KEY){
  throw new Error("missing publisable key")
}

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#f84565',
    colorBackground: '#11131a',
    colorInputBackground: '#09090b',
    colorInputText: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: '#9ca3af',
    colorTextOnPrimaryBackground: '#ffffff',
    fontFamily: '"Outfit", sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    card: 'border border-gray-800 bg-[#11131a]/95 backdrop-blur-xl shadow-2xl shadow-black/80',
    headerTitle: 'text-white font-bold text-xl',
    headerSubtitle: 'text-gray-400 text-xs',
    socialButtonsBlockButton: 'border border-gray-800 bg-gray-900/60 hover:bg-white/5 text-gray-200 transition-colors',
    socialButtonsBlockButtonText: 'text-gray-200 font-medium text-xs',
    dividerLine: 'bg-gray-800',
    dividerText: 'text-gray-500 text-xs font-mono',
    formFieldLabel: 'text-gray-300 text-xs font-medium',
    formFieldInput: 'bg-gray-950/90 border border-gray-800 text-white rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm',
    formButtonPrimary: 'bg-primary hover:bg-primary-dull text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all cursor-pointer text-xs uppercase tracking-wider py-3',
    footerActionLink: 'text-primary hover:text-primary-dull font-medium',
    footerActionText: 'text-gray-400 text-xs',
    formFieldSuccessText: 'text-emerald-400 text-xs',
    formFieldErrorText: 'text-red-400 text-xs',
    identityPreviewText: 'text-white',
    identityPreviewEditButton: 'text-primary hover:text-primary-dull',
  }
}

createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={clerkAppearance}>
     <BrowserRouter>
     <AppProvider>
        <App />
     </AppProvider>
  </BrowserRouter>
  </ClerkProvider>
)
