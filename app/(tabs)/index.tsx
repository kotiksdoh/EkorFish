
import { LoginModal } from '@/features/auth/ui/components/LoginModal';
import { HomeScreen } from '@/features/home';
import { HomeHeader } from '@/features/home/ui/components/HomeHeader';
import { useState } from 'react';

export default function Index() {
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  const handleLoginPress = () => {
    setLoginModalVisible(true);
  };

  const handleLogin = (phoneNumber: string) => {
    console.log('Login with:', phoneNumber);
    setLoginModalVisible(false);
  };

  const handleButtonPress = () => {
    console.log('Button pressed!');
  };
  return (
    <>
      <HomeHeader 
        title="EkorFish" 
        transparent={true} 
        onLoginPress={handleLoginPress}
      />
      <LoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onLogin={handleLogin}
      />
      <HomeScreen />
    </>
  );
}

// const styles = StyleSheet.create({
//   titleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   stepContainer: {
//     gap: 8,
//     marginBottom: 8,
//   },
//   reactLogo: {
//     height: 178,
//     width: 290,
//     bottom: 0,
//     left: 0,
//     position: 'absolute',
//   },
// });
