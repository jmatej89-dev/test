import { useLocalSearchParams } from 'expo-router';
import { EditorScreen } from '../../features/editor/EditorScreen';

export default function EditorRoute() {
  const { id, paste } = useLocalSearchParams<{ id: string; paste?: string }>();
  return <EditorScreen id={String(id)} startWithPaste={paste === '1'} />;
}
