# PaymentPortal Component Usage

## Component Props

```typescript
interface PaymentPortalProps {
  visible: boolean;              // Required: Controls modal visibility
  onClose: () => void;           // Required: Callback to close the modal
  productName: string;           // Required: Name of the product
  productDescription?: string;   // Optional: Description of the product
  price: string;                 // Required: Price as string (e.g., "4.99")
  onPaymentComplete?: () => void; // Optional: Callback function after successful payment
}
```

## Usage Examples

### Basic Usage
```tsx
import PaymentPortal from '@/app/account/paymentPortal';
import { useState } from 'react';

const MyComponent = () => {
  const [showPayment, setShowPayment] = useState(false);

  return (
    <>
      <Button onPress={() => setShowPayment(true)}>Buy Now</Button>
      
      <PaymentPortal 
        visible={showPayment}
        onClose={() => setShowPayment(false)}
        productName="Premium Subscription" 
        productDescription="Access to all premium features" 
        price="4.99" 
        onPaymentComplete={() => {
          console.log('Payment completed!');
        }}
      />
    </>
  );
};
```

### With Custom Callback
```tsx
const [showPayment, setShowPayment] = useState(false);

<PaymentPortal 
  visible={showPayment}
  onClose={() => setShowPayment(false)}
  productName="Travel Package" 
  productDescription="3-day tour to Cebu" 
  price="299.99" 
  onPaymentComplete={() => {
    // Update user state
    updateSession({ user: { ...user, isPremium: true } });
    
    // Navigate to success screen
    router.push('/success');
    
    // Show notification
    Alert.alert('Success', 'You are now a premium member!');
  }}
/>
```

### Without Description
```tsx
const [showPayment, setShowPayment] = useState(false);

<PaymentPortal 
  visible={showPayment}
  onClose={() => setShowPayment(false)}
  productName="One-time Payment" 
  price="9.99" 
  onPaymentComplete={() => {
    // Handle payment completion
  }}
/>
```

### Minimal Usage (No Callback)
```tsx
const [showPayment, setShowPayment] = useState(false);

<PaymentPortal 
  visible={showPayment}
  onClose={() => setShowPayment(false)}
  productName="test" 
  productDescription="test" 
  price="4.99" 
/>
```

## Features

✅ **Flexible Props**: All props are typed and validated
✅ **Optional Callback**: `onPaymentComplete` is optional - component works without it
✅ **Price Formatting**: Automatically formats price to 2 decimal places
✅ **Payment Confirmation**: Shows confirmation dialog before processing
✅ **Success Feedback**: Displays success message after payment
✅ **Auto Navigation**: Automatically navigates back after completion
✅ **Themed UI**: Fully integrated with app's theming system

## Payment Flow

1. User views product details and price
2. User clicks "Complete Payment" button
3. Confirmation dialog appears
4. User confirms payment
5. Success message is shown
6. `onPaymentComplete` callback is executed (if provided)
7. Screen navigates back automatically
