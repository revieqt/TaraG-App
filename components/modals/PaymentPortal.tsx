import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Alert, Modal, TextInput } from 'react-native';
import Button from '@/components/Button';
import Header from '@/components/Header';
import GradientBlobs from '@/components/GradientBlobs';
import ContactNumberField from '@/components/ContactNumberField';
import { Picker } from '@react-native-picker/picker';
import { useThemeColor } from '@/hooks/useThemeColor';
import { 
  PaymentAccount, 
  savePaymentAccount, 
  getPaymentAccounts, 
  deletePaymentAccount,
  formatPaymentAccountDisplay 
} from '@/utils/paymentAccounts';

interface PaymentPortalProps {
  visible: boolean;
  onClose: () => void;
  productName: string;
  productDescription?: string;
  price: string;
  onPaymentComplete?: () => void;
}

export default function PaymentPortal({
  visible,
  onClose,
  productName,
  productDescription,
  price,
  onPaymentComplete,
}: PaymentPortalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'accent');
  
  // Parse price to number and format for display
  const productPrice = parseFloat(price) || 0;
  const formattedPrice = productPrice.toFixed(2);

  // Payment account states
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'gcash' | 'card' | null>(null);

  // GCash form states
  const [gcashAreaCode, setGcashAreaCode] = useState('63+');
  const [gcashNumber, setGcashNumber] = useState('');

  // Card form states
  const [cardType, setCardType] = useState<'visa' | 'mastercard'>('visa');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  // Load payment accounts on mount
  useEffect(() => {
    loadPaymentAccounts();
  }, []);

  const loadPaymentAccounts = async () => {
    const accounts = await getPaymentAccounts();
    setPaymentAccounts(accounts);
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  };

  const handleAddAccount = () => {
    setShowAddAccountModal(true);
    setPaymentType(null);
    resetForms();
  };

  const resetForms = () => {
    setGcashAreaCode('63+');
    setGcashNumber('');
    setCardType('visa');
    setCardHolderName('');
    setCardNumber('');
    setExpirationDate('');
  };

  const handleSaveAccount = async () => {
    if (!paymentType) {
      Alert.alert('Error', 'Please select a payment type');
      return;
    }

    if (paymentType === 'gcash') {
      if (!gcashNumber || gcashNumber.length !== 10) {
        Alert.alert('Error', 'Please enter a valid 10-digit contact number');
        return;
      }

      const newAccount: PaymentAccount = {
        id: Date.now().toString(),
        type: 'gcash',
        contactNumber: gcashNumber,
        areaCode: gcashAreaCode.replace('+', ''),
      };

      await savePaymentAccount(newAccount);
      await loadPaymentAccounts();
      setSelectedAccountId(newAccount.id);
      setShowAddAccountModal(false);
      Alert.alert('Success', 'GCash account added successfully');
    } else if (paymentType === 'card') {
      if (!cardHolderName || !cardNumber || !expirationDate) {
        Alert.alert('Error', 'Please fill in all card details');
        return;
      }

      if (cardNumber.replace(/\s/g, '').length !== 16) {
        Alert.alert('Error', 'Card number must be 16 digits');
        return;
      }

      const newAccount: PaymentAccount = {
        id: Date.now().toString(),
        type: 'card',
        cardType,
        cardHolderName,
        cardNumber: cardNumber.replace(/\s/g, ''),
        expirationDate,
      };

      await savePaymentAccount(newAccount);
      await loadPaymentAccounts();
      setSelectedAccountId(newAccount.id);
      setShowAddAccountModal(false);
      Alert.alert('Success', 'Card added successfully');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    Alert.alert(
      'Delete Payment Account',
      'Are you sure you want to delete this payment account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePaymentAccount(accountId);
            await loadPaymentAccounts();
            if (selectedAccountId === accountId) {
              setSelectedAccountId(null);
            }
            Alert.alert('Success', 'Payment account deleted');
          },
        },
      ]
    );
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\s/g, '').replace(/\D/g, '');
    if (cleaned.length <= 16) {
      setCardNumber(formatCardNumber(cleaned));
    }
  };

  const handleExpirationDateChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      if (cleaned.length >= 2) {
        setExpirationDate(cleaned.slice(0, 2) + '/' + cleaned.slice(2));
      } else {
        setExpirationDate(cleaned);
      }
    }
  };

  const handlePaymentCompletion = () => {
    if (!selectedAccountId) {
      Alert.alert('Error', 'Please select or add a payment account');
      return;
    }

    const selectedAccount = paymentAccounts.find(acc => acc.id === selectedAccountId);
    const accountDisplay = selectedAccount ? formatPaymentAccountDisplay(selectedAccount) : '';

    Alert.alert(
      "Confirm Payment",
      `Do you want to complete the purchase of ${productName} for P${formattedPrice} using ${accountDisplay}?`,
      [
        {
          text: "Cancel",
          style: 'cancel',
        },
        {
          text: "Pay Now",
          onPress: () => {
            // Show success message
            Alert.alert(
              "Payment Success!",
              "Your transaction has been confirmed.",
              [
                {
                  text: "Close",
                  onPress: () => {
                    // Call the onPaymentComplete callback if provided
                    if (onPaymentComplete) {
                      onPaymentComplete();
                    }
                    // Close the modal
                    onClose();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };
  

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={{flex:1}}>
        <GradientBlobs/>
        <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
          <ThemedIcons library='MaterialIcons' name='close' size={22}/>
        </TouchableOpacity>
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
          
          {/* Existing Payment Accounts */}
          {paymentAccounts.length > 0 && (
            <View>
              <ThemedText style={{opacity: 0.7, marginBottom: 10}}>Select Payment Method:</ThemedText>
              {paymentAccounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.paymentAccountItem,
                    selectedAccountId === account.id && { borderColor: accentColor, borderWidth: 2 },
                  ]}
                  onPress={() => setSelectedAccountId(account.id)}
                >
                  <View style={styles.accountInfo}>
                    <ThemedIcons 
                      library='MaterialIcons' 
                      name={account.type === 'gcash' ? 'account-balance-wallet' : 'credit-card'} 
                      size={16}
                    />
                    <ThemedText>{formatPaymentAccountDisplay(account)}</ThemedText>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteAccount(account.id)}>
                    <ThemedIcons library='MaterialIcons' name='delete' size={16} color='#ff4444'/>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.addAccountContainer} onPress={handleAddAccount}>
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

      {/* Add Payment Account Modal */}
      <Modal
        visible={showAddAccountModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView color='primary' style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type='subtitle'>Add Payment Account</ThemedText>
              <TouchableOpacity onPress={() => setShowAddAccountModal(false)}>
                <ThemedIcons library='MaterialIcons' name='close' size={24}/>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Payment Type Selection */}
              {!paymentType && (
                <View>
                  <ThemedText style={{marginBottom: 15, opacity: 0.7}}>Select Payment Type:</ThemedText>
                  <TouchableOpacity
                    style={[styles.paymentTypeButton, { backgroundColor: primaryColor }]}
                    onPress={() => setPaymentType('gcash')}
                  >
                    <ThemedIcons library='MaterialIcons' name='account-balance-wallet' size={30}/>
                    <ThemedText type='defaultSemiBold'>GCash</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.paymentTypeButton, { backgroundColor: primaryColor }]}
                    onPress={() => setPaymentType('card')}
                  >
                    <ThemedIcons library='MaterialIcons' name='credit-card' size={30}/>
                    <ThemedText type='defaultSemiBold'>Credit/Debit Card</ThemedText>
                  </TouchableOpacity>
                </View>
              )}

              {/* GCash Form */}
              {paymentType === 'gcash' && (
                <View>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setPaymentType(null)}
                  >
                    <ThemedIcons library='MaterialIcons' name='arrow-back' size={20}/>
                    <ThemedText>Back</ThemedText>
                  </TouchableOpacity>
                  <ThemedText type='defaultSemiBold' style={{marginBottom: 15}}>GCash Account</ThemedText>
                  <ThemedText style={{marginBottom: 10, opacity: 0.7}}>Contact Number:</ThemedText>
                  <ContactNumberField
                    areaCode={gcashAreaCode}
                    onAreaCodeChange={setGcashAreaCode}
                    number={gcashNumber}
                    onNumberChange={setGcashNumber}
                    placeholder='Contact Number'
                  />
                </View>
              )}

              {/* Card Form */}
              {paymentType === 'card' && (
                <View>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setPaymentType(null)}
                  >
                    <ThemedIcons library='MaterialIcons' name='arrow-back' size={20}/>
                    <ThemedText>Back</ThemedText>
                  </TouchableOpacity>
                  <ThemedText type='defaultSemiBold' style={{marginBottom: 15}}>Card Details</ThemedText>
                  
                  {/* Card Type */}
                  <ThemedText style={{marginBottom: 10, opacity: 0.7}}>Card Type:</ThemedText>
                  <View style={[styles.pickerContainer, { backgroundColor: primaryColor }]}>
                    <Picker
                      selectedValue={cardType}
                      onValueChange={(value) => setCardType(value as 'visa' | 'mastercard')}
                      style={{ color: textColor }}
                      dropdownIconColor={textColor}
                    >
                      <Picker.Item label='Visa' value='visa' />
                      <Picker.Item label='Mastercard' value='mastercard' />
                    </Picker>
                  </View>

                  {/* Card Holder Name */}
                  <ThemedText style={{marginTop: 15, marginBottom: 10, opacity: 0.7}}>Card Holder Name:</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: primaryColor, color: textColor }]}
                    value={cardHolderName}
                    onChangeText={setCardHolderName}
                    placeholder='John Doe'
                    placeholderTextColor='#888'
                  />

                  {/* Card Number */}
                  <ThemedText style={{marginTop: 15, marginBottom: 10, opacity: 0.7}}>Card Number:</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: primaryColor, color: textColor }]}
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    placeholder='1234 5678 9012 3456'
                    placeholderTextColor='#888'
                    keyboardType='number-pad'
                    maxLength={19}
                  />

                  {/* Expiration Date */}
                  <ThemedText style={{marginTop: 15, marginBottom: 10, opacity: 0.7}}>Expiration Date (MM/YY):</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: primaryColor, color: textColor }]}
                    value={expirationDate}
                    onChangeText={handleExpirationDateChange}
                    placeholder='12/25'
                    placeholderTextColor='#888'
                    keyboardType='number-pad'
                    maxLength={5}
                  />
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            {paymentType && (
              <View style={styles.modalFooter}>
                <Button
                  title='Save Payment Account'
                  type='primary'
                  onPress={handleSaveAccount}
                  buttonStyle={{ width: '100%' }}
                />
              </View>
            )}
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
    </Modal>
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
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    opacity: .6
  },
  paymentAccountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc4',
    marginBottom: 10,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc4',
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ccc4',
  },
  paymentTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 15,
  },
  pickerContainer: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc4',
    marginBottom: 15,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc4',
    padding: 12,
    fontSize: 14,
    fontFamily: 'Poppins',
  },
});
