import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export const LogAvatar = React.memo(({ img, theme, avatarSize, hideEmptyAvatars }: any) => {
  const [hasError, setHasError] = useState(false);
  return (
    <div style={{ 
      width: `${avatarSize}px`, 
      height: `${avatarSize}px`, 
      flexShrink: 0, 
      backgroundColor: hideEmptyAvatars ? 'transparent' : (theme === 'dark' ? '#242424' : '#f0f0f0'), 
      borderRadius: '4px', 
      overflow: 'hidden', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      {img && !hasError ? (
        <img 
          src={img} 
          alt="" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          onError={() => setHasError(true)}
          referrerPolicy="no-referrer"
        />
      ) : img && hasError ? (
        <div className="text-red-500/40">
          <ImageIcon className="w-4 h-4" />
        </div>
      ) : null}
    </div>
  );
});
