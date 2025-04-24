"use client"

import { useState } from "react"
import { toast } from "sonner"
import { PlusCircle, Trash2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AddProductDialog } from "./AddProductDialog"
import { ProductOnline, ProductSearchViewer } from "./ProductSearchViewer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { v4 as uuidv4 } from "uuid"
import { useMutation } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useTRPC } from "@/trpc/client"
import { Product } from "@/trpc/api/routers/requests"
import { Separator } from "@/components/ui/separator"
import { useRequestDetailStore } from "@/store/requestDetailStore"

interface ProductListProps {
  requestId: string;
  initialProducts?: Product[];
}

export default function ProductList({ requestId, initialProducts = [] }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const trpc = useTRPC()

  const updateProductMutationOptions = trpc.requests.updateProduct.mutationOptions({
    onMutate: async ({ product }) => {
      const updatedProducts = [...products, product];
      setProducts(updatedProducts);
      // Recalculate totals
      const totalPrice = updatedProducts.reduce((sum, p) => sum + p.price, 0);
      const totalWeight = updatedProducts.reduce((sum, p) => sum + (p.weight || 0), 0);
      // Update store with both price and weight
      const store = useRequestDetailStore.getState();
      store.setBasePrice(totalPrice);
      store.setWeight(totalWeight);
      return { addedProduct: product, totalPrice, totalWeight };
    },
    onError: (error, { product }) => {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.error(`Error al agregar el producto: ${error.message}`);
    }
  });

  const updateProductMutation = useMutation(updateProductMutationOptions);

  const deleteProductMutationOptions = trpc.requests.deleteSingleProduct.mutationOptions({
    onMutate: async ({ id }) => {
      const prevProducts = products;
      const deletedProduct = products.find((p) => p.id === id);
      const updatedProducts = products.filter((p) => p.id !== id);
      setProducts(updatedProducts);
      // Recalculate totals
      const totalPrice = updatedProducts.reduce((sum, p) => sum + p.price, 0);
      const totalWeight = updatedProducts.reduce((sum, p) => sum + (p.weight || 0), 0);
      // Update store with both price and weight
      const store = useRequestDetailStore.getState();
      store.setBasePrice(totalPrice);
      store.setWeight(totalWeight);
      return { prevProducts, deletedProduct, totalPrice, totalWeight };
    },
    onError: (error, {  }, context) => {
      if (context?.deletedProduct) {
        setProducts((prev) => [...prev, context.deletedProduct as Product]);
      } else if (context?.prevProducts) {
        setProducts(context.prevProducts);
      }
      toast.error(`Error al eliminar el producto: ${error.message}`);
    },
    onSettled: () => {
      setDeletingProductId(null);
    }
  });

  const deleteProductMutation = useMutation(deleteProductMutationOptions);


  const handleUpdateProduct = async (product: Product) => {
    await updateProductMutation.mutateAsync({
      requestId,
      product: {
        id: product.id,
        request_id: product.request_id,
        title: product.title,
        price: product.price,
        weight: product.weight,
        description: product.description || '',
        source: product.source as "amazon" | "ebay" | "jomashop" | "manual",
        image_url: product.image_url,
        imageData: product.imageData
      }
    });
  };

  const handleDeleteProduct = async (productId: string, image_url: string | null) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      setDeletingProductId(productId);
      await deleteProductMutation.mutateAsync({
        requestId,
        id: productId,
        image_url,
      });
    }
  };

  const totalProducts = products.length
  const totalPrice = products.reduce((sum, product) => sum + product.price, 0)
  const totalWeight = products.reduce((sum, product) => sum + (product.weight || 0), 0)
  const digitalProductsCount = products.filter(product => product.weight === 0).length

  function getInitials(title: string) {
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Productos</CardTitle>
        </div>
        <ProductSearchViewer
          onProductSelect={(product: ProductOnline) => {
            const newProduct: Product = {
              id: uuidv4(),
              title: product.title,
              price: product.price,
              weight: 0.5, // Default weight
              description: "",
              source: product.source,
              image_url: product.image,
              request_id: requestId
            };
            handleUpdateProduct(newProduct)
          }}
          buttonOnly
        />
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 overflow-hidden pt-2">
        {products.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
            <PlusCircle className="h-10 w-10 mb-2" strokeWidth={1.25} />
            <p>No hay productos seleccionados.</p>
            <p>Haz clic en Agregar producto para comenzar.</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100%-2rem)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14"></TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="w-24 text-right">Precio</TableHead>
                  <TableHead className="w-24 text-right">Peso</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Avatar className="w-10 h-10">
                        {product.image_url && (
                          <AvatarImage src={product.image_url} />
                        )} 
                        {product.imageData && (
                          <AvatarImage src={product.imageData} />
                        )}
                        <AvatarFallback>{getInitials(product.title)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{product.title}</span>
                        <Badge
                          variant="outline"
                          className="w-fit text-xs capitalize"
                        >
                          {product.source}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.weight === 0 ? (
                        <Badge variant="outline" className="ml-auto bg-blue-50" title="Producto digital sin peso físico">
                          Digital
                        </Badge>
                      ) : (
                        `${product.weight.toFixed(2)} kg`
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id, product.image_url)}
                          disabled={!!deletingProductId}
                        >
                          {deletingProductId === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between items-center">
        <div className="text-sm">
          <div className="font-medium">{totalProducts} productos</div>
          <div className="text-muted-foreground">
            Total: ${totalPrice.toFixed(2)} | Peso: {totalWeight.toFixed(2)} kg
            {digitalProductsCount > 0 && ` (${digitalProductsCount} digital)`}
          </div>
        </div>
        <div className="flex gap-2">
          <AddProductDialog
            onAddProduct={(product) => {
              handleUpdateProduct(product)
            }}
          >
            <Button>
              <PlusCircle className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </AddProductDialog>
        </div>
      </CardFooter>


    </Card>
  )
} 