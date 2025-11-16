"use client"

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import { menu } from "@/config/menu";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Edit2, Check, X } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function DashboardContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const description = menu.find(item => item.path === pathname)?.description;

  const [isEditingBuy, setIsEditingBuy] = useState(false);
  const [isEditingSell, setIsEditingSell] = useState(false);
  const [buyInput, setBuyInput] = useState('');
  const [sellInput, setSellInput] = useState('');

  const trpc = useTRPC();
  const { data: currentExchangeRate, refetch } = useQuery({
    ...trpc.exchangeRate.getCurrent.queryOptions(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const buyRate = currentExchangeRate?.buy_price ?? 3.65;
  const sellRate = currentExchangeRate?.sell_price ?? 3.75;

  // Tipo de cambio ajustado (+0.02 para compra, -0.02 para venta)
  const buyAdjustment = 0.02;
  const sellAdjustment = 0.02;
  const adjustedBuyRate = buyRate + buyAdjustment;
  const adjustedSellRate = sellRate - sellAdjustment;

  useEffect(() => {
    if (buyRate > 0) setBuyInput(buyRate.toFixed(4));
    if (sellRate > 0) setSellInput(sellRate.toFixed(4));
  }, [buyRate, sellRate]);

  const handleSaveBuy = async () => {
    const value = parseFloat(buyInput);
    if (!isNaN(value) && value > 0) {
      // TODO: Guardar en backend
      setIsEditingBuy(false);
      toast.success('TC Compra actualizado');
    } else {
      toast.error('Valor inválido');
      setBuyInput(buyRate.toFixed(4));
    }
  };

  const handleSaveSell = async () => {
    const value = parseFloat(sellInput);
    if (!isNaN(value) && value > 0) {
      // TODO: Guardar en backend
      setIsEditingSell(false);
      toast.success('TC Venta actualizado');
    } else {
      toast.error('Valor inválido');
      setSellInput(sellRate.toFixed(4));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between h-10 mb-8">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="!h-6" />
          <h1 className="text-sm font-semibold text-muted-foreground">{description}</h1>
        </div>
        
        {/* Tipos de Cambio */}
        <div className="flex items-center gap-4 text-xs">
          {/* Compra con ajuste */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Compra:</span>
            {isEditingBuy ? (
              <>
                <input
                  type="number"
                  step="0.0001"
                  value={buyInput}
                  onChange={(e) => setBuyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveBuy()}
                  className="w-16 px-1 py-0.5 text-xs text-right border rounded"
                  autoFocus
                />
                <Button size="icon" className="h-5 w-5" onClick={handleSaveBuy}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setIsEditingBuy(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-muted-foreground">{buyRate.toFixed(4)}</span>
                  <span className="text-orange-600">+{buyAdjustment.toFixed(2)}</span>
                  <span className="text-muted-foreground">=</span>
                  <span className="font-mono font-semibold">{adjustedBuyRate.toFixed(4)}</span>
                </div>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setIsEditingBuy(true)}>
                  <Edit2 className="h-2.5 w-2.5" />
                </Button>
              </>
            )}
          </div>

          <Separator orientation="vertical" className="!h-4" />

          {/* Venta */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Venta:</span>
            {isEditingSell ? (
              <>
                <input
                  type="number"
                  step="0.0001"
                  value={sellInput}
                  onChange={(e) => setSellInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveSell()}
                  className="w-16 px-1 py-0.5 text-xs text-right border rounded"
                  autoFocus
                />
                <Button size="icon" className="h-5 w-5" onClick={handleSaveSell}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setIsEditingSell(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-muted-foreground">{sellRate.toFixed(4)}</span>
                  <span className="text-blue-600">-{sellAdjustment.toFixed(2)}</span>
                  <span className="text-muted-foreground">=</span>
                  <span className="font-mono font-semibold">{adjustedSellRate.toFixed(4)}</span>
                </div>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setIsEditingSell(true)}>
                  <Edit2 className="h-2.5 w-2.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-5">
        {children}
      </div>
    </div>
  );
}