import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedIcons from '@/components/ThemedIcons';
import { ThemedText } from './ThemedText';
import Button from '@/components/Button';

interface EmptyMessageProps {
  title: string;
  description: string;
  iconLibrary?:  'MaterialIcons' | 'MaterialCommunityIcons' | 'MaterialDesignIcons';
  loading?: boolean;
  iconName?: string;
  buttonLabel?: string;
  buttonAction?: () => void;
  isWhite?: boolean;
  isSolid?: boolean;
}

const EmptyMessage: React.FC<EmptyMessageProps> = ({
  title,
  description,
  loading = false,
  iconLibrary = 'MaterialIcons',
  iconName,
  buttonLabel,
  buttonAction,
  isWhite = false,
  isSolid = false
}) => {
  const color = isWhite ? '#FFFFFF' : useThemeColor({}, 'text');

  return (
    <View style={[styles.container, {opacity: isSolid ? 1 : .5}]}>
      {loading ? (
        <ActivityIndicator size={40} color={color}/>
      ) : (
        <>
        <ThemedIcons
            library={iconLibrary}
            name={iconName}
            size={30}
            color={color}
        />
      </>
      )}
      <ThemedText style={{marginTop: 20, fontSize: 13, color: color}} type='defaultSemiBold'>{title}</ThemedText>
      <ThemedText style={{opacity:.7, textAlign:'center', fontSize: 11, marginBottom: 10, color: color}}>{description}</ThemedText>
      {buttonLabel && buttonAction && (
        <TouchableOpacity onPress={buttonAction} style={{
          backgroundColor: isWhite ? 'rgba(255, 255, 255, .3)'
          : undefined, paddingVertical: 7, paddingHorizontal: 15, borderRadius: 20}}>
          <ThemedText style={{color: isWhite ? '#FFFFFF' : undefined}}>{buttonLabel}</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:{
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default EmptyMessage; 