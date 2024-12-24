'use client';

import { Eye, EyeOff, Check, X } from 'lucide-react';
import * as React from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

type PasswordInputProps = { showStrengthIndicator?: boolean } & Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  'type'
>;

export const strengthRequirements = [
  { regex: /.{8,}/, text: 'At least 8 characters' },
  { regex: /[0-9]/, text: 'At least 1 number' },
  { regex: /[a-z]/, text: 'At least 1 lowercase letter' },
  { regex: /[A-Z]/, text: 'At least 1 uppercase letter' },
];
const strengthColors = [
  'bg-border',
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
];
const strengthLabels = [
  'Enter a password',
  'Weak password',
  'Medium password',
  'Strong password',
  'Strong password',
];

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, onChange, showStrengthIndicator = false, ...props }, ref) => {
    const [password, setPassword] = React.useState('');
    const [isVisible, setIsVisible] = React.useState(false);

    const onPasswordChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        // We only need to keep track of the password for the strength indicator
        if (showStrengthIndicator) {
          setPassword(e.target.value);
        }

        onChange?.(e);
      },
      [onChange, showStrengthIndicator],
    );

    const toggleVisibility = React.useCallback(() => setIsVisible((prevState) => !prevState), []);

    const strength = React.useMemo(() => {
      const requirements = strengthRequirements.map((req) => ({
        met: req.regex.test(password),
        text: req.text,
      }));

      const score = requirements.filter((req) => req.met).length;
      const color = strengthColors[score];
      const label = strengthLabels[score];

      return { requirements, score, color, label };
    }, [password]);

    return (
      <div>
        <div className="relative">
          <Input
            className={cn('pe-9', className)}
            type={isVisible ? 'text' : 'password'}
            onChange={onPasswordChange}
            ref={ref}
            {...props}
          />

          {/* Visibility toggler */}
          <button
            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={toggleVisibility}
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isVisible}
            aria-controls="password"
          >
            {isVisible ? (
              <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Eye size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>

        {showStrengthIndicator && (
          <>
            {/* Password strength indicator */}
            <div
              className="mb-4 mt-3 h-1 w-full overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-valuenow={strength.score}
              aria-valuemin={0}
              aria-valuemax={strengthRequirements.length}
              aria-label="Password strength"
            >
              <div
                className={`h-full ${strength.color} transition-all duration-500 ease-out`}
                style={{ width: `${(strength.score / strengthRequirements.length) * 100}%` }}
              ></div>
            </div>

            {/* Password strength description */}
            <p id="password-strength" className="mb-2 text-sm font-medium text-foreground">
              {strength.label}. Must contain:
            </p>

            {/* Password requirements list */}
            <ul className="space-y-1.5" aria-label="Password requirements">
              {strength.requirements.map((req, index) => (
                <li key={index} className="flex items-center gap-2">
                  {req.met ? (
                    <Check size={16} className="text-emerald-500" aria-hidden="true" />
                  ) : (
                    <X size={16} className="text-muted-foreground/80" aria-hidden="true" />
                  )}
                  <span
                    className={`text-xs ${req.met ? 'text-emerald-600' : 'text-muted-foreground'}`}
                  >
                    {req.text}
                    <span className="sr-only">
                      {req.met ? ' - Requirement met' : ' - Requirement not met'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
