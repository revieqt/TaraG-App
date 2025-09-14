import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedIcons from '@/components/ThemedIcons';
import { ThemedText } from './ThemedText';

interface EmptyMessageProps {
  title: string;
  description: string;
  iconLibrary?:  'MaterialIcons' | 'MaterialCommunityIcons' | 'MaterialDesignIcons';
  loading?: boolean;
  iconName?: string;
}

const EmptyMessage: React.FC<EmptyMessageProps> = ({
  title,
  description,
  loading = false,
  iconLibrary = 'MaterialIcons',
  iconName,
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
            size={40}
            color={color}
        />
      </>
      )}
      <ThemedText style={{marginTop: 20, fontSize: 13}} type='defaultSemiBold'>{title}</ThemedText>
      <ThemedText style={{opacity:.7, textAlign:'center', fontSize: 11}}>{description}</ThemedText>
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