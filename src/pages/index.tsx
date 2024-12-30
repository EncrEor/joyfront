// src/pages/index.tsx
import ClientDeliveryView from '@/components/client/ClientDeliveryView';


export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Joy Juice</h1>
        <ClientDeliveryView />
      </div>
    </main>
  );
}