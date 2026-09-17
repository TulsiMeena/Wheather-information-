export interface VoiceInputProvider {
  isSupported(): boolean;
  startListening(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void,
    onEnd?: () => void
  ): void;
  stopListening(): void;
  isListening(): boolean;
}

export class WebSpeechVoiceProvider implements VoiceInputProvider {
  private recognition: any = null;
  private listening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        null;
      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          this.recognition.continuous = false;
          this.recognition.interimResults = true;
          this.recognition.lang = 'en-IN'; // defaults to Indian English / Hindi mix
        } catch {
          this.recognition = null;
        }
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  isListening(): boolean {
    return this.listening;
  }

  startListening(
    onResult: (transcript: string) => void,
    onError?: (error: string) => void,
    onEnd?: () => void
  ): void {
    if (!this.recognition) {
      if (onError) onError('Speech recognition is not supported in this browser environment.');
      return;
    }

    if (this.listening) {
      this.stopListening();
    }

    this.listening = true;

    this.recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      onResult(currentTranscript);
    };

    this.recognition.onerror = (event: any) => {
      this.listening = false;
      if (onError) onError(event.error || 'Voice input error');
    };

    this.recognition.onend = () => {
      this.listening = false;
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (err: any) {
      this.listening = false;
      if (onError) onError(err.message || 'Could not start voice recognition');
    }
  }

  stopListening(): void {
    if (this.recognition && this.listening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.listening = false;
  }
}

export const defaultVoiceProvider: VoiceInputProvider = new WebSpeechVoiceProvider();
