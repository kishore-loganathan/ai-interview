import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { getImageUrl } from '@/config/api';

interface UserAvatarProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  onClick?: () => void;
  fallbackClassName?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  size = 'default',
  className = '',
  onClick,
  fallbackClassName = 'bg-purple-600/20 text-purple-400',
}) => {
  const getUserData = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return { name: 'User', profilePicture: null };

    try {
      const user = JSON.parse(userStr);
      return {
        name: user.name || 'User',
        profilePicture: user.profilePicture || null,
      };
    } catch {
      return { name: 'User', profilePicture: null };
    }
  };

  const { name, profilePicture } = getUserData();

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileImageUrl = (path: string | null): string | undefined => {
    return getImageUrl(path);
  };

  const imageUrl = getProfileImageUrl(profilePicture);
  const initials = getInitials(name);

  return (
    <Avatar 
      size={size} 
      className={`${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {imageUrl && <AvatarImage src={imageUrl} />}
      <AvatarFallback className={`${fallbackClassName} text-[10px] font-semibold`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
