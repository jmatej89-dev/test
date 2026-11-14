import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '../ui/controls';
import { TYPE, UI } from '../ui/theme';

export default function Projects() {
  return (
    <View style={{ flex: 1, backgroundColor: UI.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text style={TYPE.title}>Post Maker</Text>
      <Button label="Debug renderu" onPress={() => router.push('/debug')} />
    </View>
  );
}
