import React from 'react';

export const Toggle = ({
  enabled,
  onChange,
  size = 'md',
  variant = 'emerald',
}: {
  enabled: boolean;
  onChange: (val: boolean, e?: React.MouseEvent) => void;
  size?: 'md' | 'sm';
  variant?: 'emerald' | 'pink';
}) => {
  const isSmall = size === 'sm';
  const activeBg = variant === 'pink' ? 'bg-[#e6005c]' : 'bg-emerald-600';
  const inactiveBg = variant === 'pink' ? 'bg-white/20' : 'bg-stone-200';

  return (
    <button
      type="button"
      onClick={(e) => onChange(!enabled, e)}
      className={`relative inline-flex ${isSmall ? 'h-4 w-7' : 'h-5 w-9'} shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        enabled ? activeBg : inactiveBg
      }`}
    >
      <span
        className={`pointer-events-none inline-block ${isSmall ? 'h-3 w-3' : 'h-4 w-4'} transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? (isSmall ? 'translate-x-3' : 'translate-x-4') : 'translate-x-0'
        }`}
      />
    </button>
  );
};
