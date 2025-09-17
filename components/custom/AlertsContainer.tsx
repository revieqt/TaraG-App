import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Image} from 'react-native';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import {LinearGradient} from 'expo-linear-gradient';
interface AlertsContainerProps {
  children?: React.ReactNode;
}

const AlertsContainer: React.FC<AlertsContainerProps> = ({
  children,
}) => {
  const [hideAlert, setHideAlert] = useState(false);
  return (
    <>
      {hideAlert ? (
        <ThemedView style={styles.openContainer} shadow color='secondary'>
          <TouchableOpacity onPress={() => setHideAlert(false)}>
            <ThemedIcons library='MaterialIcons' name="notifications" size={20} color='white'/>
          </TouchableOpacity>
        </ThemedView>
      ): (
        <View style={styles.container}>
        <ThemedView style={styles.hideButton} shadow color='primary'>
          <TouchableOpacity onPress={() => setHideAlert(true)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5}}>
            <ThemedIcons library='MaterialIcons' name="notifications-off" size={20}/>
            <ThemedText style={{fontSize: 12}}>Hide</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        {children}
        <ThemedView style={styles.alertButton} shadow>
          <TouchableOpacity onPress={() => setHideAlert(true)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5}}>
            <Image source={require('@/assets/images/tara-worried.png')} style={styles.taraImage} />
          </TouchableOpacity>
        </ThemedView>
      </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    pointerEvents: 'box-none',
    position: 'absolute',
    bottom: 10,
    right: 10,
    top: 10,
    zIndex: 1000,
    width: 70,
    alignItems: 'flex-end',
    flexDirection: 'column-reverse',
    gap: 10
  },
  openContainer:{
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 1000,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  hideButton:{
    width: '100%',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,.2)',
    opacity: .7
  },
  alertButton:{
    width: '100%',
    aspectRatio: 1,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 183, 77, 0.7)',
    borderWidth: 3,
    borderColor: '#fff'
  },
  taraImage:{
    width: 120,
    height: 120,
    marginLeft: 10,
    objectFit: 'contain',
  }
});

export default AlertsContainer; 