import Button from '@/components/Button';
import Carousel from '@/components/Carousel';
import { BackButton } from '@/components/custom/BackButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';



export default function TourView() {
  const params = useLocalSearchParams();
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ThemedView style={{flex: 1}}>
      <BackButton type='floating' />
      <View>
        <View style={styles.carouselContainer}>
          <Carousel
            images={[
              'https://www.google.com/url?sa=i&url=https%3A%2F%2Fguidetothephilippines.ph%2Farticles%2Fultimate-guides%2Fmoalboal-cebu-travel-guide&psig=AOvVaw3jUD5NYjBB0sxZgsgkYQCD&ust=1758588734763000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCMD7qtmT648DFQAAAAAdAAAAABAE', 
              'gs://taralets-3adb8.firebasestorage.app/tours/basilica.jpg',
              'gs://taralets-3adb8.firebasestorage.app/tours/fuente.jpg'
            ]}
            navigationArrows
          />
        </View>

        <View style={styles.headerContent}>
          <LinearGradient
            colors={['transparent', backgroundColor]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradientOverlay}
            pointerEvents="none"
          />
          
          
        </View>
      </View>

      <View style={{margin:20}}>
        <View style={styles.textContainer}>
          <ThemedText type='title'>
            Tour TItle here
          </ThemedText>
          <ThemedText type='defaultSemiBold' style={{opacity: 0.7}}>Welcome to TaraG!</ThemedText>
        </View>
        <ThemedView style={styles.agencyContainer}>
          <ThemedText type='defaultSemiBold'>Agency Name</ThemedText>
          <ThemedText>Agency Name</ThemedText>
        </ThemedView>
      </View>
      
      
      <ThemedView color='primary' shadow style={styles.bookButtonContainer}>
        <View style={{flex: 1}}>
          <ThemedText type='subtitle'>$100.00</ThemedText>
          <ThemedText style={{opacity: 0.5}}>per person</ThemedText>
        </View>
        <Button
          title="Book"
          onPress={() => {}}
          type="primary"
          buttonStyle={{flex: 1}}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    width: '100%',
    height: 250,
    borderBottomLeftRadius: 200,
    overflow: 'hidden',
  },
  headerContent: {
    overflow: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
    padding: 20,
    zIndex: 3,
    pointerEvents: 'box-none', // This allows touches to pass through except for the actual content
  },
  textContainer: {
    zIndex: 3,
    pointerEvents: 'box-none',
  },
  gradientOverlay: {
    height: 150,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    pointerEvents: 'none', // Allow touches to pass through to map
  },
  bookButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  agencyContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    zIndex: 100,
  },
});