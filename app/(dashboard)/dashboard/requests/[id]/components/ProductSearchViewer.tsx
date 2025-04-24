"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Search, ShoppingBag, Star, Package, Store } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

export type ProductOnline = {
  id: string
  title: string
  price: number
  image: string
  source: "amazon" | "ebay" | "jomashop"
  url: string
  link: string
  rating: number
  reviews: number
}

export type StoreType = 'amazon' | 'ebay' | 'jomashop' | 'fragancex' | 'sephora' | 'jessupbeauty' | 'rarebeauty' | 'beautycreations';

const STORES = [
  { id: 'amazon', name: 'Amazon', enabled: true },
  { id: 'ebay', name: 'eBay', enabled: true },
  { id: 'jomashop', name: 'Jomashop', enabled: true },
  { id: 'fragancex', name: 'FragranceX', enabled: false },
  { id: 'sephora', name: 'Sephora', enabled: false },
  { id: 'jessupbeauty', name: 'Jessup Beauty', enabled: false },
  { id: 'rarebeauty', name: 'Rare Beauty', enabled: false },
  { id: 'beautycreations', name: 'Beauty Creations', enabled: false },
] as const;

type ProductSearchProps = {
  onProductSelect: (product: ProductOnline) => void;
  buttonOnly?: boolean;
}

export function ProductSearchViewer({
  onProductSelect,
  buttonOnly = false
}: ProductSearchProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStores, setSelectedStores] = useState<Set<StoreType>>(new Set(['amazon', 'jomashop']))
  const [products, setProducts] = useState<ProductOnline[]>([])
  const [localQuery, setLocalQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  // Track image errors per product
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  const handleSearch = async () => {
    if (!localQuery.trim()) {
      toast("Por favor ingrese un término de búsqueda");
      return;
    }

    if (selectedStores.size === 0) {
      toast("Por favor seleccione al menos una tienda");
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        query: localQuery,
        stores: Array.from(selectedStores).join(',')
      });

      const response = await fetch(`/api/search-products?${params}`);
      if (!response.ok) throw new Error("Failed to search products");

      const data = await response.json();
      if (data.results.length === 0) {
        toast("No se encontraron productos");
      }
      setProducts(data.results);
    } catch (error) {
      toast("Error al buscar productos");
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }

  const handleStoreToggle = (storeId: StoreType) => {
    const newSelected = new Set(selectedStores);
    if (newSelected.has(storeId)) {
      newSelected.delete(storeId);
    } else if (newSelected.size < 3) {
      newSelected.add(storeId);
    } else {
      toast("Máximo 3 tiendas");
      return;
    }
    setSelectedStores(newSelected);
  };

  if (buttonOnly) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            className=" bg-white border-0 cursor-pointer"
            size="sm"
          >
            <ShoppingBag className="h-4 w-4 text-black" />
          </Button>
        </SheetTrigger>
        {renderSheetContent()}
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="link" className="w-fit px-0 text-left text-foreground">
          Search products online
        </Button>
      </SheetTrigger>
      {renderSheetContent()}
    </Sheet>
  );

  function renderSheetContent() {
    return (
      <SheetContent side="right" className="flex flex-col p-0 gap-0 max-w-md sm:max-w-lg">
        <div className="sticky top-0 z-10 bg-background p-6 pb-4 border-b">
        <SheetHeader className="gap-1">
          <SheetTitle>Buscar productos</SheetTitle>
          <SheetDescription>
            Encuentra alternativas en Amazon, eBay y Jomashop para comparar precios y obtener la mejor oferta
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={localQuery}
                className="pl-9"
                onChange={(e) => setLocalQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="min-w-[100px]"
            >
              {isSearching ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : null}
              {isSearching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Seleccionar tiendas</p>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {selectedStores.size}/3
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {STORES.filter(s => s.enabled).map(store => {
                const checked = selectedStores.has(store.id as StoreType);
                const StoreIcon = store.id === 'amazon' ? Package : 
                                store.id === 'ebay' ? ShoppingBag : Store;
                return (
                  <Card
                    key={store.id}
                    onClick={() => handleStoreToggle(store.id as StoreType)}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-3 gap-2 h-full",
                      "cursor-pointer border transition-all duration-200",
                      "hover:border-primary/50",
                      checked ? "border-primary ring-1 ring-primary" : ""
                    )}
                    role="button"
                  >
                    <StoreIcon className={cn(
                      "w-5 h-5 transition-colors",
                      checked ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium transition-colors text-center",
                      checked ? "text-primary" : ""
                    )}>
                      {store.name}
                    </span>
                    {checked && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
        </div>

        <ScrollArea className="flex-1 px-6 pb-2">
          <div className="space-y-4 py-4">
          {isSearching && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {!isSearching && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-10 h-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm">
                {localQuery.trim() ? "No se encontraron productos" : "Busca productos para mostrar resultados"}
              </p>
              {localQuery.trim() && (
                <p className="text-xs text-muted-foreground mt-1">
                  Intenta con otros términos o selecciona otras tiendas
                </p>
              )}
            </div>
          )}

          {!isSearching && products.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Resultados
                  <Badge variant="outline" className="ml-1">
                    {products.length}
                  </Badge>
                </div>
              </div>
              {products.map(product => {
                const imgError = imgErrorMap[product.id] || false;
                function handleImgError() {
                  setImgErrorMap(prev => ({ ...prev, [product.id]: true }));
                }
                function getInitials(title: string) {
                  return title
                    .split(' ')
                    .map(word => word[0]?.toUpperCase())
                    .join('')
                    .slice(0, 2);
                }
                return (
                  <Card
                    key={product.id}
                    className={cn(
                      "group flex items-start gap-4 p-4",
                      "border cursor-pointer transition-all duration-150",
                      "hover:border-primary"
                    )}
                    onClick={() => {
                      onProductSelect(product);
                      setIsOpen(false);
                    }}
                  >
                    <div className="relative aspect-square w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border">
                      {imgError || !product.image ? (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-lg font-semibold text-muted-foreground">
                          {getInitials(product.title)}
                        </div>
                      ) : (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
                          onError={handleImgError}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="space-y-1.5">
                        <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                          {product.title}
                        </h3>
                        <div className="flex items-center flex-wrap gap-2 text-sm">
                          <Badge variant="outline" className="text-xs font-normal">
                            {product.source.toUpperCase()}
                          </Badge>
                          {product.rating > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Star className="w-3 h-3" />
                              <span className="text-xs">{product.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-semibold text-base">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.reviews > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {product.reviews} reviews
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </>
          )}
          </div>
        </ScrollArea>
        <SheetFooter className="sticky bottom-0 border-t bg-background p-4">
          <SheetClose asChild>
            <Button variant="outline" size="lg" className="w-full">
              Cerrar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    );
  }
}