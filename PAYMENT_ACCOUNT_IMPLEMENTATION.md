# Payment Account Management Implementation

## Overview
Complete payment account management system with GCash and Card support, integrated into the PaymentPortal component.

## Features Implemented

### 1. Payment Account Storage
- **File**: `utils/paymentAccounts.ts`
- **Storage**: AsyncStorage with key `@payment_accounts`
- **Types**: GCash and Card (Visa/Mastercard)

### 2. Payment Portal Component
- **File**: `app/account/paymentPortal.tsx`
- **Modal Wrapper**: Component wraps itself in a Modal (no need for parent Modal)
- **Props Interface**:
  ```typescript
  interface PaymentPortalProps {
    visible: boolean;              // Controls modal visibility
    onClose: () => void;           // Callback to close modal
    productName: string;
    productDescription?: string;
    price: string;
    onPaymentComplete?: () => void;
  }
  ```

### 3. Add Payment Account Modal
**Integrated directly in PaymentPortal component**

#### Payment Type Selection:
- **GCash**: Mobile wallet payment
- **Card**: Credit/Debit card (Visa/Mastercard)

#### GCash Form:
- Uses `ContactNumberField` component
- Area code selector (+63, +1, +44, +91)
- 10-digit contact number validation
- Format: `GCash - +63XXXXXXXXXX`

#### Card Form:
- **Card Type**: Visa or Mastercard (Picker)
- **Card Holder Name**: Text input
- **Card Number**: 16-digit formatted input (XXXX XXXX XXXX XXXX)
- **Expiration Date**: MM/YY format (auto-formatted)
- Format: `VISA - ****1234`

### 4. Payment Account Management

#### Display:
- Shows all saved payment accounts
- Visual selection with accent color border
- Icon indicators (wallet for GCash, card for Card)
- Delete button for each account

#### Selection:
- Tap to select payment method
- Selected account highlighted with accent border
- Auto-selects first account if available

#### Deletion:
- Confirmation dialog before deletion
- Updates selection if deleted account was selected
- Success feedback after deletion

### 5. Payment Flow

1. **User opens PaymentPortal** (set `visible={true}`)
2. **Modal slides up** with payment interface
3. **Loads existing payment accounts** from AsyncStorage
4. **User can**:
   - Select existing payment account
   - Add new payment account (GCash or Card)
   - Delete payment accounts
   - Close modal via close button
5. **Complete Payment**:
   - Validates payment account is selected
   - Shows confirmation with account details
   - Shows success message
   - Executes `onPaymentComplete` callback
   - **Automatically closes modal** via `onClose()`

### 6. Integration with ProUpgrade

**File**: `app/account/proUpgrade.tsx`

**Usage** (No parent Modal needed - component has its own):
```tsx
const [showPaymentPortal, setShowPaymentPortal] = useState(false);

<PaymentPortal
  visible={showPaymentPortal}
  onClose={() => setShowPaymentPortal(false)}
  productName="TaraG Pro"
  productDescription={`Get TaraG Pro for as low as ${TRAVELLER_PRO_PRICE}/month`}
  price={TRAVELLER_PRO_PRICE.toString()}
  onPaymentComplete={() => {
    updateSession({ user: { ...user, isProUser: true } });
  }}
/>
```

## Data Structures

### GCash Account
```typescript
{
  id: string;
  type: 'gcash';
  contactNumber: string;  // 10 digits
  areaCode: string;       // e.g., "63"
}
```

### Card Account
```typescript
{
  id: string;
  type: 'card';
  cardType: 'visa' | 'mastercard';
  cardHolderName: string;
  cardNumber: string;      // 16 digits (no spaces)
  expirationDate: string;  // MM/YY format
}
```

## Validation

### GCash:
- ✅ Contact number must be exactly 10 digits
- ✅ Area code required

### Card:
- ✅ All fields required
- ✅ Card number must be 16 digits
- ✅ Expiration date auto-formatted to MM/YY
- ✅ Card holder name required

## User Experience

### Visual Feedback:
- ✅ Selected account highlighted with accent color
- ✅ Icons for different payment types
- ✅ Success/error alerts for all actions
- ✅ Confirmation dialogs for destructive actions

### Form Handling:
- ✅ Auto-formatting for card number (spaces every 4 digits)
- ✅ Auto-formatting for expiration date (MM/YY)
- ✅ Input validation with clear error messages
- ✅ Back button to change payment type

### Modal UX:
- ✅ Slide-up animation
- ✅ Semi-transparent overlay
- ✅ Close button in header
- ✅ Scrollable content for long forms
- ✅ Fixed footer with save button

## AsyncStorage Keys

- `@payment_accounts`: Array of PaymentAccount objects

## Helper Functions

### `formatPaymentAccountDisplay(account: PaymentAccount): string`
- GCash: `"GCash - +63XXXXXXXXXX"`
- Card: `"VISA - ****1234"` or `"MASTERCARD - ****5678"`

### `savePaymentAccount(account: PaymentAccount): Promise<void>`
- Saves new payment account to AsyncStorage

### `getPaymentAccounts(): Promise<PaymentAccount[]>`
- Retrieves all payment accounts from AsyncStorage

### `deletePaymentAccount(accountId: string): Promise<void>`
- Removes payment account from AsyncStorage

## Security Notes

⚠️ **This is a simulated payment system**
- Card details are stored locally (not secure for production)
- No actual payment processing
- For production, integrate with real payment gateway (Stripe, PayPal, etc.)
- Never store full card details in production apps
- Use tokenization for card payments

## Future Enhancements

- [ ] Add CVV field for cards
- [ ] Integrate with real payment gateway
- [ ] Add payment history
- [ ] Support more payment methods (PayPal, bank transfer)
- [ ] Add default payment method selection
- [ ] Implement payment method verification
