import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from "react-native";
import axios from "axios";
import { WebView } from "react-native-webview";

const PaymentScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const handlePayment = async (method: "card" | "gcash" | "paymaya") => {
    try {
      setLoading(true);

      const response = await axios.post("http://YOUR_BACKEND_URL/api/payments/create", {
        amount: 100, // in PHP (your app can make this dynamic)
        currency: "PHP",
        email: "user@example.com",
        method, // chosen payment method
      });

      if (response.data.success) {
        setCheckoutUrl(response.data.checkoutUrl);
      } else {
        Alert.alert("Payment Failed", response.data.message || "Something went wrong");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "Unable to process payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Payment Method</Text>

      {/* Card Payment */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#4A90E2" }]}
        onPress={() => handlePayment("card")}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pay with Card</Text>
        )}
      </TouchableOpacity>

      {/* GCash Payment */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#00BFA5" }]}
        onPress={() => handlePayment("gcash")}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pay with GCash</Text>
        )}
      </TouchableOpacity>

      {/* PayMaya Payment */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#FF7043" }]}
        onPress={() => handlePayment("paymaya")}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pay with PayMaya</Text>
        )}
      </TouchableOpacity>

      {/* WebView Modal */}
      <Modal visible={!!checkoutUrl} animationType="slide">
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setCheckoutUrl(null)}
          >
            <Text style={styles.closeText}>✕ Close</Text>
          </TouchableOpacity>

          {checkoutUrl && <WebView source={{ uri: checkoutUrl }} />}
        </View>
      </Modal>
    </View>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 30,
    color: "#333",
  },
  button: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    padding: 15,
    backgroundColor: "#E53935",
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
