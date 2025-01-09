import React from 'react';
import { generateAvatarData } from '../utils/avatarUtils';

const DefaultAvatar = ({ name, className = "w-10 h-10" }) => {
  const { initials, color } = generateAvatarData(name);
  
  return (
    <div 
      className={`${className} rounded-full flex items-center justify-center text-white font-medium`}
      style={{ backgroundColor: color }}
    >
      <span className="text-sm">{initials}</span>
    </div>
  );
};

export default DefaultAvatar; 