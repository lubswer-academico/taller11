import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ChatScreen } from '../src/features/chat/presentation/screens/ChatScreen';

SystemUI.setBackgroundColorAsync('#FFFFFF').catch(() => {});

export default function App() {
    return (
        <SafeAreaProvider style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="transparent"
                translucent
            />
            <ChatScreen />
        </SafeAreaProvider>
    );
}
