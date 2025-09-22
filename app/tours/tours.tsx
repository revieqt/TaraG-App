import React from "react";
import { View, StyleSheet } from "react-native";
import Carousel from '@/components/Carousel';
import TextField from '@/components/TextField';

export default function ToursSection(){
  return (
    <>
    <View style={styles.carouselContainer}>
        <Carousel
          images={[
            'https://scontent.fceb3-1.fna.fbcdn.net/v/t39.30808-6/481925042_1058188923004845_1719553000271680775_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeH6KVqdbWNIBeuCANlStG2GGpV19-A21B0alXX34DbUHWDqX99QWlZ9gKJ8sbsL3j_QAGDVmlZ6J8H62ZkJ8pCN&_nc_ohc=UNystwMfczYQ7kNvwGw_4jn&_nc_oc=AdmVL5dY_cd8OnovDBVZZUkBVzyVh9SnnoumlEr5IUTqKZUIK7ya7z_YmFbJA-XEd_I&_nc_zt=23&_nc_ht=scontent.fceb3-1.fna&_nc_gid=aZFwUY7uXbmujxTFtITPcg&oh=00_AfYbHR1Rq-UdXK3pFpV7KsrrvLWFBsS24G9tn8giGU8vxg&oe=68D69479', 
            'https://scontent.fceb9-1.fna.fbcdn.net/v/t39.30808-6/300695256_621320363028355_910404220287332843_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFAf_a1e8sXzgmaaSWeERo_Hazek1R7MWYdrN6TVHsxZiGelmPX-EtOZS8HWzBwAvhWOhUYHjzyeQXuG0MssIJy&_nc_ohc=LNeSMfbTbpMQ7kNvwGqPWcr&_nc_oc=AdkVspznP2s9J-CwhZYkf49xBot3kYCvTMHm0pxSmO2FPvrN_Np9lD5dYfU5ze1Yqu8&_nc_zt=23&_nc_ht=scontent.fceb9-1.fna&_nc_gid=9tYS_4sTY7SyNEdTLT-N9Q&oh=00_AfYsX7ndsfcgBOQkKW_juw3-oqpix3Y2WnVl4YVCkNXtiQ&oe=68D6B644',
            'https://scontent.fceb3-1.fna.fbcdn.net/v/t1.6435-9/51441804_2258917914139788_8538702684495020032_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeFqAUmCxLfwDjtLiLgKhWDPVd7DJJX6jitV3sMklfqOK0ffGSLscR8uYdT4o5zAefJl-InTyzrMPO1TdU_0NHXE&_nc_ohc=decouDG6yIQQ7kNvwGxGVK2&_nc_oc=Admd1MXakUUwOxuuadSb1NiCZ7MyQLwb-7AM-P3moY_T4XDto20YdFryIEsLpRakpsM&_nc_zt=23&_nc_ht=scontent.fceb3-1.fna&_nc_gid=q1jp_lJUXtPPyF8WDOEr-A&oh=00_AfbFeKwFAyAJvjSClT7ZVfOShMwVY4AFfM79lWOMHg_CXg&oe=68F83323'
          ]}
          titles={['Anjo World Cebu', 'Moalboal Beach Invasion', 'Cebu Historical Tour']}
          subtitles={['Enjoy the first world-class theme park in the Visayas', 
            'Explore the beauty of Moalboal', 
            'Discover the rich history of Cebu']}
          buttonLabels={['View Tour', 'View Tour','View Tour']}
          buttonLinks={[() => alert('Next'), () => alert('Done'), () => alert('Done')]}
          darkenImage
          navigationArrows
        />
      </View>

      <View style={styles.options}>
        <View style={{flex: 1}}>
          <TextField
          placeholder="Search groups..."
          value={''}
          onChangeText={() => {}}
          onFocus={() => {}}
          onBlur={() => {}}
          isFocused={false}
          autoCapitalize="none"
          />
        </View>
      </View>   
    </>
  );
};

const styles = StyleSheet.create({
    options:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        margin: 20,
    },
    carouselContainer:{
        width: '100%',
        height: 320,
    },
});
