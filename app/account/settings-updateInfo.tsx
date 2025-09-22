import { ThemedText } from "@/components/ThemedText";
import { TouchableOpacity } from "react-native";
import { useSession } from "@/context/SessionContext";
import { ThemedIcons } from "@/components/ThemedIcons";
import Button from "@/components/Button";
import { StyleSheet, View, Alert } from "react-native";
import { useState, useEffect } from "react";
import InputModal from "@/components/modals/InputModal";

import { batchUpdateUserInfo, canUpdateUserInfo } from "@/services/userApiService";
import Header from "@/components/Header";
import { ThemedView } from "@/components/ThemedView";


export default function UpdateInfoSettings() {
  const { session, updateSession } = useSession();
  const user = session?.user;
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    fieldName: string;
    label: string;
    type: 'text' | 'contactNumber';
    currentValue: string;
  } | null>(null);
  
  // Temporary updated values
  const [tempUpdates, setTempUpdates] = useState<Record<string, string>>({});
  
  // Update cooldown states
  const [canUpdate, setCanUpdate] = useState(true);
  const [nextUpdateDate, setNextUpdateDate] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check update eligibility on component mount
  useEffect(() => {
    const checkUpdateEligibility = async () => {
      if (!user?.id) return;
      
      try {
        const result = await canUpdateUserInfo(user.id);
        setCanUpdate(result.canUpdate);
        setNextUpdateDate(result.nextUpdateDate || null);
        setDaysRemaining(result.daysRemaining || 0);
      } catch (error) {
        console.error('Error checking update eligibility:', error);
      }
    };
    
    checkUpdateEligibility();
  }, [user?.id]);
  
  const openModal = (fieldName: string, label: string, type: 'text' | 'contactNumber', currentValue: string) => {
    setModalConfig({ fieldName, label, type, currentValue });
    setShowModal(true);
  };
  
  const handleModalSubmit = (value: string | { areaCode: string; number: string }) => {
    if (!modalConfig) return;
    
    let finalValue: string;
    if (typeof value === 'string') {
      finalValue = value;
    } else {
      finalValue = `${value.areaCode}${value.number}`;
    }
    
    setTempUpdates(prev => ({
      ...prev,
      [modalConfig.fieldName]: finalValue
    }));
    
    setShowModal(false);
    setModalConfig(null);
  };
  
  const handleUpdate = async () => {
    if (!user || !session?.accessToken) {
      Alert.alert('Error', 'Please log in again');
      return;
    }
    
    if (!canUpdate) {
      Alert.alert('Update Restricted', `You can update your information again in ${daysRemaining} days.`);
      return;
    }
    
    const updates = Object.entries(tempUpdates);
    if (updates.length === 0) {
      Alert.alert('No Changes', 'No fields have been modified');
      return;
    }
    
    // Filter out unchanged values
    const filteredUpdates: Record<string, string> = {};
    updates.forEach(([fieldName, newValue]) => {
      const currentValue = (user as any)[fieldName] || '';
      if (newValue !== currentValue) {
        filteredUpdates[fieldName] = newValue;
      }
    });
    
    if (Object.keys(filteredUpdates).length === 0) {
      Alert.alert('No Changes', 'No fields have been modified');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Batch update all fields at once
      await batchUpdateUserInfo(user.id, filteredUpdates, session.accessToken);
      
      // Update session with new values
      const updatedUser = { ...user };
      Object.entries(filteredUpdates).forEach(([fieldName, value]) => {
        (updatedUser as any)[fieldName] = value;
      });
      
      await updateSession({ user: updatedUser });
      setTempUpdates({});
      
      // Update cooldown state
      setCanUpdate(false);
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 14);
      setNextUpdateDate(nextDate);
      setDaysRemaining(14);
      
      Alert.alert('Success', 'Profile updated successfully! You can update again in 14 days.');
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get display value (temp update or current value)
  const getDisplayValue = (fieldName: string, currentValue: string) => {
    return tempUpdates[fieldName] || currentValue || '';
  };
  
  return(
    <ThemedView style={{flex: 1}}>
      <InputModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setModalConfig(null);
        }}
        onSubmit={handleModalSubmit}
        label={modalConfig?.label || ''}
        description="Enter the new value for this field"
        type={modalConfig?.type || 'text'}
        initialValue={modalConfig?.currentValue || ''}
      />
      <Header label="Update my Information"/>
      <View style={{padding: 20}}>
        <ThemedText style={{ opacity: .5 }}>
            {canUpdate 
            ? 'Once you update your information, you will not be able to change it again for 14 days'
            : `You can update your information again in ${daysRemaining} days${nextUpdateDate ? ` (${nextUpdateDate.toLocaleDateString()})` : ''}`
            }
        </ThemedText>

        <View key="fname" style={styles.infoRow}>
            <ThemedText>First Name: {getDisplayValue('fname', user?.fname || '')}</ThemedText>
            <TouchableOpacity 
            style={styles.editButton}
            onPress={() => openModal('fname', 'Update First Name', 'text', user?.fname || '')}
            >
                <ThemedIcons library='MaterialDesignIcons' name='pencil' size={15} color='#ccc'/>
                <ThemedText style={{opacity: 0.5}}>Update</ThemedText>
            </TouchableOpacity>
        </View>

        <View key="mname" style={styles.infoRow}>
        <ThemedText>Middle Name: {getDisplayValue('mname', user?.mname || '')}</ThemedText>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => openModal('mname', 'Update Middle Name', 'text', user?.mname || '')}
        >
            <ThemedIcons library='MaterialDesignIcons' name='pencil' size={15} color='#ccc'/>
            <ThemedText style={{opacity: 0.5}}>Update</ThemedText>
        </TouchableOpacity>
        </View>

        <View key="lname" style={styles.infoRow}>
        <ThemedText>Last Name: {getDisplayValue('lname', user?.lname || '')}</ThemedText>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => openModal('lname', 'Update Last Name', 'text', user?.lname || '')}
        >
            <ThemedIcons library='MaterialDesignIcons' name='pencil' size={15} color='#ccc'/>
            <ThemedText style={{opacity: 0.5}}>Update</ThemedText>
        </TouchableOpacity>
        </View>

        <View key="contact" style={styles.infoRow}>
        <ThemedText>Contact Number: {getDisplayValue('contactNumber', user?.contactNumber || '')}</ThemedText>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => openModal('contactNumber', 'Update Contact Number', 'contactNumber', user?.contactNumber || '')}
        >
            <ThemedIcons library='MaterialDesignIcons' name='pencil' size={15} color='#ccc'/>
            <ThemedText style={{opacity: 0.5}}>Update</ThemedText>
        </TouchableOpacity>
        </View>

        <Button
          key="updateButton"
          title={isLoading ? 'Updating...' : 'Update'}
          type='primary'
          onPress={handleUpdate}
          disabled={!canUpdate || isLoading || Object.keys(tempUpdates).length === 0}
          buttonStyle={{
            width: '100%',
            marginTop: 20,
            marginBottom: 15,
            opacity: (!canUpdate || isLoading || Object.keys(tempUpdates).length === 0) ? 0.5 : 1,
          }}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
});