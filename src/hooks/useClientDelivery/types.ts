// types.ts
export interface Client {
  ID_Client: string;
  Nom_Client: string;
  zone: string;
  Adresse: string;
  Tel: string;
  // Ajoute d'autres champs si nécessaire
}

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  // Ajoute d'autres champs si nécessaire
}

export interface Delivery {
  id: string;
  date: string;
  products: Product[];
  total: number;
  // Ajoute d'autres champs si nécessaire
}

export type ChatMessage = {
  id: string;
  content: string | { matches: any; message: any };
  type: 'user' | 'assistant' | 'assistant-matches' | 'assistant-data';
  timestamp: Date;
};


export interface DomainError {
  message: string;
  code?: string;
  timestamp: Date;
}

export interface UseClientDeliveryOptions {
  autoLoadDeliveries?: boolean;
  maxChatMessages?: number;
}

export interface UseClientDeliveryState {
  client: Client | null;
  deliveries: Delivery[];
  chatMessages: ChatMessage[];
  isLoading: boolean;
  errorState: {
    clientError?: DomainError;
    deliveryError?: DomainError;
    chatError?: DomainError;
  };
  error: string | null;
}

export interface UseClientDeliveryActions {
  searchClient: (query: string) => Promise<void>;
  clearError: (errorType: keyof UseClientDeliveryState['errorState']) => void;
  sendChatMessage: (message: string) => Promise<void>;
  sendAudioMessage: (audioBlob: Blob) => Promise<void>;
  fetchDeliveries: (clientId: string) => Promise<void>;
  setGeneralError: (message: string | null) => void; // Ajouté
}

export type UseClientDeliveryResult = UseClientDeliveryState & UseClientDeliveryActions;
