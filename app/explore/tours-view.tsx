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
              'https://scontent.fceb3-1.fna.fbcdn.net/v/t39.30808-6/538287052_640597579089569_295885445416347281_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeHzobkTiFqG366kjW3egNIKYOy2-iXpenZg7Lb6Jel6dhN9OdRajCf2Vg6lBkpkhwFxPiwcR-4Qza5va6qonuHK&_nc_ohc=yYyv7nky0zoQ7kNvwGkj0Zl&_nc_oc=AdnLi8hmYoE9gILiE_savI_7teWdDLZg9lstw297nrTexeW66WNxhVnJHL7ELMOGgJI&_nc_zt=23&_nc_ht=scontent.fceb3-1.fna&_nc_gid=l9V7l8PgHfg9mPH3h9g00A&oh=00_AfVWFLIdDM-c4VaBohWb73xtjQkT3kcCCtiPbXzps19YPQ&oe=68B86435', 
              'https://scontent.fceb9-1.fna.fbcdn.net/v/t39.30808-6/527495542_623044884178172_2105755532645257880_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeFF3UqDwUsXzdpqcCxuYlqYLCEBkEEeRhYsIQGQQR5GFth6WBVe6MZ7D64MNAMu9ZaBzxz6a4A_fT-dkR1h-_Ks&_nc_ohc=9hKLBa_CYdEQ7kNvwFwwE6Q&_nc_oc=AdlbIjLg3P1xp7m5TEVLtSYW7S6AsGw6qTlEfdgQM3wxCFxYvw1Rv9YbiZpWoWNED7Q&_nc_zt=23&_nc_ht=scontent.fceb9-1.fna&_nc_gid=msOZePLq6CW-z9m_GEZoLw&oh=00_AfVDgTnSWOpydFJ23kvnusacLbA1Cv44PqB96Lgmc5lpcg&oe=68B88292',
              'https://scontent.fceb9-1.fna.fbcdn.net/v/t39.30808-6/506441581_584094611406533_1072900559871384123_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeEtoZq0Dv4VhuTKmKyJK52cmOP4GztRwN2Y4_gbO1HA3TBK8fGIxR6Julvv-BHnQ4n_1OLfQbMjE4abPk3WXcjv&_nc_ohc=0P9rrdvZS9AQ7kNvwGQogA-&_nc_oc=Adkiq6z3y4u8CJUHbMZ-09r8V9AGBOJ4f_6mi1buhKu7e_PgFmPePNQI5tIDHVe348g&_nc_zt=23&_nc_ht=scontent.fceb9-1.fna&_nc_gid=xK0JSBlj5uHsoyUsPKpPdA&oh=00_AfWtaVtyYM7wflgg7nUgtzZ7o-OWAJTJNqhoglw24V5UOQ&oe=68B8797C'
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