import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth';

export default function Auth({ onGuestAccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      let errMsg = 'An error occurred. Please try again.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errMsg = 'Incorrect email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already registered.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password must be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'Please enter a valid email address.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      let errMsg = 'Google Sign-In failed. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') {
        errMsg = 'Login window was closed before completion.';
      } else if (err.code === 'auth/blocked-by-popup-toggler') {
        errMsg = 'Popup was blocked by your browser settings.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface font-body-md text-on-surface">
      {/* Left Side: Visual/Branding Section */}
      <section className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden login-gradient">
        <div className="relative z-10 w-full h-full flex flex-col p-xl justify-between">
          <div>
            <h1 className="font-headline-xl text-white tracking-tight">CarbonSense AI</h1>
            <p className="font-body-lg text-white/80 mt-sm max-w-md">
              Precision analytics for a sustainable future. Empowering individual carbon intelligence through data-driven models.
            </p>
          </div>
          
          <div className="glass-overlay rounded-xl p-lg max-w-lg mb-xl">
            <div className="flex items-center gap-md mb-md">
              <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-on-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              </div>
              <div>
                <p className="font-label-md text-tertiary-fixed uppercase">Real-time Impact</p>
                <h3 className="font-headline-md text-white">Carbon Optimization</h3>
              </div>
            </div>
            <p className="font-body-md text-white/90">
              Join over 50,000 individuals reducing their footprint by an average of 22% using our predictive regression algorithms.
            </p>
            <div className="mt-lg flex gap-sm">
              <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-fixed w-3/4"></div>
              </div>
              <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
              <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
            </div>
          </div>
          
          <div className="absolute bottom-0 right-0 w-full h-1/2 opacity-20">
            <img 
              alt="Forest coastline landscape" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3kF2Z1oAgCSUtcKyNOMvLlRi4Wb5fY4CZahomJPEt_s8ijPg0TVMP2GDg8hs86-cpLAkYtrJjqDU0Q7RSP1wtwyHIljVwupx_J-AmIPOHtx1E64xpq4Q2XD-T-u1ZxvKtDBo_RZ1dd-DZX2dBaxhtQ_7JxmwZ700OkckyPyGEV4URYLg0-KXwC_1RPj0DLWmDBtWecr9gV3M_ba3QZVxl7RDyNLCwXzSGxCLnvC8XsB6G4LpvuwF1kgAC1ok6smdxgtsWTNxBbVi0"
            />
          </div>
        </div>
      </section>

      {/* Right Side: Login Form Section */}
      <section className="flex-1 flex flex-col justify-center items-center px-lg py-2xl bg-surface-container-lowest">
        <div className="w-full max-w-md">
          {/* Mobile Branding (Hidden on Desktop) */}
          <div className="md:hidden mb-xl text-center">
            <h1 className="font-headline-lg text-secondary">CarbonSense AI</h1>
          </div>

          <header className="mb-xl">
            <h2 className="font-headline-xl text-on-surface mb-xs">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="font-body-md text-on-surface-variant">
              {isSignUp ? 'Sign up to start tracking your carbon goals.' : 'Log in to manage your carbon logs.'}
            </p>
          </header>

          {error && (
            <div className="mb-md p-md bg-error-container text-on-error-container rounded-lg text-body-sm text-center border border-error/20">
              {error}
            </div>
          )}

          <form className="space-y-md" onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="space-y-xs">
                <label className="font-label-md text-on-surface-variant" htmlFor="name">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: '20px' }}>person</span>
                  <input 
                    className="w-full pl-11 pr-md py-md bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none text-body-md" 
                    id="name" 
                    placeholder="John Doe" 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-xs">
              <label className="font-label-md text-on-surface-variant" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: '20px' }}>mail</span>
                <input 
                  className="w-full pl-11 pr-md py-md bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none text-body-md" 
                  id="email" 
                  placeholder="name@example.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-xs">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-on-surface-variant" htmlFor="password">Password</label>
                {!isSignUp && <a className="font-label-md text-secondary hover:underline transition-all" href="#">Forgot Password?</a>}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: '20px' }}>lock</span>
                <input 
                  className="w-full pl-11 pr-md py-md bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-all outline-none text-body-md" 
                  id="password" 
                  placeholder="••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              className="w-full py-md bg-secondary text-white font-label-md rounded-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-xs" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">sync</span>
              ) : (
                isSignUp ? 'Register' : 'Login'
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-sm">
              <div className="flex-grow border-t border-outline-variant"></div>
              <span className="flex-shrink mx-md font-label-md text-outline-variant">OR CONTINUE WITH</span>
              <div className="flex-grow border-t border-outline-variant"></div>
            </div>

            {/* Social Auth */}
            <div className="grid grid-cols-2 gap-md">
              <button 
                type="button"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-sm py-md px-md border border-outline-variant rounded-lg hover:bg-surface-container transition-colors"
              >
                <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBC2KTes3MvbeNW7LSP66-rseVweUPKtMbPseeCuNz2KAMQpfA1dKDj8ShqyyBgmGdnYa_JsN18vbWUfK8TobIyhpOMA0zw5Np1PLPsNGS76VVImVq5p_6RuEtdyZqg_-aYKKWJYcYdsXVmqLWKc07z9sVgd0oLwt707ckAf8ZX4eGt0lsW89dzp4RyI81K5LhFoW3YDHl9xeVJ5vvV5zkWFFn64zFyFU0sYWkYUxzlBhP-hbLMym-t0DuNOc9hW_nzGb-UBBUAp55s"/>
                <span className="font-label-md text-on-surface">Google</span>
              </button>
              
              <button 
                type="button"
                onClick={onGuestAccess}
                className="flex items-center justify-center gap-xs py-md px-md border border-outline-variant rounded-lg hover:bg-surface-container transition-colors text-on-surface"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>explore</span>
                <span className="font-label-md">Guest</span>
              </button>
            </div>
          </form>

          <footer className="mt-2xl text-center">
            <p className="font-body-md text-on-surface-variant">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-secondary font-bold hover:underline transition-all"
              >
                {isSignUp ? 'Login' : 'Register'}
              </button>
            </p>
          </footer>

          {/* Trust Badges / Mini Footer */}
          <div className="mt-2xl flex justify-center gap-xl grayscale opacity-50">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified_user</span>
              <span className="font-label-md">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>security</span>
              <span className="font-label-md">SSL Secure</span>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
