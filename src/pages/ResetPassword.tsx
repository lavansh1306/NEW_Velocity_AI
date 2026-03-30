import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Eye, EyeOff, CheckCheck } from 'lucide-react';
import AuthLayout from '@/components/shared/AuthLayout';
import { FormError, validators } from '@/components/shared/FormError';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs: Record<string, string> = {};
    const passErr = validators.password(password, 12);
    if (passErr) errs.password = passErr;
    const matchErr = validators.passwordMatch(password, confirmPassword);
    if (matchErr) errs.confirm = matchErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);

    if (!validate()) return;

    setError('');
    setLoading(true);

    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-[#F0FDF4] rounded-full p-4">
              <CheckCheck className="h-10 w-10 text-[#16A34A]" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-[#1C1917] mb-3 tracking-tight">
            Password updated
          </h1>
          <p className="text-[#78716C] font-normal mb-8 leading-relaxed">
            Your password has been successfully reset. You will be redirected to the login page shortly.
          </p>
          <Button 
            onClick={() => navigate('/login')}
            className="w-full h-11 bg-[#1C1917] hover:bg-[#292524] rounded-lg font-medium transition-all text-white"
          >
            Go to login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-10 text-center lg:text-left">
        <div className="lg:hidden flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="bg-[#1C1917] rounded-xl p-2 shadow-md">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="font-medium text-[#292524] text-xl">Velocity AI</span>
          </div>
        </div>
        <h1 className="text-3xl font-semibold text-[#1C1917] mb-3 tracking-tight">
          Set new password
        </h1>
        <p className="text-[#78716C] font-normal">
          Your reset link is confirmed. Please choose a new, secure password.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-6">
        <div>
          <Label htmlFor="password" className="text-sm font-medium text-[#57534E] mb-1.5 block">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => { 
                setPassword(e.target.value); 
                if (attempted) {
                  const err = validators.password(e.target.value, 12);
                  setErrors(prev => ({ ...prev, password: err || '' }));
                }
              }}
              disabled={loading}
              className={`h-11 rounded-lg bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-normal placeholder:text-[#A8A29E] pr-10 ${errors.password ? 'border-[#BE123C] focus:ring-[#BE123C]/10' : 'border-[#E7E5E4]'}`}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#78716C]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FormError message={errors.password} />
          {!errors.password && <p className="text-xs text-[#A8A29E] mt-2">Must be at least 12 characters</p>}
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#57534E] mb-1.5 block">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => { 
              setConfirmPassword(e.target.value); 
              if (attempted) {
                const err = validators.passwordMatch(password, e.target.value);
                setErrors(prev => ({ ...prev, confirm: err || '' }));
              }
            }}
            disabled={loading}
            className={`h-11 rounded-lg bg-[#FAFAF9] focus:bg-white focus:ring-2 focus:ring-[#1C1917]/10 transition-all font-normal placeholder:text-[#A8A29E] ${errors.confirm ? 'border-[#BE123C] focus:ring-[#BE123C]/10' : 'border-[#E7E5E4]'}`}
          />
          <FormError message={errors.confirm} />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-[#1C1917] hover:bg-[#292524] rounded-lg font-medium transition-all duration-300 text-white shadow-lg shadow-stone-900/10"
        >
          {loading ? 'Updating password...' : 'Reset password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
