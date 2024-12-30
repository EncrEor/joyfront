// useClientDelivery.ts
import { useState, useCallback, useEffect } from 'react';
import type { Client, Delivery, ChatMessage, DomainError } from '@/types';
import type { UseClientDeliveryOptions, UseClientDeliveryResult } from './types';

const initialErrorState: UseClientDeliveryResult['errorState'] = {
  clientError: undefined,
  deliveryError: undefined,
  chatError: undefined,
};

// Fonction pour créer une erreur structurée
const createError = (message: string, code?: string): DomainError => ({
  message,
  code,
  timestamp: new Date(),
});

// Fonction pour formater les messages de l'assistant
const formatAssistantMessage = (response: any): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  const timestamp = new Date();

  // Récupération de la réponse principale du backend (message ou réponse textuelle)
  const mainMessage = response.data?.response || response.data?.data?.message;

  if (mainMessage) {
    messages.push({
      id: `assistant-${Date.now()}`,
      content: mainMessage,
      type: 'assistant',
      timestamp,
    });
  }

  // Si des correspondances de clients sont présentes, les ajouter séparément
  if (response.data?.data?.matches) {
    messages.push({
      id: `matches-${Date.now()}`,
      content: {
        matches: response.data.data.matches,
        message: response.data.data.message,
      },
      type: 'assistant-matches',
      timestamp,
    });
  }

  // Si d'autres données structurées sont présentes et qu'il n'y a pas de matches, les ajouter
  if (response.data?.data?.result && !response.data.data.matches) {
    messages.push({
      id: `data-${Date.now()}`,
      content: response.data.data.result,
      type: 'assistant-data',
      timestamp,
    });
  }

  console.log('🛠 Messages formatés pour chatMessages:', messages); // Vérification du formatage des messages
  return messages;
};



export function useClientDelivery(options?: UseClientDeliveryOptions): UseClientDeliveryResult {
  const { autoLoadDeliveries = false, maxChatMessages } = options || {};

  const [client, setClient] = useState<Client | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<UseClientDeliveryResult['errorState']>(initialErrorState);

  const clearError = useCallback((errorType: keyof UseClientDeliveryResult['errorState']) => {
    setErrorState((prev) => ({ ...prev, [errorType]: undefined }));
  }, []);

  const handleAPIError = useCallback((
    error: unknown,
    errorType: keyof UseClientDeliveryResult['errorState'],
    errorMessage: string
  ) => {
    const formattedError = createError(
      error instanceof Error ? error.message : errorMessage,
      'API_ERROR'
    );
    
    console.error(`API Error (${errorType}):`, formattedError);
    
    setErrorState((prev) => ({
      ...prev,
      [errorType]: formattedError,
    }));
    setError(errorMessage);
  }, []);

  const searchClient = useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      setClient(null);
      setDeliveries([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      clearError('clientError');

      const response = await fetch(`/api/sheets/clients?search=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la recherche du client');
      }

      if (data.success && data.data) {
        setClient(data.data);
        if (data.data.ID_Client) {
          const deliveriesResponse = await fetch(`/api/sheets/livraisons/by-client/${data.data.ID_Client}/currentMonth`);
          const deliveriesData = await deliveriesResponse.json();
          setDeliveries(deliveriesData.success ? deliveriesData.data : []);
        }
      } else {
        setClient(null);
        setDeliveries([]);
      }
    } catch (err) {
      handleAPIError(err, 'clientError', 'Erreur lors de la recherche du client');
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleAPIError]);

  const fetchDeliveries = useCallback(async (clientId: string) => {
    try {
      setIsLoading(true);
      clearError('deliveryError');

      const response = await fetch(`/api/sheets/livraisons/by-client/${clientId}/currentMonth`);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des livraisons');
      }

      const data = await response.json();
      if (data.success) {
        setDeliveries(data.data);
      } else {
        throw new Error(data.message || 'Erreur inconnue lors du chargement des livraisons');
      }
    } catch (err) {
      handleAPIError(err, 'deliveryError', 'Erreur lors du chargement des livraisons');
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleAPIError]);

  const sendChatMessage = useCallback(async (message: string) => {
    try {
      console.log('📨 Envoi du message:', message);
      setIsLoading(true);
      clearError('chatError');

      // Ajout du message utilisateur
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content: message,
        type: 'user',
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, userMessage]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      console.log('📩 Réponse reçue avec statut:', response.status);

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du message");
      }

      const data = await response.json();
      console.log('📄 Structure de la réponse du backend:', JSON.stringify(data, null, 2)); // Log détaillé de la réponse du backend

      if (data.success) {
        // Formater et ajouter les messages de l'assistant
        const assistantMessages = formatAssistantMessage(data);
        console.log('🛠 Messages formatés pour chatMessages:', assistantMessages); // Log pour vérifier le formatage

        setChatMessages(prev => {
          let newMessages = [...prev, ...assistantMessages];
          // Limiter le nombre de messages si nécessaire
          if (maxChatMessages && newMessages.length > maxChatMessages) {
            newMessages = newMessages.slice(-maxChatMessages);
          }
          return newMessages;
        });

        // Mise à jour du contexte client et livraisons si présents dans la réponse
        if (data.data?.client) {
          console.log('👤 Mise à jour du client dans le contexte:', data.data.client);
          setClient(data.data.client);
        }
        if (data.data?.deliveries) {
          console.log('📦 Mise à jour des livraisons dans le contexte:', data.data.deliveries);
          setDeliveries(data.data.deliveries);
        }
      } else {
        throw new Error(data.message || "Erreur inconnue lors de l'envoi du message");
      }
    } catch (err) {
      console.error('❌ Erreur dans sendChatMessage:', err);
      handleAPIError(err, 'chatError', "Erreur lors de l'envoi du message");
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleAPIError, maxChatMessages]);


  const sendAudioMessage = useCallback(async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      clearError('chatError');

      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('/api/chat/audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du message audio");
      }

      const data = await response.json();
      if (data.success) {
        await sendChatMessage(data.transcription);
      } else {
        throw new Error(data.message || "Erreur inconnue lors de l'envoi du message audio");
      }
    } catch (err) {
      handleAPIError(err, 'chatError', "Erreur lors de l'envoi du message audio");
    } finally {
      setIsLoading(false);
    }
  }, [clearError, sendChatMessage, handleAPIError]);

  const setGeneralError = useCallback((message: string | null) => {
    setError(message);
  }, []);

  // Auto-load deliveries
  useEffect(() => {
    if (autoLoadDeliveries && client?.ID_Client) {
      fetchDeliveries(client.ID_Client);
    }
  }, [autoLoadDeliveries, client?.ID_Client, fetchDeliveries]);

  return {
    client,
    deliveries,
    chatMessages,
    isLoading,
    error,
    errorState,
    clearError,
    searchClient,
    sendChatMessage,
    sendAudioMessage,
    fetchDeliveries,
    setGeneralError,
  };
}