import {
  CROPS_CATALOG,
  CropType,
  FarmPlot,
  InventoryItem,
  MARKET_PRODUCT_INFO,
  ProductId,
  IsaAnimationState,
} from '../types/game';
import { MarketStateSnapshot } from './marketState';
import { isaVoiceManager } from '../audio/isaVoiceManager';

export type StockStatus = 'normal' | 'low' | 'exhausted';

export interface MonitoredProduct {
  productId: ProductId;
  name: string;
  icon: string;
  category: string;
  type: 'crop' | 'animal';
  seedId?: string;
  seedName?: string;
  seedCost: number;
  growthTimeSeconds: number;
  recommendedPrice: number;
  stallStock: number;
  backpackStock: number;
  seedCountInBackpack: number;
  status: StockStatus;
  growingPlots: number;
  ripePlots: number;
  missedDemandCount: number;
}

export interface PlantingRecommendation {
  productId: ProductId;
  productName: string;
  icon: string;
  priority: 'urgent' | 'high' | 'medium' | 'good';
  reason: string;
  suggestedPlantCount: number;
  availableEmptyPlots: number;
  hasSeedsInBackpack: boolean;
  seedCountInBackpack: number;
  seedCost: number;
  isAnimalProduct: boolean;
  actionTip: string;
}

export interface IsaAssistantDiagnosis {
  overallStatus: 'all_stocked' | 'attention_needed' | 'critical_stockout';
  monitoredProducts: MonitoredProduct[];
  exhaustedProducts: MonitoredProduct[];
  lowProducts: MonitoredProduct[];
  normalProducts: MonitoredProduct[];
  recommendations: PlantingRecommendation[];
  primaryMessage: {
    text: string;
    animation: IsaAnimationState;
    priority: 'critical' | 'high' | 'normal' | 'idle';
  };
  unreadMissedSaleNotifications: number;
  totalStallUnits: number;
  emptyPlotsCount: number;
  totalPlotsCount: number;
}

/**
 * 13 Produtos Oficiais Monitorados Individualmente pela Isa
 */
export const MONITORED_PRODUCTS_CONFIG: Array<{
  productId: ProductId;
  type: 'crop' | 'animal';
  seedId?: string;
  seedName?: string;
  seedCost: number;
  growthTimeSeconds: number;
}> = [
  { productId: 'corn', type: 'crop', seedId: 'corn_seed', seedName: 'Semente de Milho', seedCost: 10, growthTimeSeconds: 22 },
  { productId: 'bean', type: 'crop', seedId: 'bean_seed', seedName: 'Semente de Feijão', seedCost: 12, growthTimeSeconds: 24 },
  { productId: 'soy', type: 'crop', seedId: 'soy_seed', seedName: 'Semente de Soja', seedCost: 14, growthTimeSeconds: 26 },
  { productId: 'wheat', type: 'crop', seedId: 'wheat_seed', seedName: 'Semente de Trigo', seedCost: 16, growthTimeSeconds: 28 },
  { productId: 'rice', type: 'crop', seedId: 'rice_seed', seedName: 'Semente de Arroz', seedCost: 15, growthTimeSeconds: 26 },
  { productId: 'tomato', type: 'crop', seedId: 'tomato_seed', seedName: 'Semente de Tomate', seedCost: 12, growthTimeSeconds: 25 },
  { productId: 'carrot', type: 'crop', seedId: 'carrot_seed', seedName: 'Semente de Cenoura', seedCost: 8, growthTimeSeconds: 18 },
  { productId: 'strawberry', type: 'crop', seedId: 'strawberry_seed', seedName: 'Semente de Morango', seedCost: 22, growthTimeSeconds: 32 },
  { productId: 'pumpkin', type: 'crop', seedId: 'pumpkin_seed', seedName: 'Semente de Abóbora', seedCost: 25, growthTimeSeconds: 36 },
  { productId: 'lettuce', type: 'crop', seedId: 'lettuce_seed', seedName: 'Semente de Alface', seedCost: 10, growthTimeSeconds: 20 },
  { productId: 'egg', type: 'animal', seedCost: 0, growthTimeSeconds: 45 },
  { productId: 'milk', type: 'animal', seedCost: 0, growthTimeSeconds: 60 },
  { productId: 'wool', type: 'animal', seedCost: 0, growthTimeSeconds: 90 },
];

class IsaAssistantService {
  private lastAlertTimestamp: number = 0;
  private lastSpokenKey: string = '';
  // Cooldown mínimo de 45 segundos entre avisos espontâneos de estoque da Isa
  private readonly ALERT_COOLDOWN_MS = 45000;

  /**
   * Diagnostica completamente o estoque e a fazenda com dados reais do Supabase / estado do jogo
   */
  public diagnose(
    marketState: MarketStateSnapshot | null,
    plots: FarmPlot[],
    inventory: Record<string, InventoryItem>,
    currentUserId: string
  ): IsaAssistantDiagnosis {
    // 1. Mapear estoque na barraca por produto
    const stallStockByProduct: Record<string, number> = {};
    if (marketState?.listings && Array.isArray(marketState.listings)) {
      for (const listing of marketState.listings) {
        if (listing.seller_id === currentUserId || listing.seller_id === marketState.player?.id) {
          const pid = listing.product_id;
          stallStockByProduct[pid] = (stallStockByProduct[pid] || 0) + Number(listing.quantity || 0);
        }
      }
    }

    // 2. Mapear notificações não lidas de clientes/NPCs procurando produtos
    const missedByProduct: Record<string, number> = {};
    let unreadMissedSaleNotifications = 0;
    if (marketState?.notifications && Array.isArray(marketState.notifications)) {
      for (const n of marketState.notifications) {
        if (!n.read) {
          unreadMissedSaleNotifications++;
          if (n.product_id) {
            missedByProduct[n.product_id] = (missedByProduct[n.product_id] || 0) + 1;
          }
        }
      }
    }

    // 3. Mapear talhões vazios, plantados e maduros
    let emptyPlotsCount = 0;
    const growingByCrop: Record<string, number> = {};
    const ripeByCrop: Record<string, number> = {};

    for (const plot of plots) {
      if (!plot.cropType || plot.stage === 0) {
        emptyPlotsCount++;
      } else {
        if (plot.stage >= 5) {
          ripeByCrop[plot.cropType] = (ripeByCrop[plot.cropType] || 0) + 1;
        } else {
          growingByCrop[plot.cropType] = (growingByCrop[plot.cropType] || 0) + 1;
        }
      }
    }

    // 4. Montar a lista de produtos monitorados
    const monitoredProducts: MonitoredProduct[] = MONITORED_PRODUCTS_CONFIG.map((cfg) => {
      const info = MARKET_PRODUCT_INFO[cfg.productId];
      const cropInfo = cfg.type === 'crop' && cfg.productId in CROPS_CATALOG ? CROPS_CATALOG[cfg.productId as CropType] : null;

      const stallStock = stallStockByProduct[cfg.productId] || 0;
      const backpackItem = inventory[cfg.productId];
      const backpackStock = backpackItem ? backpackItem.count : 0;

      const seedItem = cfg.seedId ? inventory[cfg.seedId] : undefined;
      const seedCountInBackpack = seedItem ? seedItem.count : 0;

      // Status do estoque:
      // ESGOTADO = 0 unidades na barraca
      // BAIXO = 1 a 3 unidades
      // NORMAL = mais de 3 unidades
      let status: StockStatus = 'normal';
      if (stallStock === 0) {
        status = 'exhausted';
      } else if (stallStock <= 3) {
        status = 'low';
      }

      return {
        productId: cfg.productId,
        name: info?.name || cropInfo?.name || cfg.productId,
        icon: info?.icon || cropInfo?.icon || '📦',
        category: info?.category || 'Geral',
        type: cfg.type,
        seedId: cfg.seedId,
        seedName: cfg.seedName || (cropInfo ? `Semente de ${cropInfo.name}` : undefined),
        seedCost: cfg.seedCost,
        growthTimeSeconds: cfg.growthTimeSeconds,
        recommendedPrice: info?.defaultPrice || cropInfo?.sellValue || 20,
        stallStock,
        backpackStock,
        seedCountInBackpack,
        status,
        growingPlots: growingByCrop[cfg.productId] || 0,
        ripePlots: ripeByCrop[cfg.productId] || 0,
        missedDemandCount: missedByProduct[cfg.productId] || 0,
      };
    });

    const exhaustedProducts = monitoredProducts.filter((p) => p.status === 'exhausted');
    const lowProducts = monitoredProducts.filter((p) => p.status === 'low');
    const normalProducts = monitoredProducts.filter((p) => p.status === 'normal');

    const totalStallUnits = monitoredProducts.reduce((acc, p) => acc + p.stallStock, 0);

    // 5. Gerar recomendações de plantio e produção inteligentes
    const recommendations: PlantingRecommendation[] = [];

    // Priorizar produtos com demanda de NPC perdida
    const urgentDemands = monitoredProducts
      .filter((p) => p.missedDemandCount > 0 && p.stallStock <= 3)
      .sort((a, b) => b.missedDemandCount - a.missedDemandCount);

    for (const p of urgentDemands) {
      const suggested = Math.max(2, Math.min(emptyPlotsCount, 4));
      recommendations.push({
        productId: p.productId,
        productName: p.name,
        icon: p.icon,
        priority: 'urgent',
        reason: `Clientes procuraram ${p.name} na sua barraca e foram embora sem comprar!`,
        suggestedPlantCount: p.type === 'crop' ? suggested : 1,
        availableEmptyPlots: emptyPlotsCount,
        hasSeedsInBackpack: p.seedCountInBackpack > 0,
        seedCountInBackpack: p.seedCountInBackpack,
        seedCost: p.seedCost,
        isAnimalProduct: p.type === 'animal',
        actionTip:
          p.type === 'crop'
            ? p.seedCountInBackpack > 0
              ? `Você já tem ${p.seedCountInBackpack} semente(s) na mochila. Plante nos talhões livres!`
              : `Compre ${suggested} sementes no Mercado por ${suggested * p.seedCost} 🪙.`
            : 'Alimente os animais da fazendinha para coletar novos produtos!',
      });
    }

    // Produtos esgotados (estoque zero)
    for (const p of exhaustedProducts) {
      if (recommendations.some((r) => r.productId === p.productId)) continue;
      const alreadyGrowing = p.growingPlots > 0;
      const alreadyRipe = p.ripePlots > 0;
      const hasInBackpack = p.backpackStock > 0;

      let reason = `Estoque esgotado na barraca (0 unidades)!`;
      if (hasInBackpack) {
        reason = `Você tem ${p.backpackStock} na mochila prontos para colocar na barraca!`;
      } else if (alreadyRipe) {
        reason = `Tem ${p.ripePlots} pronto(s) para colher na horta!`;
      } else if (alreadyGrowing) {
        reason = `Já tem ${p.growingPlots} plantado(s) crescendo na horta.`;
      }

      recommendations.push({
        productId: p.productId,
        productName: p.name,
        icon: p.icon,
        priority: 'high',
        reason,
        suggestedPlantCount: p.type === 'crop' ? Math.max(1, Math.min(emptyPlotsCount || 2, 3)) : 1,
        availableEmptyPlots: emptyPlotsCount,
        hasSeedsInBackpack: p.seedCountInBackpack > 0,
        seedCountInBackpack: p.seedCountInBackpack,
        seedCost: p.seedCost,
        isAnimalProduct: p.type === 'animal',
        actionTip: hasInBackpack
          ? `Abra o Mercado e abasteça a barraca com as unidades da sua mochila!`
          : p.type === 'crop'
          ? p.seedCountInBackpack > 0
            ? `Plante ${Math.min(p.seedCountInBackpack, emptyPlotsCount || 2)} sementes agora mesmo!`
            : `Adquira sementes na loja por ${p.seedCost} 🪙 cada.`
          : 'Cuide dos animais para produzir ovos, leite e lã fresca.',
      });
    }

    // Produtos com estoque baixo (1 a 3 unidades)
    for (const p of lowProducts) {
      if (recommendations.some((r) => r.productId === p.productId)) continue;
      recommendations.push({
        productId: p.productId,
        productName: p.name,
        icon: p.icon,
        priority: 'medium',
        reason: `Restam apenas ${p.stallStock} unidade(s) na barraca.`,
        suggestedPlantCount: p.type === 'crop' ? 2 : 1,
        availableEmptyPlots: emptyPlotsCount,
        hasSeedsInBackpack: p.seedCountInBackpack > 0,
        seedCountInBackpack: p.seedCountInBackpack,
        seedCost: p.seedCost,
        isAnimalProduct: p.type === 'animal',
        actionTip:
          p.backpackStock > 0
            ? `Você possui ${p.backpackStock} na mochila para reforçar o estoque.`
            : `Prepare nova safra para não deixar o estoque zerar.`,
      });
    }

    // 6. Determinar o status geral da fazenda
    let overallStatus: 'all_stocked' | 'attention_needed' | 'critical_stockout' = 'all_stocked';
    if (exhaustedProducts.length > 0 || unreadMissedSaleNotifications > 0) {
      overallStatus = 'critical_stockout';
    } else if (lowProducts.length > 0) {
      overallStatus = 'attention_needed';
    }

    // 7. Formular a fala inteligente da Isa (estritamente contextual conforme requisitos)
    const primaryMessage = this.generateContextualSpeech({
      overallStatus,
      exhaustedProducts,
      lowProducts,
      monitoredProducts,
      missedDemands: urgentDemands,
      emptyPlotsCount,
    });

    return {
      overallStatus,
      monitoredProducts,
      exhaustedProducts,
      lowProducts,
      normalProducts,
      recommendations,
      primaryMessage,
      unreadMissedSaleNotifications,
      totalStallUnits,
      emptyPlotsCount,
      totalPlotsCount: plots.length,
    };
  }

  /**
   * Cria falas contextuais autênticas da Isa baseadas na situação real da fazenda
   */
  private generateContextualSpeech(context: {
    overallStatus: 'all_stocked' | 'attention_needed' | 'critical_stockout';
    exhaustedProducts: MonitoredProduct[];
    lowProducts: MonitoredProduct[];
    monitoredProducts: MonitoredProduct[];
    missedDemands: MonitoredProduct[];
    emptyPlotsCount: number;
  }): { text: string; animation: IsaAnimationState; priority: 'critical' | 'high' | 'normal' | 'idle' } {
    // Caso 1: NPC procurou um produto específico e não encontrou
    if (context.missedDemands.length > 0) {
      const top = context.missedDemands[0];
      return {
        text: `Um cliente procurou ${top.name.toLowerCase()} e não encontrou. Vamos reabastecer nossa barraca para não perder mais vendas!`,
        animation: 'surprised',
        priority: 'critical',
      };
    }

    // Caso 2: Milho esgotado especificamente (cultura principal da fazendinha)
    const cornExhausted = context.exhaustedProducts.find((p) => p.productId === 'corn');
    if (cornExhausted) {
      return {
        text: 'Olha, está faltando milho na nossa barraca! Vamos plantar mais?',
        animation: 'jumping',
        priority: 'high',
      };
    }

    // Caso 3: Feijão acabando especificamente
    const beanLow = context.lowProducts.find((p) => p.productId === 'bean');
    if (beanLow && context.lowProducts.length === 1 && context.exhaustedProducts.length === 0) {
      return {
        text: 'Percebi que nosso feijão está acabando. Precisamos preparar uma nova plantação!',
        animation: 'idle',
        priority: 'normal',
      };
    }

    // Caso 4: Dois ou mais produtos baixos (ex: milho e feijão)
    if (context.lowProducts.length >= 2) {
      const p1 = context.lowProducts[0].name.toLowerCase();
      const p2 = context.lowProducts[1].name.toLowerCase();
      return {
        text: `Temos um probleminha! O ${p1} e o ${p2} estão acabando. Vamos cuidar dessas plantações?`,
        animation: 'surprised',
        priority: 'high',
      };
    }

    // Caso 5: Outro produto esgotado
    if (context.exhaustedProducts.length > 0) {
      const prod = context.exhaustedProducts[0];
      return {
        text: `Acabou nosso estoque de ${prod.name.toLowerCase()}! Precisamos produzir mais para atender os clientes.`,
        animation: 'surprised',
        priority: 'high',
      };
    }

    // Caso 6: Apenas 1 produto baixo
    if (context.lowProducts.length === 1) {
      const prod = context.lowProducts[0];
      return {
        text: `Nosso estoque de ${prod.name.toLowerCase()} está baixinho na barraca. Que tal já preparar a colheita?`,
        animation: 'idle',
        priority: 'normal',
      };
    }

    // Caso 7: Estoque todo normal e bem abastecido!
    return {
      text: 'Está tudo certinho! Nossa barraca está bem abastecida.',
      animation: 'cheering',
      priority: 'idle',
    };
  }

  /**
   * Dispara a fala da Isa apenas se houver novidade e fora do cooldown
   */
  public triggerSpontaneousStockAlert(diagnosis: IsaAssistantDiagnosis, force = false): boolean {
    const now = Date.now();
    const key = `${diagnosis.overallStatus}-${diagnosis.primaryMessage.text}`;

    if (!force) {
      // Se não há problema ou se acabou de falar a mesma coisa recentemente, não perturba o jogador
      if (diagnosis.overallStatus === 'all_stocked') return false;
      if (now - this.lastAlertTimestamp < this.ALERT_COOLDOWN_MS) return false;
      if (this.lastSpokenKey === key && now - this.lastAlertTimestamp < 90000) return false;
    }

    this.lastAlertTimestamp = now;
    this.lastSpokenKey = key;

    isaVoiceManager.speak(diagnosis.primaryMessage.text, diagnosis.primaryMessage.animation, {
      priority: diagnosis.primaryMessage.priority,
      bypassCooldown: force,
    });

    return true;
  }

  /**
   * Fala de celebração quando o jogador reabastece a barraca com sucesso
   */
  public onRestockCelebration(productName?: string) {
    const speech = productName
      ? `Ótimo trabalho! Nossa barraca está abastecida de ${productName} novamente!`
      : 'Ótimo trabalho! Nossa barraca está abastecida novamente.';

    isaVoiceManager.speak(speech, 'clapping', {
      priority: 'high',
      bypassCooldown: true,
    });
  }

  /**
   * Fala de congratulação quando um item que estava faltando é colhido na horta
   */
  public onHarvestDeficitCrop(cropName: string) {
    isaVoiceManager.speak(
      `Que colheita maravilhosa de ${cropName}! Já podemos colocar na barraca para os clientes!`,
      'jumping',
      { priority: 'high', bypassCooldown: true }
    );
  }
}

export const isaAssistantService = new IsaAssistantService();
