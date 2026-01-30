import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'dashboard',
};

export default function FeedLayout() {
  return (
    <Stack>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen 
      name="[name]" 
      options={{ 
        headerShown: false 
      }} 
    />
    <Stack.Screen 
      name="product/[id]"
      options={{ 
        headerShown: false 
      }} 
    />
  </Stack>
  )
}