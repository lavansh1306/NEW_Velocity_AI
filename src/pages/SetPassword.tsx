import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError, validators } from '@/components/shared/FormError';

export default function SetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    const passErr = validators.password(password, 12);
    if (passErr) errs.password = passErr;
    const matchErr = validators.passwordMatch(password, confirmPassword);
    if (matchErr) errs.confirm = matchErr;
    if (!agreed) errs.terms = 'You must accept the Terms of Service';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setAttempted(true);
    if (!validate()) return;

    setLoading(true);
    try {
      await updatePassword(password);
      navigate('/velocity-ai');
    } catch (err: any) {
      setErrors(prev => ({ ...prev, password: err.message || 'Failed to set password' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center p-4 font-['Inter',sans-serif]">
      {/* Top Logo */}
      <div className="flex items-center gap-3 mb-16">
        <div className="bg-[#1C1917] rounded-lg p-2 shadow-lg shadow-stone-900/10">
          <Zap className="h-5 w-5 text-[#2DD4BF]" />
        </div>
        <span className="text-2xl font-light text-[#1C1917] tracking-tight">Velocity AI</span>
      </div>

      {/* Card */}
      <div className="w-[480px] bg-white border border-[#E7E5E4] rounded-xl p-12 shadow-sm">
        <h1 className="text-2xl font-light text-[#1C1917] mb-3">Welcome to Velocity AI</h1>
        <p className="text-base text-[#78716C] leading-relaxed mb-10">Create your password to get started</p>

        {/* Pre-filled info */}
        <div className="bg-[#FAFAF9] rounded-xl p-4 mb-8 space-y-3 border border-[#E7E5E4]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-[#A8A29E] uppercase font-normal mb-1">WORK EMAIL</div>
              <div className="text-base font-light text-[#1C1917]">sarah@acme.com</div>
            </div>
            <div>
              <div className="text-[10px] text-[#A8A29E] uppercase font-normal mb-1">COMPANY</div>
              <div className="text-base font-light text-[#1C1917]">Acme Inc</div>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#A8A29E] uppercase font-normal mb-1">ROLE</div>
            <div className="text-base font-light text-[#1C1917]">Frontend Lead</div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-8">
          <div>
            <Label className="text-xs text-[#78716C] uppercase font-normal mb-2 block">Create Password</Label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (attempted) { const err = validators.password(e.target.value, 12); setErrors(prev => ({ ...prev, password: err })); } }}
                className={`h-[44px] rounded-lg bg-white text-[15px] focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917] pr-10 font-light ${errors.password ? 'border-[#BE123C] focus:ring-[#BE123C]/10' : 'border-[#E7E5E4]'}`}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#78716C]"
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            <FormError message={errors.password} />
            {!errors.password && <p className="text-xs text-[#A8A29E] mt-2">Must be at least 12 characters</p>}
          </div>

          <div>
            <Label className="text-xs text-[#78716C] uppercase font-normal mb-2 block">Confirm Password</Label>
            <Input 
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); if (attempted) { const err = validators.passwordMatch(password, e.target.value); setErrors(prev => ({ ...prev, confirm: err })); } }}
              className={`h-[44px] rounded-lg bg-white text-[15px] focus:ring-1 focus:ring-[#1C1917] focus:border-[#1C1917] font-light ${errors.confirm ? 'border-[#BE123C] focus:ring-[#BE123C]/10' : 'border-[#E7E5E4]'}`}
            />
            <FormError message={errors.confirm} />
          </div>
        </div>

        <div className="mb-8">
          <button 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => { setAgreed(!agreed); if (attempted) setErrors(prev => ({ ...prev, terms: !agreed ? '' : 'You must accept the Terms of Service' })); }}
          >
            <div className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${agreed ? 'bg-[#1C1917] text-white' : 'border-2 border-[#D6D3D1] bg-white'}`}>
              {agreed && <Check className="h-3 w-3" />}
            </div>
            <span className="text-sm text-[#57534E] font-light">I agree to the Terms of Service and Privacy Policy</span>
          </button>
          <FormError message={errors.terms} />
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-[48px] bg-[#1C1917] hover:bg-[#292524] text-white rounded-lg text-base font-normal transition-all duration-300 shadow-md"
        >
          {loading ? 'Setting up...' : 'Set Password & Get Started →'}
        </Button>
      </div>
    </div>
  );
}
