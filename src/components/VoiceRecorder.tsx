import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => Promise<void>;
  onCancel?: () => void;
}

export const VoiceRecorder = ({ onSend, onCancel }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [sending, setSending] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collecter les données toutes les 100ms
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Timer pour afficher la durée
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);

    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone. Vérifiez vos permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setDuration(0);
    audioChunksRef.current = [];
    if (onCancel) {
      onCancel();
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;

    setSending(true);
    try {
      await onSend(audioBlob, duration);
      setAudioBlob(null);
      setDuration(0);
      audioChunksRef.current = [];
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message vocal:', error);
    } finally {
      setSending(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioBlob) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg animate-in fade-in duration-200">
        <audio 
          src={URL.createObjectURL(audioBlob)} 
          controls 
          className="flex-1 h-10"
        />
        <span className="text-sm text-muted-foreground min-w-[3rem]">
          {formatDuration(duration)}
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={cancelRecording}
          disabled={sending}
          className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          onClick={handleSend}
          disabled={sending}
          className="h-10 w-10 bg-primary hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg animate-pulse">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm font-medium">Enregistrement...</span>
          <span className="text-sm text-muted-foreground ml-auto">
            {formatDuration(duration)}
          </span>
        </div>
        <Button
          size="icon"
          variant="destructive"
          onClick={stopRecording}
          className="h-10 w-10"
        >
          <Square className="h-4 w-4 fill-current" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={startRecording}
      className="h-10 w-10 text-primary hover:text-primary hover:bg-primary/10"
      title="Enregistrer un message vocal"
    >
      <Mic className="h-5 w-5" />
    </Button>
  );
};
