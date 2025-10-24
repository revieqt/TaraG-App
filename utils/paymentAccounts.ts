import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GCashAccount {
  id: string;
  type: 'gcash';
  contactNumber: string;
  areaCode: string;
}

export interface CardAccount {
  id: string;
  type: 'card';
  cardType: 'visa' | 'mastercard';
  cardHolderName: string;
  cardNumber: string;
  expirationDate: string;
}

export type PaymentAccount = GCashAccount | CardAccount;

const PAYMENT_ACCOUNTS_KEY = '@payment_accounts';

export const savePaymentAccount = async (account: PaymentAccount): Promise<void> => {
  try {
    const existingAccounts = await getPaymentAccounts();
    const updatedAccounts = [...existingAccounts, account];
    await AsyncStorage.setItem(PAYMENT_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
  } catch (error) {
    console.error('Error saving payment account:', error);
    throw error;
  }
};

export const getPaymentAccounts = async (): Promise<PaymentAccount[]> => {
  try {
    const accountsJson = await AsyncStorage.getItem(PAYMENT_ACCOUNTS_KEY);
    return accountsJson ? JSON.parse(accountsJson) : [];
  } catch (error) {
    console.error('Error getting payment accounts:', error);
    return [];
  }
};

export const deletePaymentAccount = async (accountId: string): Promise<void> => {
  try {
    const existingAccounts = await getPaymentAccounts();
    const updatedAccounts = existingAccounts.filter(acc => acc.id !== accountId);
    await AsyncStorage.setItem(PAYMENT_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
  } catch (error) {
    console.error('Error deleting payment account:', error);
    throw error;
  }
};

export const formatPaymentAccountDisplay = (account: PaymentAccount): string => {
  if (account.type === 'gcash') {
    return `GCash - +${account.areaCode}${account.contactNumber}`;
  } else {
    const lastFour = account.cardNumber.slice(-4);
    return `${account.cardType.toUpperCase()} - ****${lastFour}`;
  }
};
