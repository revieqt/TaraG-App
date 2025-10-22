import { useThemeColor } from '@/hooks/useThemeColor';
import { StyleSheet, Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link'| 'error';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'error' ? styles.error : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
  },
  defaultSemiBold: {
    fontFamily: 'Poppins',
    fontSize: 16,
  },
  title: {
    fontFamily: 'PoppinsBold',
    fontSize: 24,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 18,
  },
  link: {
    fontFamily: 'Poppins',
    lineHeight: 30,
    fontSize: 13,
    color: '#0a7ea4',
    textDecorationLine: 'underline',
  },
  error: {
    fontFamily: 'Poppins',
    fontSize: 13,
    paddingVertical: 10,
    color: '#d32f2f',
  },
});