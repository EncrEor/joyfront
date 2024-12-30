// ClientDeliveryView.tsx
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Phone, MapPin, X, Mic, MicOff, Send, Loader } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useClientDelivery } from '@/hooks/useClientDelivery';
import type { DomainError } from '@/types';
import type { ChatMessage } from '@/types';

// Composant d'erreur
const ErrorMessage: React.FC<{
  error: DomainError;
  onDismiss: () => void;
  className?: string;
}> = ({ error, onDismiss, className = '' }) => (
  <div className={`relative p-4 bg-red-100 text-red-600 rounded-lg shadow-lg ${className}`}>
    <button
      onClick={onDismiss}
      className="absolute top-2 right-2 p-1 hover:bg-red-200 rounded-full"
    >
      <X className="h-4 w-4" />
    </button>
    <p className="pr-6">{error.message}</p>
    {error.code && (
      <p className="text-xs mt-1 text-red-500">Code: {error.code}</p>
    )}
  </div>
);

const ClientDeliveryView: React.FC = () => {
  const {
    client,
    deliveries,
    chatMessages,
    isLoading,
    errorState,
    error,
    clearError,
    sendChatMessage,
    sendAudioMessage,
    fetchDeliveries,
    setGeneralError,
  } = useClientDelivery({
    autoLoadDeliveries: false,
    maxChatMessages: 100,
  });

  const [selectedDelivery, setSelectedDelivery] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    try {
      console.log('📤 Envoi du message:', message);
      await sendChatMessage(message);
      console.log('✅ Message envoyé avec succès');
      setMessage('');
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      setGeneralError('Erreur lors de l\'envoi du message.');
    }
  }, [message, isLoading, sendChatMessage, setGeneralError]);

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.onstart = () => {
        setAudioChunks([]);
      };

      recorder.ondataavailable = (e) => {
        setAudioChunks((chunks) => [...chunks, e.data]);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await sendAudioMessage(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Erreur d'accès au microphone:", error);
      setGeneralError('Erreur lors de l\'accès au microphone.');
      clearError('chatError');
    }
  }, [audioChunks, sendAudioMessage, setGeneralError, clearError]);

  const handleStopRecording = useCallback(() => {
    mediaRecorder?.stop();
    setIsRecording(false);
  }, [mediaRecorder]);

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow flex flex-col h-[calc(100vh-2rem)]">
      <div className="p-4 border-b bg-gray-50">
        <h1 className="text-lg font-medium text-gray-800">JoyJuice Assistant</h1>
        <p className="text-sm text-gray-600">Utilisez le chat pour rechercher un client ou créer une livraison</p>
      </div>

      {client && (
        <Card className="mx-4 mt-4 bg-gray-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl text-red-700">{client.Nom_Client}</CardTitle>
              <p className="text-gray-600">{client.zone}</p>
            </div>
            <div className="text-xl font-bold text-amber-600">-- DNT</div>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{client.Adresse}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{client.Tel}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex-1 overflow-y-auto px-4">
        {deliveries.length > 0 && (
          <div className="my-4">
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              Livraisons en attente de paiement
            </h2>
            <div className="space-y-2">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  onClick={() => setSelectedDelivery(deliveries.findIndex(d => d.id === delivery.id))}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex gap-4">
                    <span className="text-gray-600">{delivery.date}</span>
                    <span>{delivery.products.length} produits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{delivery.total} DNT</span>
                    <button className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600">
                      Payer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDelivery !== null && deliveries[selectedDelivery] && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-medium">Détails livraison</h3>
                <p className="text-sm text-gray-500">ID: {deliveries[selectedDelivery].id}</p>
              </div>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-2">
              {deliveries[selectedDelivery].products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.price} DNT</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border rounded">
                      <button className="px-2 py-1 hover:bg-gray-100">-</button>
                      <span className="px-3 py-1 border-x">{product.quantity}</span>
                      <button className="px-2 py-1 hover:bg-gray-100">+</button>
                    </div>
                    <span className="font-medium">{product.total} DNT</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 my-4">
        {chatMessages.map((msg, index) => {
  console.log('Rendu message:', msg);

  // Skip rendering messages of type 'assistant-data' to avoid displaying JSON blocks
  if (msg.type === 'assistant-data') {
    return null;
  }

  // Skip rendering the 'assistant' message if the next message is 'assistant-matches'
  if (msg.type === 'assistant' && chatMessages[index + 1]?.type === 'assistant-matches') {
    return null;
  }

  // Determine alignment based on message type
  const alignment = msg.type === 'user' ? 'justify-end' : 'justify-start';

  // Determine message styling based on type
  const messageStyle =
    msg.type === 'user'
      ? 'bg-blue-500 text-white'
      : msg.type === 'assistant'
      ? 'bg-gray-100 text-gray-800'
      : msg.type === 'assistant-matches'
      ? 'bg-gray-50 text-gray-600'
      : 'bg-gray-50 text-gray-600 font-mono text-sm';

  return (
    <div key={msg.id} className={`flex ${alignment}`}>
      <div className={`max-w-[80%] rounded-lg px-4 py-2 ${messageStyle}`}>
        {typeof msg.content === 'string' ? (
          msg.content
        ) : msg.type === 'assistant-matches' && msg.content ? (
          <div className="space-y-2">
            <p className="font-medium">{msg.content.message}</p>
            <ul className="list-disc pl-4 space-y-1">
              {msg.content.matches && msg.content.matches.length > 0 ? (
                msg.content.matches.map((match: any, idx: number) => (
                  <li key={idx}>
                    {match.Nom_Client} {match.zone && `(${match.zone})`}
                  </li>
                ))
              ) : (
                <li>Aucun résultat disponible</li>
              )}
            </ul>
          </div>
        ) : null /* Do not render anything if no conditions are met */}
      </div>
    </div>
  );
})}

          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="border-t bg-white p-4">
        <form onSubmit={handleSendMessage} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isRecording ? "Enregistrement en cours..." : "Écrivez ou parlez..."}
                className="w-full p-3 pr-12 rounded-lg border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRecording || isLoading}
              />

              {(isRecording || isLoading) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`p-3 rounded-full transition-colors ${isRecording
                ? 'bg-red-100 hover:bg-red-200 text-red-600'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              disabled={isLoading}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              type="submit"
              disabled={!message.trim() || isLoading || isRecording}
              className={`p-3 rounded-full bg-blue-500 text-white transition-opacity ${(!message.trim() || isLoading || isRecording)
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-600'
                }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      <div className="fixed bottom-4 left-4 right-4 space-y-2 z-50">
        {errorState.clientError && (
          <ErrorMessage
            error={errorState.clientError}
            onDismiss={() => clearError('clientError')}
            className="border-l-4 border-red-500"
          />
        )}
        {errorState.deliveryError && (
          <ErrorMessage
            error={errorState.deliveryError}
            onDismiss={() => clearError('deliveryError')}
            className="border-l-4 border-orange-500"
          />
        )}
        {errorState.chatError && (
          <ErrorMessage
            error={errorState.chatError}
            onDismiss={() => clearError('chatError')}
            className="border-l-4 border-blue-500"
          />
        )}
        {error && !Object.values(errorState).some(e => e !== undefined) && (
          <ErrorMessage
            error={{ message: error, code: undefined, timestamp: new Date() }}
            onDismiss={() => setGeneralError(null)}
            className="border-l-4 border-red-500"
          />
        )}
      </div>
    </div>
  );
};

export default memo(ClientDeliveryView);
