"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardDescription, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useSupabaseClient } from "@/lib/supabase-client"
import { formatDistance } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Search, Save, BrainCircuit, Package, Star } from "lucide-react"
import { PricingCalculator } from "@/components/pricing-calculator"
import { use } from "react"
import { Skeleton } from "@/components/ui/skeleton"

type PurchaseRequest = {
  id: string
  description: string
  client: {
    email: string
    phone_number: string
    name?: string
  }
  assigned_user?: {
    id: string
    name: string
  }
  status?: "pending" | "approved" | "rejected"
  created_at?: string
  updated_at?: string
  price?: number
  response?: string
  url?: string
}

type Product = {
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

type StoreType = 'amazon' | 'ebay' | 'jomashop' | 'fragancex' | 'sephora' | 'jessupbeauty' | 'rarebeauty' | 'beautycreations';

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

export default function RequestDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const [request, setRequest] = useState<PurchaseRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [basePrice, setBasePrice] = useState(0)
  const [selectedStores, setSelectedStores] = useState<Set<StoreType>>(new Set(['amazon', 'ebay']))
  const [response, setResponse] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [calculations, setCalculations] = useState({
    totalUSD: 0,
    totalPEN: 0,
    exchangeRate: 3.7
  })
  const { getAuthenticatedClient } = useSupabaseClient();

  useEffect(() => {
    fetchRequestDetails()
  }, [params.id])

  const fetchRequestDetails = async () => {
    try {
      const supabase = await getAuthenticatedClient();
      
      if (!supabase.isAuthenticated) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from("purchase_requests")
        .select(`
          id,
          description,
          price,
          status,
          response,
          created_at,
          updated_at,
          client:clients(email, phone_number, name),
          assigned_user:users(id, name),
          url
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error;
      
      console.log("Fetched request:", data)
      const formattedData = {
        ...data,
        client: Array.isArray(data.client) ? data.client[0] : data.client,
        assigned_user: Array.isArray(data.assigned_user) ? data.assigned_user[0] : data.assigned_user
      }
      setRequest(formattedData)
      setBasePrice(data.price || 0)
      setResponse(data.response || "")
    } catch (error) {
      console.error("Error fetching request details:", error)
      toast("Error loading request details")
    }
    setIsLoading(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast("Cuidado!", {
        description: "Por favor ingrese un término de búsqueda"
      });
      return;
    }
    if (selectedStores.size === 0) {
      toast("Por favor seleccione al menos una tienda");
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({ 
        query: searchQuery,
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
      console.error("Error searching products:", error);
      toast("Error al buscar productos");
    } finally {
      setIsSearching(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStoreProductUrl = (product: any) => {
    switch (product.source) {
      case 'amazon':
        return product.link || `https://www.amazon.com/dp/${product.id}`;
      case 'ebay':
        const ebayId = product.link?.split('/itm/')[1]?.split('?')[0];
        return ebayId ? `https://www.ebay.com/itm/${ebayId}` : product.link;
      case 'jomashop':
        return `${product.url}`;
      default:
        return product.link || '#';
    }
  };

  const handleSelectProduct = (product: Product) => {
    setBasePrice(product.price);
    toast(`${product.source.toUpperCase()}: $${product.price.toFixed(2)}`);
  };

  const handleSaveResponse = async () => {
    const supabase = await getAuthenticatedClient();

    const { error } = await supabase
      .from("purchase_requests")
      .update({ 
        response, 
        price: basePrice,
        updated_at: new Date().toISOString() 
      })
      .eq("id", params.id)

    if (error) {
      console.error("Error saving response:", error)
      toast("Error al guardar")
    } else {
      toast("Guardado")
      fetchRequestDetails()
    }
  }

  const generateEmailText = async () => {
    const clientName = request?.client?.name || "Cliente"
    const prompt = `Generate a professional email response for a purchase request quotation. 
                    Address the client as "${clientName}". The final price is $ ${calculations.totalUSD.toFixed(2)} or S/. ${calculations.totalPEN.toFixed(2)}. 
                    Explain the quotation briefly in simple terms for an average person. Mention that after the product arrives to Miami, 
                    it will take a maximum of 7 days to reach the customer. 
                    Keep the email concise and friendly. Do not include specific percentages or breakdowns of the costs. Write it in Spanish. Do not include a signature. Make sure the email ends with a period.`

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate email")
      }

      const data = await response.json()
      setResponse(data.email)
    } catch (error) {
      console.error("Error generating email:", error)
      toast("Error", {
        description: "Error al generar el correo. Por favor, intente nuevamente o escriba su propia respuesta."
      })
    } finally {
      setIsGenerating(false)
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

  const filteredProducts = products.filter(product => selectedStores.has(product.source));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 h-10 mb-16">
          <SidebarTrigger />
          <Separator orientation="vertical" className="!h-6" />
          <h1 className="font-light text-neutral-100 text-sm tracking-tight">Detalles del pedido</h1>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* First Column - Details and Calculator */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-40 mb-2" />
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Calculator Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-7 w-40" />
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <Skeleton className="h-7 w-40" />
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Second Column - Product Search */}
          <Card className="h-[calc(100vh-32px)]">
            <CardHeader className="pb-4">
              <Skeleton className="h-7 w-40 mb-2" />
              <Skeleton className="h-5 w-64" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col h-[calc(100%-100px)]">
                <div className="space-y-4 mb-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-24" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 rounded-lg border bg-card/50">
                      <Skeleton className="w-20 h-20 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Third Column - Response */}
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-9 w-36" />
              </div>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-8rem)]">
              <Skeleton className="flex-grow min-h-[400px]" />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 h-10 mb-16">
          <SidebarTrigger />
          <Separator orientation="vertical" className="!h-6" />
          <h1 className="font-light text-neutral-100 text-sm tracking-tight">Pedido no encontrado</h1>
        </div>
        <Button onClick={() => router.push("/dashboard/requests")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a pedidos
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 h-10 mb-16">
        <SidebarTrigger />
        <Separator orientation="vertical" className="!h-6" />
        <h1 className="font-light text-neutral-100 text-sm tracking-tight">Detalles del pedido</h1>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/dashboard/requests")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a pedidos
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">Pedido #{params.id}</h2>
        </div>
        <Button 
          onClick={handleSaveResponse}
          className="gap-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium border-0"
        >
          <Save className="h-4 w-4" />
          Guardar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* First Column - Details and Calculator */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                Creado {request.created_at ? formatDistance(
                  new Date(request.created_at),
                  new Date(),
                  { addSuffix: true, locale: es }
                ) : ""}
                <span className="inline-block w-1 h-1 bg-muted-foreground/30 rounded-full" />
                Actualizado {request.updated_at ? formatDistance(
                  new Date(request.updated_at),
                  new Date(),
                  { addSuffix: true, locale: es }
                ) : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">Descripción</Label>
                <p className="text-sm text-muted-foreground">{request.description || "-"}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-base font-medium">URL</Label>
                <p className="text-sm text-muted-foreground">{request.url || "-"}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Cliente</Label>
                  <p className="text-sm mt-1 text-muted-foreground">
                    {request.client.name || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estado</Label>
                  <p className="text-sm mt-1 text-muted-foreground">
                    {request.status === "pending" ? "Pendiente" : 
                     request.status === "approved" ? "Aprobado" : 
                     request.status === "rejected" ? "Rechazado" : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Correo</Label>
                  <p className="text-sm mt-1 text-muted-foreground">
                    {request.client.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Teléfono</Label>
                  <p className="text-sm mt-1 text-muted-foreground">
                    {request.client.phone_number}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Calculator */}
          <PricingCalculator 
            basePrice={basePrice}
            onBasePriceChange={setBasePrice}
            onCalculationsChange={setCalculations}
          />
        </div>

        {/* Second Column - Product Search */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Buscar productos</h3>
            <p className="text-sm text-muted-foreground">
              Encuentra alternativas en Amazon, eBay y Jomashop para comparar precios y obtener la mejor oferta
            </p>
            
            <div className="space-y-4">
              {/* Search input and store selection */}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Buscar
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {STORES.map(store => (
                  <div key={store.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={store.id}
                      checked={selectedStores.has(store.id as StoreType)}
                      onCheckedChange={() => handleStoreToggle(store.id as StoreType)}
                      disabled={!store.enabled || (!selectedStores.has(store.id as StoreType) && selectedStores.size >= 3)}
                    />
                    <Label 
                      htmlFor={store.id}
                      className={store.enabled ? "" : "text-muted-foreground"}
                    >
                      {store.name}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Products list */}
              {filteredProducts.length > 0 ? (
                <div className="relative h-[700px] pr-2 group">
                  <div className="absolute inset-0 overflow-y-auto space-y-2 custom-scrollbar">
                    {filteredProducts.map((product) => (
                      <div
                        key={`${product.source}-${product.title}`}
                        onClick={() => {
                          const url = getStoreProductUrl(product);
                          if (url !== '#') {
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className={`
                          flex items-start gap-4 p-3 cursor-pointer rounded-lg border bg-card
                          hover:border-primary hover:shadow-md transition-all
                          ${!product.link ? 'opacity-70' : ''}
                        `}
                      >
                        <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-product.png'; // Add this image to your public folder
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-grow min-w-0 flex flex-col justify-between">
                          <div>
                            <h3 className="font-medium text-sm line-clamp-2">{product.title}</h3>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-1.5 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                                {product.source === 'amazon' ? 'Amazon' : product.source === 'ebay' ? 'eBay' : 'Jomashop'}
                              </span>
                              {product.rating > 0 && (
                                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-current" /> {product.rating}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm font-semibold">${product.price.toFixed(2)}</span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectProduct(product);
                              }}
                              className="cursor-pointer"
                            >
                              Cotizar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 rounded-lg border bg-card/50">
                      <Skeleton className="w-20 h-20 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Third Column - Response */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Respuesta</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={generateEmailText}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
            >
              {isGenerating ? (
                <span className="flex items-center gap-1">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Generando...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <BrainCircuit className="h-4 w-4" />
                  Generado con IA
                </span>
              )}
            </Button>
          </div>
          <Textarea 
            value={response} 
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            className="min-h-[600px] resize-none"
          />
        </div>
      </div>
    </div>
  )
}
