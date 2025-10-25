import Button from '@/components/Button';
import ContactNumberField from '@/components/ContactNumberField';
import TextField from '@/components/TextField';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Header from '@/components/Header'; 
import BackButton from '@/components/custom/BackButton';
import GradientBlobs from '@/components/GradientBlobs';
import Switch from '@/components/Switch';
import { useSession } from '@/context/SessionContext';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import ProcessModal from '@/components/modals/ProcessModal';
import { checkAgencyIdExists, applyAsTourGuide } from '@/services/agencyApiService';

export default function TourGuideApplicationScreen() {
  const { session, updateSession } = useSession();
  const [agencyID, setAgencyID] = useState('');
  const [businessContactNumber, setBusinessContactNumber] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [areaCode, setAreaCode] = useState('+63');
  const [usePersonalContact, setUsePersonalContact] = useState(true);
  const [usePersonalEmail, setUsePersonalEmail] = useState(true);
  const [attachedDocuments, setAttachedDocuments] = useState<Array<{ name: string; uri: string; type?: string; size?: number }>>([]);
  const scrollRef = useRef<ScrollView>(null);
  
  // ProcessModal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalSuccessMessage, setModalSuccessMessage] = useState('');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  
  const accentColor = useThemeColor({}, 'accent');
  const textColor = useThemeColor({}, 'text');
  const secondaryColor = useThemeColor({}, 'secondary');

  const handlePickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newDocuments = result.assets.map((asset: any) => ({
          name: asset.name,
          uri: asset.uri,
          type: asset.mimeType,
          size: asset.size,
        }));
        setAttachedDocuments([...attachedDocuments, ...newDocuments]);
      }
    } catch (error) {
      console.error('Error picking documents:', error);
      Alert.alert('Error', 'Failed to pick documents');
    }
  };

  const handleRemoveDocument = (index: number) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newDocuments = [...attachedDocuments];
            newDocuments.splice(index, 1);
            setAttachedDocuments(newDocuments);
          },
        },
      ]
    );
  };

  const handleSendApplication = async () => {
    try {
      // Reset error message
      setErrorMsg('');

      // Validation
      if (!agencyID.trim()) {
        setErrorMsg('Please enter an Agency ID');
        return;
      }

      if (attachedDocuments.length === 0) {
        setErrorMsg('Please attach at least one document');
        return;
      }

      // Get contact number and email
      const finalContactNumber = usePersonalContact 
        ? session?.user?.contactNumber || '' 
        : `${areaCode}${businessContactNumber}`;
      
      const finalEmail = usePersonalEmail 
        ? session?.user?.email || '' 
        : businessEmail;

      if (!finalContactNumber) {
        setErrorMsg('Contact number is required');
        return;
      }

      if (!finalEmail) {
        setErrorMsg('Email is required');
        return;
      }

      if (!session?.accessToken) {
        setErrorMsg('Authentication required. Please log in again.');
        return;
      }

      // Show loading modal
      setModalVisible(true);
      setModalSuccess(false);
      setModalSuccessMessage('');
      setModalErrorMessage('');
      setLoading(true);

      // Step 1: Check if agency ID exists
      console.log('🔍 Checking if agency exists:', agencyID);
      const agencyCheck = await checkAgencyIdExists(agencyID.trim(), session.accessToken);

      if (!agencyCheck.exists) {
        setLoading(false);
        setModalSuccess(false);
        setModalErrorMessage('Agency ID does not exist. Please check and try again.');
        return;
      }

      console.log('✅ Agency found:', agencyCheck.agency?.name);

      // Step 2: Submit application
      console.log('📤 Submitting tour guide application...');
      const result = await applyAsTourGuide(
        agencyID.trim(),
        finalContactNumber,
        finalEmail,
        attachedDocuments,
        session.accessToken
      );

      // Step 3: Update session context
      if (session.user) {
        await updateSession({
          user: {
            ...session.user,
            type: 'tourGuide',
            agency: {
              agencyID: agencyID.trim(),
              businessContactNumber: finalContactNumber,
              businessEmail: finalEmail,
              documents: attachedDocuments.map(doc => doc.uri),
              permissions: 'applicant',
              role: 'tourGuide',
            },
          },
        });
      }

      setLoading(false);
      setModalSuccess(true);
      setModalSuccessMessage(`Application sent successfully to ${agencyCheck.agency?.name}!`);
      
      console.log('✅ Application submitted successfully');
    } catch (error: any) {
      console.error('❌ Error sending application:', error);
      setLoading(false);
      setModalSuccess(false);
      setModalErrorMessage(error.message || 'Failed to send application. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, width: '100%' }}
    >
      <ThemedView>
        <GradientBlobs/>
        <ScrollView
          ref={scrollRef}
          style={{ width: '100%', zIndex: 2,height: '100%' }}
          contentContainerStyle={{ paddingBottom: 30 }}
          keyboardShouldPersistTaps="handled"
        >
          <BackButton type='floating'/>
          <View style={{ padding: 16, paddingTop: 60 }}>
            <ThemedText type='title'>Join an Agency</ThemedText>
            <ThemedText style={{ marginBottom: 20, marginTop: 8 }}>
              Fill up the form and join our vast network of agencies
            </ThemedText>

            {errorMsg ? (
              <ThemedText type='error'>{errorMsg}</ThemedText>
            ) : null}

            <TextField
              placeholder="Enter Agency ID"
              value={agencyID}
              onChangeText={setAgencyID}
              autoCapitalize="none"
            />

            

            {!usePersonalContact ? (
              <ContactNumberField
                areaCode={areaCode}
                onAreaCodeChange={setAreaCode}
                number={businessContactNumber}
                onNumberChange={setBusinessContactNumber}
                placeholder="Business Contact Number"
              />
            ):(
              <Switch
                label="Use personal contact number instead"
                description={usePersonalContact ? session?.user?.contactNumber || 'No contact number' : undefined}
                value={usePersonalContact}
                onValueChange={setUsePersonalContact}
              />
            )}

            {!usePersonalEmail ? (
              <TextField
                placeholder="Business Email"
                value={businessEmail}
                onChangeText={setBusinessEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ): (
              <Switch
                label="Use personal email instead"
                description={usePersonalEmail ? session?.user?.email || 'No email' : undefined}
                value={usePersonalEmail}
                onValueChange={setUsePersonalEmail}
              />
            )}

            <View style={styles.documentSection}>
              <ThemedText type='subtitle'>Attach Documents</ThemedText>
              <ThemedText style={{fontSize: 12, opacity: 0.7}}>Suggested Documents: Resume, Government-Issued ID, DTI Permit</ThemedText>
              <ThemedText style={{fontSize: 12, opacity: 0.5}}>Accepted Format: PNG/ JPG/ PDF</ThemedText>
              <TouchableOpacity
                style={[styles.attachButton, { borderColor: accentColor }]}
                onPress={handlePickDocuments}
              >
                <Ionicons name="attach" size={20} color={accentColor} />
                <ThemedText style={[styles.attachButtonText, { color: accentColor }]}>
                  Attach Documents
                </ThemedText>
              </TouchableOpacity>

              {attachedDocuments.length > 0 && (
                <View style={styles.documentsContainer}>
                  {attachedDocuments.map((doc, index) => (
                    <View key={index} style={[styles.documentItem, { borderColor: secondaryColor }]}>
                      <View style={styles.documentInfo}>
                        <Ionicons name="document" size={16} color={textColor} />
                        <ThemedText style={styles.documentName} numberOfLines={1}>
                          {doc.name}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveDocument(index)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close-circle" size={20} color="#ff4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <Button
              title={loading ? 'Sending Application...' : 'Send Application'}
              onPress={handleSendApplication}
              type="primary"
              buttonStyle={{ width: '100%', marginTop: 16 }}
              loading={loading}
            />
          </View>
          
        </ScrollView>
      </ThemedView>

      <ProcessModal
        visible={modalVisible}
        success={modalSuccess}
        successMessage={modalSuccessMessage}
        errorMessage={modalErrorMessage}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  documentSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  documentLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    gap: 8,
  },
  attachButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  documentsContainer: {
    marginTop: 12,
    gap: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  documentName: {
    fontSize: 13,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
});