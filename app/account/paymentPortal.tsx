import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/context/SessionContext';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/Header';
import Button from '@/components/Button';

export default function PaymentPortalScreen() {
  const { userId } = useLocalSearchParams();
  const { session, updateSession } = useSession();
  const router = useRouter();
  const sessionUser = session?.user;
  
  return (
    <ThemedView style={{flex:1}}>
      <ScrollView>
        <Header
          label="Payment Portal"
        />
        <ThemedView color='primary' style={styles.container}>
          <View style={styles.productContainer}>
            <View>
              <ThemedText type='defaultSemiBold'>Product Name</ThemedText>
              <ThemedText style={{opacity: .5}}>Product Description</ThemedText>
            </View>
            <ThemedText>0.00</ThemedText>
          </View>
          <View style={styles.totalContainer}>
            <ThemedText>Subtotal</ThemedText>
            <ThemedText>0.00</ThemedText>
          </View>
        </ThemedView>

        <ThemedView color='primary' style={styles.container}>
          <ThemedText type='subtitle' style={{fontSize: 15, marginBottom: 10}}>Payment Account</ThemedText>
          <TouchableOpacity style={styles.addAccountContainer}>
            <ThemedIcons library='MaterialIcons' name='add' size={25}/>
            <ThemedText>Add Payment Account</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
      

      <ThemedView color='primary' shadow style={styles.bottomContainer}>
        <View style={[styles.totalContainer, {marginBottom: 10}]}>
          <ThemedText type='defaultSemiBold'>Total</ThemedText>
          <ThemedText type='defaultSemiBold'>0.00</ThemedText>
        </View>
        <Button
          title='Complete Payment'
          type='primary'
          onPress={() => []}
          buttonStyle={{
            width: '100%',
          }}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container:{
    padding: 16,
    marginBottom: 15,
  },
  productContainer:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderColor: '#ccc4',
    borderBottomWidth: 1,
    paddingBottom: 20
  },
  bottomContainer:{
    padding: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  totalContainer:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5
  },
  addAccountContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    opacity: .6
  },
});