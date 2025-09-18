// import React, { useState, useEffect } from 'react';
// import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
// import { ThemedIcons } from '@/components/ThemedIcons';
// import { ThemedView } from '@/components/ThemedView';
// import { ThemedText } from '@/components/ThemedText';
// import HorizontalSections from '@/components/HorizontalSections';
// // import { getAlerts } from '@/services/alertsApiService';
// import { useLocation } from '@/hooks/useLocation';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // Use the Alert type from the service
// type Alert = {
//   id: string;
//   title: string;
//   description: string;
//   severity: 'low' | 'medium' | 'high';
//   startOn: Date;
//   endOn: Date;
//   locations: string[];
//   createdOn?: Date;
// };

// interface AlertsContainerProps {
//   children?: React.ReactNode;
// }

// const AlertsContainer: React.FC<AlertsContainerProps> = ({
//   children,
// }) => {
//   const [hideAlert, setHideAlert] = useState(false);
//   const [alerts, setAlerts] = useState<Alert[]>([]);
//   const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());
//   const [loading, setLoading] = useState(true);
//   const location = useLocation();

//   const READ_ALERTS_KEY = '@TaraG:readAlerts';

//   // Load read alerts from storage
//   useEffect(() => {
//     const loadReadAlerts = async () => {
//       try {
//         const stored = await AsyncStorage.getItem(READ_ALERTS_KEY);
//         if (stored) {
//           setReadAlerts(new Set(JSON.parse(stored)));
//         }
//       } catch (error) {
//         console.error('Error loading read alerts:', error);
//       }
//     };
//     loadReadAlerts();
//   }, []);

//   // Fetch alerts when location is available
//   useEffect(() => {
//     const fetchAlerts = async () => {
//       console.log('Location data:', location);
//       if (!location || location.loading || !location.latitude || !location.longitude) {
//         console.log('Location not ready or missing coordinates');
//         return;
//       }
      
//       try {
//         setLoading(true);
//         const locationData = {
//           latitude: location.latitude,
//           longitude: location.longitude,
//           suburb: location.suburb || '',
//           city: location.city || '',
//           state: location.state || '',
//           region: location.region || '',
//           country: location.country || '',
//         };
//         console.log('Location data for API:', locationData);
//         const alertsData = await getAlerts(locationData);
//         console.log('Fetched alerts:', alertsData);
//         setAlerts(alertsData as Alert[]);
//       } catch (error) {
//         console.error('Error fetching alerts:', error);
//         setAlerts([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAlerts();
//   }, [location]);

//   // Save read alerts to storage
//   const markAlertAsRead = async (alertId: string) => {
//     const newReadAlerts = new Set([...readAlerts, alertId]);
//     setReadAlerts(newReadAlerts);
//     try {
//       await AsyncStorage.setItem(READ_ALERTS_KEY, JSON.stringify([...newReadAlerts]));
//     } catch (error) {
//       console.error('Error saving read alerts:', error);
//     }
//   };

//   const hasUnreadAlerts = alerts.some(alert => !readAlerts.has(alert.id));
//   const hasAlerts = alerts.length > 0;

//   console.log('AlertsContainer state:', {
//     alertsCount: alerts.length,
//     hasAlerts,
//     hasUnreadAlerts,
//     loading,
//     readAlertsCount: readAlerts.size
//   });

//   // Don't render if no alerts
//   if (!hasAlerts && !loading) {
//     console.log('No alerts, hiding container');
//     return <>{children}</>;
//   }

//   const renderAlertCard = (alert: Alert) => (
//     <ThemedView key={alert.id} style={styles.alertCard} shadow>
//       <TouchableOpacity 
//         onPress={() => markAlertAsRead(alert.id)}
//         style={styles.alertCardContent}
//       >
//         <View style={styles.alertHeader}>
//           <ThemedText style={styles.alertTitle}>{alert.title}</ThemedText>
//           <View style={[
//             styles.severityIndicator,
//             { backgroundColor: getSeverityColor(alert.severity) }
//           ]} />
//         </View>
//         <ThemedText style={styles.alertDescription} numberOfLines={3}>
//           {alert.description}
//         </ThemedText>
//         <ThemedText style={styles.alertDate}>
//           {alert.createdOn ? alert.createdOn.toLocaleDateString() : 'Unknown date'}
//         </ThemedText>
//       </TouchableOpacity>
//     </ThemedView>
//   );

//   const getSeverityColor = (severity: string) => {
//     switch (severity) {
//       case 'high': return '#ff4444';
//       case 'medium': return '#ffaa00';
//       case 'low': return '#44ff44';
//       default: return '#cccccc';
//     }
//   };

//   return (
//     <>
//       {hideAlert ? (
//         <ThemedView style={styles.openContainer} shadow>
//           <TouchableOpacity onPress={() => setHideAlert(false)}>
//             <ThemedIcons library='MaterialIcons' name="notifications" size={20}/>
//             {hasUnreadAlerts && <View style={styles.unreadDot} />}
//           </TouchableOpacity>
//         </ThemedView>
//       ): (
//         <View style={styles.container}>
//           <ThemedView style={styles.hideButton} shadow color='primary'>
//             <TouchableOpacity onPress={() => setHideAlert(true)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5}}>
//               <ThemedIcons library='MaterialIcons' name="notifications-off" size={20}/>
//               <ThemedText style={{fontSize: 12}}>Hide</ThemedText>
//             </TouchableOpacity>
//           </ThemedView>
//           {children}
          
//           {hasAlerts && (
//             <View style={styles.alertsSection}>
//               <HorizontalSections
//                 labels={alerts.map((_, index) => `Alert ${index + 1}`)}
//                 sections={alerts.map(alert => renderAlertCard(alert))}
//                 type="dotIdentifier"
//                 containerStyle={styles.horizontalSectionsContainer}
//               />
//             </View>
//           )}
          
//           <ThemedView style={styles.alertButton} shadow>
//             <TouchableOpacity onPress={() => setHideAlert(true)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5}}>
//               <Image source={require('@/assets/images/tara-worried.png')} style={styles.taraImage} />
//               {hasUnreadAlerts && <View style={styles.unreadDot} />}
//             </TouchableOpacity>
//           </ThemedView>
//         </View>
//       )}
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     pointerEvents: 'box-none',
//     position: 'absolute',
//     bottom: 10,
//     right: 10,
//     top: 10,
//     zIndex: 1000,
//     width: 70,
//     alignItems: 'flex-end',
//     flexDirection: 'column-reverse',
//     gap: 10
//   },
//   openContainer:{
//     position: 'absolute',
//     bottom: 10,
//     right: 10,
//     zIndex: 1000,
//     padding: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 30,
//     opacity: .7
//   },
//   hideButton:{
//     width: '100%',
//     padding: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 30,
//     opacity: .7
//   },
//   alertsSection: {
//     position: 'absolute',
//     bottom: 80,
//     right: 0,
//     width: 300,
//     height: 200,
//     zIndex: 999,
//   },
//   horizontalSectionsContainer: {
//     height: '100%',
//     borderRadius: 15,
//     overflow: 'hidden',
//   },
//   alertCard: {
//     margin: 8,
//     borderRadius: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.95)',
//   },
//   alertCardContent: {
//     padding: 12,
//   },
//   alertHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   alertTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     flex: 1,
//     marginRight: 8,
//   },
//   severityIndicator: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//   },
//   alertDescription: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 8,
//   },
//   alertDate: {
//     fontSize: 12,
//     color: '#999',
//   },
//   alertButton:{
//     width: '100%',
//     aspectRatio: 1,
//     borderRadius: 50,
//     overflow: 'hidden',
//     backgroundColor: 'rgba(255, 183, 77, 0.7)',
//     borderWidth: 3,
//     borderColor: '#fff',
//     position: 'relative',
//   },
//   taraImage:{
//     width: 120,
//     height: 120,
//     marginLeft: 10,
//     objectFit: 'contain',
//   },
//   unreadDot: {
//     position: 'absolute',
//     top: 5,
//     right: 5,
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: '#ff4444',
//     borderWidth: 2,
//     borderColor: '#fff',
//   }
// });

// export default AlertsContainer; 