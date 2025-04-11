declare module 'microsoft-cognitiveservices-speech-sdk' {
  // SDK classes
  export class SpeechConfig {
    static fromAuthorizationToken(token: string, region: string): SpeechConfig;
    speechSynthesisVoiceName: string;
    speechRecognitionLanguage: string;
  }

  export class AudioConfig {
    static fromDefaultMicrophoneInput(): AudioConfig;
    static fromDefaultSpeakerOutput(): AudioConfig;
  }
  
  export class SpeechSynthesizer {
    constructor(speechConfig: SpeechConfig, audioConfig: AudioConfig);
    speakTextAsync(
      text: string, 
      successCallback: (result: SpeechSynthesisResult) => void,
      errorCallback: (error: any) => void
    ): void;
    close(): void;
  }
  
  export class SpeechRecognizer {
    constructor(speechConfig: SpeechConfig, audioConfig: AudioConfig);
    recognizeOnceAsync(
      successCallback: (result: SpeechRecognitionResult) => void,
      errorCallback: (error: any) => void
    ): void;
    startContinuousRecognitionAsync(
      successCallback: () => void,
      errorCallback: (error: any) => void
    ): void;
    stopContinuousRecognitionAsync(
      successCallback: () => void,
      errorCallback: (error: any) => void
    ): void;
    close(): void;
  }
  
  // Result interfaces
  export interface SpeechSynthesisResult {
    audioData: Uint8Array;
    resultId: string;
    reason: ResultReason;
  }
  
  export interface SpeechRecognitionResult {
    text: string;
    resultId: string;
    reason: ResultReason;
  }
  
  // Enums
  export enum ResultReason {
    RecognizingSpeech,
    RecognizedSpeech,
    RecognizedIntent,
    NoMatch,
    Canceled,
    SynthesizingAudio,
    SynthesizingAudioCompleted,
    SynthesizingAudioStarted
  }
} 