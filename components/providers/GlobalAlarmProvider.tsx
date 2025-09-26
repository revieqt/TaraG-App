import React from 'react';
import { useRouteTracker } from '@/context/RouteTrackerContext';
import StopAlarmModal from '@/components/modals/StopAlarmModal';
import { useSession } from '@/context/SessionContext';

export default function GlobalAlarmProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const { 
    showStopAlarm, 
    dismissAlarm, 
    nextStop, 
    distanceToNextStop 
  } = useRouteTracker();

  return (
    <>
      {children}
      
      {/* Global Stop Alarm Modal */}
      <StopAlarmModal
        visible={showStopAlarm}
        onDismiss={dismissAlarm}
        stopName={nextStop?.locationName || 'Next Stop'}
        distance={distanceToNextStop || 0}
        routeMode={session?.activeRoute?.mode || 'walking'}
      />
    </>
  );
}
