import React, { useState } from 'react';
import { Mail, User, Phone, CheckCircle } from 'lucide-react';

export function Waitlist() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [mobileError, setMobileError] = useState('');

  // Mobile number validation function (only called on submit)
  const validateMobile = (mobile: string): string | null => {
    if (!mobile) return null; // Empty is okay, required attribute will handle it
    
    // Remove spaces, dashes, parentheses, and plus signs for validation
    let cleaned = mobile.replace(/[\s\-\(\)\+]/g, '');
    
    // Remove leading zeros (they don't count for validation)
    cleaned = cleaned.replace(/^0+/, '');
    
    // Check if it contains only digits
    if (!/^\d+$/.test(cleaned)) {
      return 'Please enter a valid mobile number';
    }
    
    // Check length (10-15 digits for international format) - internal validation
    if (cleaned.length < 10 || cleaned.length > 15) {
      return 'Please enter a valid mobile number';
    }
    
    return null; // Valid
  };

  // Handle mobile number input (no validation while typing)
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, mobile: value });
    // Clear any previous error when user starts typing
    if (mobileError) {
      setMobileError('');
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    setMobileError('');

    // Validate mobile number before submission
    const mobileValidationError = validateMobile(formData.mobile);
    if (mobileValidationError) {
      setStatus('error');
      setMobileError(mobileValidationError);
      setErrorMessage(mobileValidationError);
      return;
    }

    try {
      const response = await fetch('/api/waitlist-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        // Try to parse error response, but handle empty responses
        let errorData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: `Server error: ${response.status} ${response.statusText}` };
          }
        } else {
          errorData = { error: `Server error: ${response.status} ${response.statusText}` };
        }
        throw new Error(errorData.error || 'Something went wrong');
      }

      // Parse successful response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setStatus('success');
        setFormData({ name: '', email: '', mobile: '' });
      } else {
        // Handle non-JSON successful responses
        setStatus('success');
        setFormData({ name: '', email: '', mobile: '' });
      }

      // Reset success state after 3 seconds if you want to show the form again, 
      // but the UI shows a success message instead of the form, so we might want to keep it.
      // The original code reset it, so I will keep that behavior but maybe longer delay?
      // Actually, the original code showed a "Welcome" message. Let's keep it "submitted" 
      // so the user sees the success message.

    } catch (error: any) {
      console.error('Error submitting form:', error);
      setStatus('error');
      
      // Handle network/connection errors
      if (error.message && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
        setErrorMessage('Unable to connect to our servers. Please check your internet connection and try again.');
      } else {
        // Use the error message from the server (already user-friendly)
        setErrorMessage(error.message || 'Unable to process your request. Please try again.');
      }
    } finally {
      if (status !== 'success') {
        // only set idle if not success, to keep the success message
        // actually logic is tricky here because setStatus is async-ish.
        // simpler: if success, we stay success. if error, we stay error (or idle?).
        // The catch block sets error.
        // The try block sets success.
        // So we don't need finally to set idle unless we want to reset.
        // But we want to show success message.
      }
    }
  };

  return (
    <section id="waitlist" className="py-24 bg-gradient-to-br from-[#FFD93D] via-[#FFE873] to-[#FFF4B8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl mb-6 text-black">
            Join Our Journey
          </h2>
          <p className="text-2xl text-black/80 leading-relaxed">
            Be among the first to bring Kitty home. Join thousands of parents on our waitlist.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10 md:p-14">
          {status === 'success' ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-[#FFD93D] rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle size={56} className="text-black" />
              </div>
              <h3 className="text-4xl mb-4 text-black">Welcome to the Family!</h3>
              <p className="text-2xl text-gray-600 leading-relaxed">
                We'll keep you updated on Kitty's journey.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-lg mb-3 text-black">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={22} />
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-[#FFD93D] focus:outline-none transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-lg mb-3 text-black">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={22} />
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-[#FFD93D] focus:outline-none transition-colors"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="mobile" className="block text-lg mb-3 text-black">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={22} />
                  <input
                    type="tel"
                    id="mobile"
                    required
                    value={formData.mobile}
                    onChange={handleMobileChange}
                    className={`w-full pl-14 pr-4 py-4 text-lg border-2 rounded-xl focus:outline-none transition-colors ${
                      mobileError 
                        ? 'border-red-300 focus:border-red-400' 
                        : 'border-gray-200 focus:border-[#FFD93D]'
                    }`}
                    placeholder="Enter your mobile number"
                  />
                </div>
                {mobileError && (
                  <p className="text-red-600 text-sm mt-2">{mobileError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-5 text-xl bg-black text-[#FFD93D] rounded-xl hover:bg-black/90 hover:shadow-2xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Joining...' : 'Join the Waitlist'}
              </button>

              {errorMessage && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center">
                  {errorMessage}
                </div>
              )}

              <p className="text-base text-gray-500 text-center leading-relaxed">
                By joining, you'll receive updates about Kitty's development and early access opportunities.
              </p>
            </form>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-xl text-black/80 mb-4">Questions? We'd love to hear from you!</p>
          <a
            href="mailto:hello@icurious.ai"
            className="text-2xl text-black hover:underline transition-all"
          >
            hello@icurious.ai
          </a>
        </div>
      </div>
    </section>
  );
}
