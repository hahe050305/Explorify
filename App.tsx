// App.tsx
import React from 'react';
import {Platform, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthProvider, useAuth} from './src/context/AuthContext';
import {ProductProvider} from './src/context/ProductContext';
import COLORS from './src/constants/colors';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProductDetails from './src/screens/ProductDetails';
import OrderPlacedScreen from './src/screens/OrderPlacedScreen';
import OrderSummaryScreen from './src/screens/OrderSummaryScreen';
import TrackOrderScreen from './src/screens/TrackOrderScreen';
import CartScreen from './src/screens/CartScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import {LocationProvider} from './src/context/LocationContext';
import {AlertProvider} from './src/context/AlertContext';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ProductDetails: { product?: any; productId?: number } | undefined;
  Cart: undefined;
  OrderPlaced: {
    items: any[];
    subtotal: number;
    shipping: number;
    total: number;
    orderId: string;
    orderDate: string;
    paymentId?: string;
    paymentMethod?: string;
    razorpayOrderId?: string;
  } | undefined;
  OrderSummary: {
    items: any[];
    subtotal: number;
    shipping: number;
    total: number;
    orderId: string;
    orderDate: string;
    paymentId?: string;
    paymentMethod?: string;
    razorpayOrderId?: string;
  } | undefined;
  TrackOrder: {orderId?: string; orderDate?: string; items?: any[]; total?: number} | undefined;
  Profile: undefined;
  LocationProvider : undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerShown: false,
  animation: 'fade' as const,
  animationDuration: 120,
  freezeOnBlur: true,
  contentStyle: {backgroundColor: COLORS.bg},
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  ...(Platform.OS === 'android' ? {navigationBarColor: COLORS.white} : null),
};

function RootNavigator() {
  const { user, isGuest, isLoading } = useAuth();

  if (isLoading) {
    return <View style={{flex: 1, backgroundColor: COLORS.bg}} />;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!user && !isGuest ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{animationTypeForReplace: 'pop', animation: 'none'}}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{animation: 'fade', animationDuration: 100}}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{animation: 'none'}}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{animation: 'none'}} />
          <Stack.Screen name="ProductDetails" component={ProductDetails} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="OrderPlaced" component={OrderPlacedScreen} options={{animation: 'fade', animationDuration: 200, gestureEnabled: false}} />
          <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} options={{animation: 'slide_from_right'}} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="TrackOrder" component={TrackOrderScreen} />

          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{animationTypeForReplace: 'pop', animation: 'none'}}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{animation: 'fade', animationDuration: 100}}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AlertProvider>
        <AuthProvider>
          <LocationProvider>
            <ProductProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </ProductProvider>
          </LocationProvider>
        </AuthProvider>
      </AlertProvider>
    </SafeAreaProvider>
  );
}
