import { useState } from 'react';
import { authClient } from '../lib/auth-client';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authClient.signIn.magicLink({
        email,
        callbackURL: window.location.origin + '/',
      });
      if (result.error) setError(result.error.message || 'Failed to send magic link');
      else setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="mt-2 text-gray-600">
            We've sent a magic link to <strong>{email}</strong>. Click it to sign in.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-6 text-acacia-500 hover:text-acacia-600 text-sm font-medium"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/acacia_logo.png" alt="Acacia" className="h-10 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Acacia Email Helper</h1>
          <p className="mt-2 text-gray-600">Sign in to manage parent inquiries</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit}>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acacia-400 focus:border-acacia-400"
              />
            </div>

            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-white bg-acacia-400 hover:bg-acacia-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-acacia-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Send magic link'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
