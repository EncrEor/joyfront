// Types existants
export interface Client {
  ID_Client: string;
  Nom_Client: string;
  Tel: string;
  Adresse: string;
  zone: string;
  Delais: string;
  Congelateur: string;
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Delivery {
  id: string;
  date: string;
  total: number;
  products: Product[];
  status: string;
}

export interface ChatMessage {
  id: string;
  content: string | { matches: any; message: any }; 
  type: 'user' | 'assistant' | 'assistant-data' | 'assistant-matches';
  timestamp: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Nouveaux types pour la gestion des erreurs
export interface DomainError {
  message: string;
  code?: string;
  timestamp: Date;
}

export interface ErrorState {
  clientError: DomainError | null;
  deliveryError: DomainError | null;
  chatError: DomainError | null;
}