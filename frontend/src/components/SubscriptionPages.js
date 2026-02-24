import React, { useState, useEffect } from 'react';
import { AegisLogoCompact } from './AegisLogo';

const API = process.env.REACT_APP_BACKEND_URL || '';

// =============================================
// SUBSCRIPTION SUCCESS PAGE
// Shown after successful Stripe payment
// =============================================
export const SubscriptionSuccess = ({ onContinue }) => {
  const [status, setStatus] = useState('checking');
  const [subscription, setSubscription] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setStatus('error');
    }
  }, []);

  const pollPaymentStatus = async (sessionId) => {
    const maxAttempts = 10;
    
    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await fetch(`${API}/api/subscriptions/status/${sessionId}`);
      const data = await response.json();
      
      if (data.payment_status === 'paid') {
        setStatus('success');
        setSubscription(data);
        // Clear the URL params
        window.history.replaceState({}, '', window.location.pathname);
      } else if (data.status === 'expired') {
        setStatus('expired');
      } else {
        // Keep polling
        setAttempts(prev => prev + 1);
        setTimeout(() => pollPaymentStatus(sessionId), 2000);
      }
    } catch (error) {
      console.error('Status check error:', error);
      setAttempts(prev => prev + 1);
      setTimeout(() => pollPaymentStatus(sessionId), 2000);
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-800/80 rounded-3xl p-8 max-w-md w-full text-center border border-slate-700">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cyan-500/20 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Processing Payment</h2>
          <p className="text-slate-400">Please wait while we confirm your subscription...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    const packageName = subscription?.metadata?.package_name || 'Digital Mate';
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-800/80 rounded-3xl p-8 max-w-md w-full text-center border border-green-500/30">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="text-5xl">✓</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Welcome to {packageName}!</h2>
          <p className="text-green-400 font-semibold mb-4">Payment Successful</p>
          
          <div className="bg-slate-900/50 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-slate-400">Plan</span>
              <span className="text-white font-semibold">{packageName}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-400">Amount</span>
              <span className="text-white font-semibold">${subscription?.amount || '0.00'}/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status</span>
              <span className="text-green-400 font-semibold">Active</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onContinue}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-bold text-lg hover:opacity-90 transition-all"
            >
              Start Using Digital Mate →
            </button>
            <p className="text-slate-500 text-sm">
              A confirmation email has been sent to your inbox
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error/Timeout states
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-800/80 rounded-3xl p-8 max-w-md w-full text-center border border-red-500/30">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <span className="text-5xl">!</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {status === 'timeout' ? 'Verification Timeout' : 'Something Went Wrong'}
        </h2>
        <p className="text-slate-400 mb-6">
          {status === 'timeout' 
            ? 'We couldn\'t verify your payment. If you were charged, please contact support.'
            : 'There was an issue processing your subscription.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={onContinue}
            className="w-full py-3 bg-slate-700 rounded-xl text-white font-semibold hover:bg-slate-600 transition-all"
          >
            Return to App
          </button>
          <p className="text-slate-500 text-sm">
            Contact: support@digitalmate.app
          </p>
        </div>
      </div>
    </div>
  );
};

// =============================================
// SUBSCRIPTION CANCEL PAGE
// Shown when user cancels Stripe checkout
// =============================================
export const SubscriptionCancel = ({ onRetry, onContinue }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-800/80 rounded-3xl p-8 max-w-md w-full text-center border border-slate-700">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-700 flex items-center justify-center">
          <span className="text-4xl">🛡️</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Checkout Cancelled</h2>
        <p className="text-slate-400 mb-6">
          No worries! Your payment was not processed. You can try again whenever you're ready.
        </p>
        
        <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
          <p className="text-cyan-400 font-semibold mb-2">Why Digital Mate?</p>
          <ul className="text-slate-300 text-sm text-left space-y-2">
            <li>✓ Trap Mode catches phone snoops</li>
            <li>✓ Invisible Vault hides your secrets</li>
            <li>✓ Evidence collection for police reports</li>
            <li>✓ 30-day money back guarantee</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-bold hover:opacity-90 transition-all"
          >
            Try Again
          </button>
          <button
            onClick={onContinue}
            className="w-full py-3 text-slate-400 hover:text-white transition-all"
          >
            Continue with Free Version
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================
// EMAIL COLLECTION MODAL
// Shown before Stripe checkout
// =============================================
export const EmailCollectionModal = ({ isOpen, onClose, onSubmit, packageName, price }) => {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setIsValid(validateEmail(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    
    setIsSubmitting(true);
    await onSubmit(email);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-3xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <AegisLogoCompact size={40} />
            <div>
              <h3 className="text-xl font-bold text-white">Subscribe to {packageName}</h3>
              <p className="text-cyan-400 font-semibold">${price}/month</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-slate-400 text-sm mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none transition-all"
              autoFocus
            />
            <p className="text-slate-500 text-xs mt-2">
              We'll send your receipt and subscription details here
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-slate-400">Plan</span>
              <span className="text-white">{packageName}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-400">Billing</span>
              <span className="text-white">Monthly</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-slate-400">Total</span>
              <span className="text-cyan-400">${price}/mo</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Redirecting to Checkout...' : 'Continue to Payment →'}
          </button>

          <div className="mt-4 flex items-center justify-center space-x-2 text-slate-500 text-xs">
            <span>🔒</span>
            <span>Secure checkout powered by Stripe</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default { SubscriptionSuccess, SubscriptionCancel, EmailCollectionModal };
