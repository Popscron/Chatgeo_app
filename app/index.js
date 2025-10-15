import WhatsAppChat from '../chatscreen';
import { DarkModeProvider } from '../DarkModeContext';

export default function Home() {
  return (
    <DarkModeProvider>
      <WhatsAppChat />
    </DarkModeProvider>
  );
}
