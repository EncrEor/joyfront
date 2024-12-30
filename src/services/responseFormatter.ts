// services/responseFormatter.ts
import type { Client, Delivery, Product } from '@/types';

interface FormatOptions {
  includeEmoji?: boolean;
  includePrices?: boolean;
  groupByZone?: boolean;
}

class ResponseFormatter {
  private static readonly DEFAULT_OPTIONS: FormatOptions = {
    includeEmoji: true,
    includePrices: true,
    groupByZone: false
  };

  // Formatage des informations client
  formatClientInfo(client: Client, options: FormatOptions = {}): string {
    const opts = { ...ResponseFormatter.DEFAULT_OPTIONS, ...options };
    const lines: string[] = [];

    // En-tête
    lines.push(`${opts.includeEmoji ? '🏪 ' : ''}${client.Nom_Client}`);
    
    // Zone
    if (client.zone) {
      lines.push(`${opts.includeEmoji ? '📍 ' : ''}Zone: ${client.zone}`);
    }

    // Téléphone
    if (client.Tel) {
      lines.push(`${opts.includeEmoji ? '📞 ' : ''}Tel: ${client.Tel}`);
    }

    // Adresse
    if (client.Adresse) {
      lines.push(`${opts.includeEmoji ? '🏠 ' : ''}Adresse: ${client.Adresse}`);
    }

    // Informations supplémentaires
    if (client.Congelateur === 'oui') {
      lines.push(`${opts.includeEmoji ? '❄️ ' : ''}Possède un congélateur`);
    }
    
    if (client.Delais) {
      lines.push(`${opts.includeEmoji ? '⏱️ ' : ''}Délai de paiement: ${client.Delais}`);
    }

    return lines.join('\n');
  }

  // Formatage d'une liste de clients
  formatClientsList(clients: Client[], options: FormatOptions = {}): string {
    const opts = { ...ResponseFormatter.DEFAULT_OPTIONS, ...options };
    
    if (opts.groupByZone) {
      // Grouper par zone
      const clientsByZone = clients.reduce((acc, client) => {
        const zone = client.zone || 'Zone non spécifiée';
        if (!acc[zone]) acc[zone] = [];
        acc[zone].push(client);
        return acc;
      }, {} as Record<string, Client[]>);

      const lines: string[] = [];
      for (const [zone, zoneClients] of Object.entries(clientsByZone)) {
        lines.push(`\n${opts.includeEmoji ? '📍 ' : ''}${zone}:`);
        zoneClients.forEach(client => {
          lines.push(`  • ${client.Nom_Client}${client.Tel ? ` (${client.Tel})` : ''}`);
        });
      }
      return lines.join('\n');
    } else {
      // Liste simple
      return clients.map(client => 
        `• ${client.Nom_Client} ${client.zone ? `(${client.zone})` : ''}`
      ).join('\n');
    }
  }

  // Formatage des livraisons
  formatDelivery(delivery: Delivery, options: FormatOptions = {}): string {
    const opts = { ...ResponseFormatter.DEFAULT_OPTIONS, ...options };
    const lines: string[] = [];

    // En-tête de la livraison
    lines.push(`${opts.includeEmoji ? '📦 ' : ''}Livraison #${delivery.id}`);
    lines.push(`${opts.includeEmoji ? '📅 ' : ''}Date: ${delivery.date}`);

    // Détails des produits
    lines.push('\nProduits:');
    delivery.products.forEach(product => {
      const productLine = opts.includePrices
        ? `• ${product.quantity}x ${product.name} (${product.price} DNT/unité = ${product.total} DNT)`
        : `• ${product.quantity}x ${product.name}`;
      lines.push(productLine);
    });

    // Total
    if (opts.includePrices) {
      lines.push(`\n${opts.includeEmoji ? '💰 ' : ''}Total: ${delivery.total} DNT`);
    }

    return lines.join('\n');
  }

  // Formatage des messages de clarification
  formatClarificationRequest(matches: Client[]): string {
    const lines: string[] = [];
    lines.push('J\'ai trouvé plusieurs correspondances. Pouvez-vous préciser lequel ?');
    
    matches.forEach(client => {
      lines.push(`• ${client.Nom_Client} (${client.zone || 'Zone non spécifiée'})`);
    });

    return lines.join('\n');
  }

  // Formatage des erreurs
  formatError(error: string, code?: string): string {
    return `❌ ${error}${code ? ` (Code: ${code})` : ''}`;
  }

  // Formatage d'une réponse de succès
  formatSuccess(message: string): string {
    return `✅ ${message}`;
  }

  // Formatage des statistiques
  formatStats(stats: any): string {
    const lines: string[] = [];
    
    if (stats.totalLivraisons) {
      lines.push(`📊 Total des livraisons: ${stats.totalLivraisons}`);
    }
    
    if (stats.chiffreAffaires) {
      lines.push(`💰 Chiffre d'affaires: ${stats.chiffreAffaires} DNT`);
    }
    
    if (stats.topProduits) {
      lines.push('\n🏆 Produits les plus vendus:');
      stats.topProduits.forEach((p: any) => {
        lines.push(`  • ${p.name}: ${p.quantity} unités`);
      });
    }

    return lines.join('\n');
  }

  // Formatage des suggestions
  formatSuggestions(suggestions: string[]): string {
    if (!suggestions.length) return '';
    return `\n💡 Suggestions:\n${suggestions.map(s => `• ${s}`).join('\n')}`;
  }

  // Formatage des actions possibles
  formatActions(actions: string[]): string {
    if (!actions.length) return '';
    return `\n⚡ Actions possibles:\n${actions.map(a => `• ${a}`).join('\n')}`;
  }
}

export const responseFormatter = new ResponseFormatter();