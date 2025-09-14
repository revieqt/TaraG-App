import React from 'react';
import { useSession } from '@/context/SessionContext';
import { Image } from 'react-native';

interface ProBadgeProps {
  size?: number;
  style?: object;
}

const ProBadge: React.FC<ProBadgeProps> = ({
  size = 20,
  style = {},
}) => {
  const { session } = useSession();
  const isPro = !!session?.user?.isProUser;

  if (!isPro) return null;

  return (
    <Image
      source={require('@/assets/images/pro-badge.png')}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
    />
  );
};

export default ProBadge;