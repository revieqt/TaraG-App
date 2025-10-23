import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/context/SessionContext';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
// Header component removed as per request
import Button from '@/components/Button';
import Header from '@/components/Header';

// interface PaymentPortalProps removed as data will be read from URL params
// Function prop `onPaymentComplete` is not supported via URL params and must be dropped.

export default function PaymentPortalScreen() {
  const { session, updateSession } = useSession();
  const router = useRouter();
  const sessionUser = session?.user;
  
  // 1. Read data from URL parameters
  const params = useLocalSearchParams();
  
  // *** DEBUGGING LOG ADDED ***
  console.log('Received Navigation Params:', params);

  const productName = params.productName as string || 'Unknown Product';
  const productDescription = params.productDescription as string | undefined;
  // Price comes as string via URL, convert it to number. Default to 0 if invalid.
  const productPrice = parseFloat(params.productPrice as string) || 0;
  
  // *** DEBUGGING LOG ADDED ***
  console.log('Processed Product Details:', { productName, productDescription, productPrice });

  // Format the price for display
  const formattedPrice = productPrice.toFixed(2);

  const handlePaymentCompletion = () => {
    // 1. Simulate payment processing (In a real app, this would be an API call)
    // We use Alert here as it's a standard React Native component for user interaction
    Alert.alert(
      "Confirm Payment",
      `Do you want to complete the purchase of ${productName} for P${formattedPrice}?`,
      [
        {
          text: "Cancel",
          style: 'cancel',
        },
        {
          text: "Pay Now",
          onPress: () => {
            // NOTE: The original onPaymentComplete function prop is removed.
            // In a real scenario, this is where you'd update global state or fire an event.

            // 2. Simulate success (e.g., update user state if needed)
            // Example: updateSession({ user: { ...sessionUser, isProUser: true } }); 

            // 3. Show final success message and close the modal
            Alert.alert(
                "Payment Success!",
                "Your transaction has been confirmed.",
                [
                    // This is usually where the screen closes/navigates back
                    { text: "Close", onPress: () => router.back() } 
                ]
            );
          },
        },
      ]
    );
  };
  

  return (
    <ThemedView style={{flex:1}}>
      <Header label='Payment Portal' />
      <ScrollView>
        <ThemedView color='primary' style={styles.container}>
          {/* Product Details Block */}
          <View style={styles.productContainer}>
            <View>
              <ThemedText type='defaultSemiBold'>{productName}</ThemedText>
              {productDescription && (
                <ThemedText style={{opacity: .5}}>{productDescription}</ThemedText>
              )}
            </View>
            <ThemedText>P {formattedPrice}</ThemedText>
          </View>
          
          {/* Subtotal Block */}
          <View style={styles.totalContainer}>
            <ThemedText>Subtotal</ThemedText>
            <ThemedText>P {formattedPrice}</ThemedText>
          </View>
        </ThemedView>

        <ThemedView color='primary' style={styles.container}>
          {/* Payment Account Block */}
          <ThemedText type='subtitle' style={{fontSize: 15, marginBottom: 10}}>Payment Account</ThemedText>
          <TouchableOpacity style={styles.addAccountContainer}>
            <ThemedIcons library='MaterialIcons' name='add' size={25}/>
            <ThemedText>Add Payment Account</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
      
      {/* Bottom Floating Bar */}
      <ThemedView color='primary' shadow style={styles.bottomContainer}>
        <View style={[styles.totalContainer, {marginBottom: 10}]}>
          <ThemedText type='defaultSemiBold'>Total</ThemedText>
          <ThemedText type='defaultSemiBold'>P {formattedPrice}</ThemedText>
        </View>
        <Button
          title='Complete Payment'
          type='primary'
          onPress={handlePaymentCompletion} // Updated handler
          buttonStyle={{
            width: '100%',
          }}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // Custom Header Styles for Modal Look
  customHeader: {
    paddingHorizontal: 16,
    paddingTop: 50, // To account for safe area/notch
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc4',
    // Apply shadow for separation if desired
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 3,
    // elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  // Existing Styles
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
