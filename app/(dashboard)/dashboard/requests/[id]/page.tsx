"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardDescription, CardFooter, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useSupabaseClient } from "@/lib/supabase-client"
import { formatDistance } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Search, Save, BrainCircuit, Package, Star, Mail, MessageCircle, Send } from "lucide-react"
import { PricingCalculator } from "@/components/pricing-calculator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

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
  email_sent?: boolean
  whatsapp_sent?: boolean
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
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const { getAuthenticatedClient } = useSupabaseClient();

  useEffect(() => {
    fetchRequestDetails()
  })

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
          url,
          email_sent,
          whatsapp_sent
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
      
      // Initialize email and WhatsApp sent flags
      setEmailSent(data.email_sent || false);
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
    setResponse(""); // Clear response when searching
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
    setResponse(""); // Clear response when selecting product
    setSelectedProduct(product);
  };

  const handleSaveResponse = async () => {
    if (!response.trim()) {
      toast.warning("No hay respuesta para guardar");
      return;
    }

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

  const handleSendEmail = async () => {
    if (!request?.client.email || !response.trim()) {
      toast.warning("No hay respuesta para enviar");
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.client.email,
          subject: 'Respuesta a tu solicitud de cotización',
          content: response
        }),
      });

      if (!res.ok) throw new Error('Failed to send email');
      
      // Update the database to mark email as sent
      const supabase = await getAuthenticatedClient();
      await supabase
        .from("purchase_requests")
        .update({
          email_sent: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", params.id);
      
      toast.success('Email enviado correctamente');
      
      // Mark email as sent
      setEmailSent(true);
      
      // Save response after sending
      await handleSaveResponse();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error al enviar el email');
    } finally {
      setIsSendingEmail(false);
    }
  };

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
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={!response.trim() || isSendingEmail}
                className={`transition-all ${!response.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-primary hover:text-primary-foreground"}`}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1">
              {request?.client.email && (
                <DropdownMenuItem 
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="flex items-center cursor-pointer py-2 px-3 rounded-md hover:bg-secondary transition-colors"
                >
                  {isSendingEmail ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Mail className={`w-4 h-4 mr-2 ${emailSent ? "text-green-500" : ""}`} />
                  )}
                  {emailSent ? "Email enviado anteriormente" : "Enviar por Email"}
                </DropdownMenuItem>
              )}
              {request?.client.phone_number && (
                <DropdownMenuItem 
                  disabled={true}
                  className="flex items-center cursor-not-allowed py-2 px-3 rounded-md opacity-50"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp deshabilitado
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={handleSaveResponse}
            className="gap-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium border-0"
          >
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* First Column - Product Search */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden border-none shadow-md">
            <CardHeader className="">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                <CardTitle className="text-lg font-semibold">Buscar productos</CardTitle>
              </div>
              <CardDescription className="">
                Encuentra alternativas en Amazon, eBay y Jomashop para comparar precios y obtener la mejor oferta
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Search input and store selection */}
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Buscar
                </Button>
              </div>

              <Card className="border">
                <CardContent className="p-4 space-y-3">
                  <div className="w-full">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Seleccionar tiendas (máx. 3)</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
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
                </CardContent>
              </Card>

              {/* Products list */}
              {filteredProducts.length > 0 ? (
                <div className="relative h-[600px] pr-2 group">
                  <div className="absolute inset-0 overflow-y-auto space-y-3 custom-scrollbar">
                    {filteredProducts.map((product) => {
                      // Create a unique identifier for each product
                      const productUniqueId = `${product.source}-${product.id}`;
                      const isSelected = selectedProduct && 
                        selectedProduct.title === product.title && 
                        selectedProduct.source === product.source;
                      
                      return (
                        <Card
                          key={productUniqueId}
                          className={`flex gap-4 p-4 ${
                            isSelected 
                              ? "bg-primary/5 border-primary" 
                              : "hover:bg-accent/50"
                          } transition-all duration-200`}
                        >
                          <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted">
                            {product.image ? (
                              <div 
                                className="w-full h-full bg-center bg-cover cursor-pointer"
                                style={{ backgroundImage: `url(${product.image})` }}
                                onClick={() => {
                                  const url = getStoreProductUrl(product);
                                  if (url !== '#') {
                                    window.open(url, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>

                          <div className="flex-grow min-w-0 flex flex-col justify-between">
                            <div>
                              <h3 className="font-medium text-sm line-clamp-2">{product.title}</h3>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary">
                                  {product.source === 'amazon' ? 'Amazon' : product.source === 'ebay' ? 'eBay' : 'Jomashop'}
                                </Badge>
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
                                variant={isSelected ? "default" : "secondary"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectProduct(product);
                                }}
                              >
                                {isSelected ? "Seleccionado" : "Cotizar"}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="flex items-start gap-4 p-4">
                      <Skeleton className="w-20 h-20 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Column - Details and Calculator */}
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



        {/* Third Column - Response */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Respuesta</h3>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={generateEmailText}
                disabled={isGenerating || !selectedProduct}
                className={!selectedProduct ? "opacity-50 cursor-not-allowed" : ""}
              >
                {isGenerating ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                ) : (
                  <BrainCircuit className="mr-2 h-4 w-4" />
                )}
                Generar respuesta
              </Button>
            </div>
          </div>
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Escribe tu respuesta aquí..."
            className={`min-h-[600px] resize-none ${!response.trim() ? 'border-dashed border-muted-foreground/30' : ''}`}
          />
        </div>
      </div>
    </div>
  )
}
