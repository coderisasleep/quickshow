
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
    colorInputBackground: '#090b10',
    colorInputText: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: '#ffffff',
    colorTextOnPrimaryBackground: '#ffffff',
    fontFamily: '"Outfit", sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    card: 'border border-gray-700/80 bg-[#11131a] shadow-2xl shadow-black/90 text-white',
    headerTitle: 'text-white font-bold text-2xl tracking-tight',
    headerSubtitle: 'text-white/90 text-sm font-medium mt-1',
    socialButtonsBlockButton: 'border border-gray-700 bg-gray-900/80 hover:bg-white/10 text-white transition-colors py-2.5',
    socialButtonsBlockButtonText: 'text-white font-semibold text-sm',
    dividerLine: 'bg-gray-700',
    dividerText: 'text-white font-bold text-xs font-mono uppercase tracking-wider',
    formFieldLabel: 'text-white font-bold text-sm mb-1.5',
    formFieldInput: 'bg-gray-950 border border-gray-700 text-white font-medium placeholder-gray-400 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm py-2.5 px-3.5',
    formButtonPrimary: 'bg-primary hover:bg-primary-dull text-white font-extrabold rounded-xl shadow-lg shadow-primary/30 transition-all cursor-pointer text-xs uppercase tracking-wider py-3 mt-2',
    footerActionLink: 'text-primary hover:text-primary-dull font-bold text-sm',
    footerActionText: 'text-white text-sm font-medium',
    formFieldSuccessText: 'text-emerald-400 text-xs font-semibold',
    formFieldErrorText: 'text-red-400 text-xs font-semibold',
    identityPreviewText: 'text-white font-bold text-sm',
    identityPreviewEditButton: 'text-primary hover:text-primary-dull font-bold',
    formFieldInfoText: 'text-white text-xs',
    alertText: 'text-white text-sm font-medium',
    formHeaderTitle: 'text-white font-bold text-2xl',
    formHeaderSubtitle: 'text-white text-sm font-medium',
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
