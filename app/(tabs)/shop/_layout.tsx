import { Stack } from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function ShopLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="product/[id]"
        options={{ animation: "simple_push" }}
      />
    </Stack>
  );
}
