import { useLocalSearchParams } from 'expo-router';
import { CaptionScreen } from '../../features/caption/CaptionScreen';

export default function CaptionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CaptionScreen id={String(id)} />;
}
