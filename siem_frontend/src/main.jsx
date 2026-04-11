import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import Lenis from '@studio-freight/lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis
const lenis = new Lenis({ 
  duration: 1.2, 
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) 
});

// Connect Lenis to GSAP ticker
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// Global component to handle ScrollTrigger refresh on mount/unmount and routing
export const initScrollTriggerRefresh = () => {
    ScrollTrigger.refresh();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
