
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import Button from "@/components/Button";
import { ThemedIcons } from "@/components/ThemedIcons";
import { StyleSheet, View } from "react-native";
import { useSession } from "@/context/SessionContext";
import { TRAVELLER_PRO_PRICE } from "@/constants/Config";
import { router } from "expo-router";

const ProUpgrade = () => {
    const { session } = useSession();

    const user = session?.user;
    return(
        <>
            <ThemedView color='primary' shadow style={styles.proContainer}>
            {!user?.isProUser ? (
                <>
                <ThemedText type='subtitle' style={{fontSize: 17, color: 'skyblue'}}>Basic Traveler</ThemedText>
                <ThemedText style={{textAlign: 'center', opacity: .5, marginBottom: 10}}>Unlock the full TaraG experience. 
                    {/* Get TaraG Pro for as low as ${TRAVELLER_PRO_PRICE}/month */}
                    </ThemedText>
                <Button
                    title='Get TaraG Pro'
                    type='primary'
                    onPress={() => router.push('/account/paymentPortal')}
                    buttonStyle={{
                    width: '100%',
                    marginBottom: 15,
                    }}
                />
                </>
            ) : (
                <>
                <ThemedText type='subtitle' style={{fontSize: 17, color: 'orange'}}>Pro User</ThemedText>
                <ThemedText style={{textAlign: 'center', opacity: .5, marginBottom: 10}}>You have access to all features. Thank you for supporting TaraG!</ThemedText>
                </>
            )}
            <View style={styles.featuresContainer}>
                <ThemedIcons library='MaterialDesignIcons' name='robot-excited' size={20}/>
                <ThemedText>Extended TaraAI Conversations</ThemedText>
            </View>
        
            <View style={styles.featuresContainer}>
                <ThemedIcons library='MaterialIcons' name='app-blocking' size={20}/>
                <ThemedText>Enjoy TaraG Ads Free</ThemedText>
            </View>
        
            <View style={styles.featuresContainer}>
                <ThemedIcons library='MaterialDesignIcons' name='trophy-award' size={20}/>
                <ThemedText>Exclusive Pro Traveller Badge</ThemedText>
            </View>
            </ThemedView>
        </>
    )
}

export default ProUpgrade;

// Keep named export for backward compatibility
export const renderProUpgrade = ProUpgrade;

const styles = StyleSheet.create({
    proContainer:{
        width: '100%',
        padding: 16,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    featuresContainer: {
        flexDirection: 'row',
        padding: 5,
        width: '100%',
        gap: 20,
        alignItems: 'center',
    },
  });
