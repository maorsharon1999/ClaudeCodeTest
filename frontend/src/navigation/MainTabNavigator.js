import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from './CustomTabBar';
import RadarStack from './RadarStack';
import ExploreStack from './ExploreStack';
import InboxStack from './InboxStack';
import ProfileStack from './ProfileStack';
import CreateStack from './CreateStack';
import { theme } from '../theme';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      sceneContainerStyle={{ backgroundColor: theme.colors.bgDeep }}
    >
      <Tab.Screen name="RadarStack" component={RadarStack} />
      <Tab.Screen name="ExploreStack" component={ExploreStack} />
      <Tab.Screen
        name="CreateStack"
        component={CreateStack}
        options={{ tabBarLabel: 'Create' }}
      />
      <Tab.Screen name="InboxStack" component={InboxStack} />
      <Tab.Screen name="ProfileStack" component={ProfileStack} />
    </Tab.Navigator>
  );
}
