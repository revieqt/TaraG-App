import { ThemedText } from "@/components/ThemedText";
import Switch from "@/components/Switch";
import { useSession } from "@/context/SessionContext";
import {  View, Alert } from "react-native";

import { updateUserBooleanField } from "@/services/userApiService";
import { ThemedView } from "@/components/ThemedView";
import Header from "@/components/Header";


export default function VisibilitySettings() {
    const { session, updateSession } = useSession();
    const user = session?.user;
    const accessToken = session?.accessToken;

    const handleVisibilityChange = async (fieldName: string, value: boolean) => {
        if (!user?.id || !accessToken) {
            Alert.alert('Error', 'Please log in again');
            return;
        }

        try {
            // Update backend
            await updateUserBooleanField(user.id, fieldName, value, accessToken);
            
            // Update session context
            const updatedUser = {
                ...user,
                publicSettings: {
                    ...user.publicSettings,
                    [fieldName.split('.')[1]]: value
                }
            };
            
            await updateSession({ user: updatedUser });
            
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update setting');
        }
    };

    return(
        <ThemedView style={{flex: 1}}>
            <Header label="Profile Visibility"/>
            <View style={{padding: 20, gap: 10}}>
                <ThemedText>Control who can see your profile</ThemedText>

                <Switch
                    key="private"
                    label="Public Visibility"
                    description={user?.publicSettings?.isProfilePublic ? 'Public' : 'Private'}
                    value={user?.publicSettings?.isProfilePublic || false}
                    onValueChange={(value) => handleVisibilityChange('publicSettings.isProfilePublic', value)}
                />

                <View style={user?.publicSettings?.isProfilePublic ? {gap: 10} : {opacity: 0.5, pointerEvents: 'none', gap: 10}}>
                    <Switch
                    key="personal"
                    label="Show Personal Info"
                    description={user?.publicSettings?.isPersonalInfoPublic ? 'Public' : 'Hidden'}
                    value={user?.publicSettings?.isPersonalInfoPublic || false}
                    onValueChange={(value) => handleVisibilityChange('publicSettings.isPersonalInfoPublic', value)}
                    />
                    <Switch
                    key="travel"
                    label="Show Travel Info"
                    description={user?.publicSettings?.isTravelInfoPublic ? 'Public' : 'Hidden'}
                    value={user?.publicSettings?.isTravelInfoPublic || false}
                    onValueChange={(value) => handleVisibilityChange('publicSettings.isTravelInfoPublic', value)}
                    />
                </View>
            </View>
        </ThemedView>
    );
}