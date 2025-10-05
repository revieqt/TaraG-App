import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
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
}

const EmptyMessage: React.FC<EmptyMessageProps> = ({
  title,
  description,
  loading = false,
  iconLibrary = 'MaterialIcons',
  iconName,
  buttonLabel,
  buttonAction
}) => {
  const color = useThemeColor({}, 'text');

  return (
    <View style={styles.container}>
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
      <ThemedText style={{marginTop: 20, fontSize: 13}} type='defaultSemiBold'>{title}</ThemedText>
      <ThemedText style={{opacity:.7, textAlign:'center', fontSize: 11, marginBottom: 10}}>{description}</ThemedText>
      {buttonLabel && buttonAction && (
        <Button
          title={buttonLabel}
          onPress={buttonAction}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:{
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: .5,
  }
});

export default EmptyMessage; 