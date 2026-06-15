import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function FeedLayout() {
  return (
    <Stack>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    <Stack.Screen 
      name="[name]" 
      options={{ 
        headerShown: false,
        animation: 'simple_push',
      }} 
    />
    <Stack.Screen 
      name="product/[id]"
      options={{ 
        headerShown: false,
        animation: 'simple_push',
      }} 
    />
  </Stack>
  )
}