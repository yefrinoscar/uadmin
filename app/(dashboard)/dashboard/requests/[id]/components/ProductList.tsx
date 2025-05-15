/* eslint-disable */

"use client"

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { v4 as uuidv4 } from "uuid"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useTRPC } from "@/trpc/client"
import { Product } from "@/trpc/api/routers/requests"
import { useRequestDetailStore } from "@/store/requestDetailStore"
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender,
  createColumnHelper,
  ColumnDef,
  Column, // Added Column here
  getFilteredRowModel,
  getPaginationRowModel
} from '@tanstack/react-table'
import { Input, InputNumber } from "@/components/ui/input"

interface ProductListProps {
  requestId: string;
  initialProducts?: Product[];
}

// Reusable EditableCell component with React Table pattern
interface EditableCellProps<TData> {
  getValue: () => any;
  row: { original: TData; index: number };
  column: Column<TData, unknown>; // Changed type here
  table: any; // Consider typing table more strictly as Table<TData> if needed later
}

// Memoized EditableCell component to prevent unnecessary re-renders
const EditableCell = React.memo<EditableCellProps<Product>>(function EditableCell({
  getValue,
  row,
  column,
  table
}) {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const productId = row.original.id;
  const field = column.id;
  
  // Get editing state from table meta
  const isEditing = table.options.meta?.editingCell?.productId === productId && 
                    table.options.meta?.editingCell?.field === field;
  
  // Format display based on field type - memoized to prevent recalculations
  const formattedValue = useMemo(() => {
    if (field === 'base_price' || field === 'profit_amount' || field === 'price') {
      return `${Number(value || 0).toFixed(2)}`;
    } else if (field === 'weight' && Number(value) > 0) {
      return `${Number(value).toFixed(2)} kg`;
    } else if (field === 'tax') {
      return `${Number(value || 0).toFixed(2)}%`;
    }
    return value;
  }, [field, value]);
  
  // When input is blurred, update data
  const onBlur = useCallback(() => {
    // Only update if the value has changed
    if (value !== initialValue) {
      // Immediately update the UI
      table.options.meta?.updateUIOnly(productId, field, value);
      
      // Then update the server (debounced)
      table.options.meta?.updateData(productId, field, value);
    } else {
      // Just cancel edit if no change
      table.options.meta?.cancelEdit();
    }
  }, [productId, field, value, initialValue, table.options.meta]);
  
  // Handle key events
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onBlur();
    if (e.key === 'Escape') {
      setValue(initialValue);
      table.options.meta?.cancelEdit();
    }
  }, [onBlur, initialValue, table.options.meta]);
  
  // Only sync state when initialValue changes and we're not editing
  // This prevents losing user input during editing
  useEffect(() => {
    if (!isEditing) {
      setValue(initialValue);
    }
  }, [initialValue, isEditing]);
  
  // Special case for weight = 0 (digital product)
  if (field === 'weight' && Number(value) === 0) {
    return (
      <Badge variant="outline" className="bg-blue-950/20 text-blue-400 border-blue-800/30 hover:bg-blue-900/30 transition-colors">
        Digital
      </Badge>
    );
  }
  
  // Special case for product cell with avatar - removed from reusable component
  if (field === 'title') {
    return isEditing ? (
      <Input
        value={String(value)}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="w-full rounded-md border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary py-1.5 text-sm"
        autoFocus
      />
    ) : (
      <span 
        className="cursor-pointer hover:text-primary transition-colors duration-200 py-1 px-1 rounded hover:bg-accent font-medium"
        onClick={() => table.options.meta?.startEdit(productId, field)}
      >
        {value}
      </span>
    );
  }
  
  // For price and numeric fields
  if (isEditing) {
    return (
      <div className="flex items-center relative">
        {field === 'base_price' ? (
          <span className="absolute left-2 text-muted-foreground">$</span>
        ) : field === 'profit_amount' ? (
          <span className="absolute left-2 text-muted-foreground">S/</span>
        ) : field === 'price' ? (
          <span className="absolute left-2 text-muted-foreground">$</span>
        ) : null}
        <InputNumber
          value={String(value)}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className={`w-full rounded-md border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary ${field === 'base_price' || field === 'profit_amount' || field === 'price' ? 'pl-6' : 'pl-3'} py-1.5 text-sm`}
          min={field === 'weight' ? 0.1 : 0}
          step={field === 'weight' ? 0.1 : 0.01}
          type="number"
          autoFocus
        />
        {field === 'weight' ? (
          <span className="absolute right-2 text-muted-foreground">kg</span>
        ) : field === 'tax' ? (
          <span className="absolute right-2 text-muted-foreground">%</span>
        ) : null}
      </div>
    );
  }
  
  // Default display mode
  return (
    <span 
      className={`cursor-pointer hover:text-primary transition-colors duration-200 py-1 px-1 rounded hover:bg-accent ${field === 'price' ? 'font-medium' : ''}`}
      onClick={() => field !== 'price' && table.options.meta?.startEdit(productId, field)}
    >
      {column.columnDef.meta?.prefix || ''}{formattedValue}
    </span>
  );
})

export default function ProductList({ requestId }: ProductListProps) {
    const {
      products,
      setProducts
    } = useRequestDetailStore();
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{productId: string, field: string} | null>(null);
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipPageReset();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Calculate totals
  const totalProducts = products.length;
  const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
  const totalBasePrice = products.reduce((sum, p) => sum + (p.base_price || 0), 0);
  const totalWeight = products.reduce((sum, p) => sum + (p.weight || 0), 0);
  const digitalProductsCount = products.filter(p => p.weight === 0).length;

  // Update product mutation
  const updateProductMutationOptions = trpc.requests.updateProduct.mutationOptions({
    onMutate: async ({ product: productInput }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['requests.getById'] });
      
      // Snapshot the previous value
      const previousQueryData = queryClient.getQueryData(['requests.getById']) as { products: Product[] } | undefined;
      
      // Separate potentially extraneous properties like imageData
      const { ...productDataForState } = productInput;
      
      // For new products
      if (!products.some(p => p.id === productInput.id)) {
        // Ensure the new product conforms to the Product type
        const newProduct = { 
          ...productDataForState, 
          id: productInput.id || uuidv4(), 
          price: productDataForState.price || 0, 
          base_price: productDataForState.base_price || 0, 
          weight: productDataForState.weight || 0, 
        } as Product;
        
        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts);
        
        // Recalculate totals
        const totalPrice = updatedProducts.reduce((sum, p) => sum + p.price, 0);
        const totalBasePrice = updatedProducts.reduce((sum, p) => sum + (p.base_price || 0), 0);
        const totalWeight = updatedProducts.reduce((sum, p) => sum + (p.weight || 0), 0);
        
        const store = useRequestDetailStore.getState();
        store.setBasePrice(totalBasePrice);
        store.setWeight(totalWeight);
        
        queryClient.setQueryData(['requests.getById'], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            products: [...(old.products || []), newProduct]
          };
        });
        
        return { previousProducts: previousQueryData, addedProduct: newProduct, totalPrice, totalBasePrice, totalWeight };
      } 
      // For existing products
      else {
        const updatedProducts = products.map(p => 
          p.id === productInput.id ? { ...p, ...productDataForState } as Product : p 
        );
        
        setProducts(updatedProducts);
        
        const totalPrice = updatedProducts.reduce((sum, p) => sum + p.price, 0);
        const totalBasePrice = updatedProducts.reduce((sum, p) => sum + (p.base_price || 0), 0);
        const totalWeight = updatedProducts.reduce((sum, p) => sum + (p.weight || 0), 0);
        
        const store = useRequestDetailStore.getState();
        store.setBasePrice(totalBasePrice);
        store.setWeight(totalWeight);
        
        queryClient.setQueryData(['requests.getById'], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            products: (old.products || []).map((p: Product) => 
              p.id === productInput.id ? { ...p, ...productDataForState } as Product : p 
            )
          };
        });
        
        return { previousProducts: previousQueryData, updatedProducts, totalPrice, totalBasePrice, totalWeight };
      }
    },
    onError: (error, { product: productInput }, context) => {
      // Revert query cache to the previous state
      if (context?.previousProducts) {
        queryClient.setQueryData(['requests.getById'], context.previousProducts);
      }
      
      // Revert local Zustand store state
      if (context?.previousProducts?.products) { 
        setProducts(context.previousProducts.products);
      } else {
        const currentProductsFromStore = useRequestDetailStore.getState().products;
        const newFilteredProducts = currentProductsFromStore.filter((p: Product) => p.id !== productInput.id);
        setProducts(newFilteredProducts);
      }
      toast.error(`Error al actualizar el producto: ${error.message}`);
    },
    onSuccess: () => {
      // Clear editing state and data
      setEditingCell(null);
      
      // No toast for success
    },
    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: ['requests.getById'] });
    }
  });

  const updateProductMutation = useMutation(updateProductMutationOptions);

  const deleteProductMutationOptions = trpc.requests.deleteSingleProduct.mutationOptions({
    onMutate: async ({ id }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['requests.getById'] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['requests.getById']);
      
      const prevProducts = products;
      const deletedProduct = products.find((p) => p.id === id);
      const updatedProducts = products.filter((p) => p.id !== id);
      setProducts(updatedProducts);
      
      // Recalculate totals
      const totalPrice = updatedProducts.reduce((sum, p) => sum + p.price, 0);
      const totalBasePrice = updatedProducts.reduce((sum, p) => sum + (p.base_price || 0), 0);
      const totalWeight = updatedProducts.reduce((sum, p) => sum + (p.weight || 0), 0);
      
      // Update store with base price and weight
      const store = useRequestDetailStore.getState();
      store.setBasePrice(totalBasePrice);
      store.setWeight(totalWeight);
      
      // Optimistically update the query data
      queryClient.setQueryData(['requests.getById'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          products: (old.products || []).filter((p: Product) => p.id !== id)
        };
      });
      
      return { previousData, prevProducts, deletedProduct, totalPrice, totalBasePrice, totalWeight };
    },
    onError: (error, { /* id of product being deleted */ }, context) => {
      // Revert query cache to the previous state
      if (context?.previousData) {
        queryClient.setQueryData(['requests.getById'], context.previousData);
      }
      
      // Revert local Zustand store state
      if (context?.deletedProduct) {
        // If we have the specific product that was deleted, add it back to the current store state
        const currentProductsFromStore = useRequestDetailStore.getState().products;
        const revertedProducts = [...currentProductsFromStore, context.deletedProduct as Product];
        setProducts(revertedProducts);
      } else if (context?.prevProducts) {
        // Otherwise, if we have the snapshot of the entire product list before deletion, use that
        setProducts(context.prevProducts as Product[]);
      }
      toast.error(`Error al eliminar el producto: ${error.message}`);
    },
    onSettled: () => {
      setDeletingProductId(null);
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: ['requests.getById'] });
    }
  });

  const deleteProductMutation = useMutation(deleteProductMutationOptions);

  // Handle adding new product
  const handleUpdateProduct = async (product: Product) => {
    // Ensure that a new product added also gets the default tax if not present
    const productWithTax: Product = {
      ...product,
      tax: product.tax ?? 7, // Default to 7 if tax isn't somehow set (e.g. from an older source)
      request_id: requestId
    };

    // Calculate the new state for products
    let productExists = false;
    const updatedProdsAfterMap = products.map((p: Product) => { // Use current `products` state directly
      if (p.id === productWithTax.id) {
        productExists = true;
        return productWithTax; // Replace existing product
      }
      return p;
    });

    let finalUpdatedProducts: Product[];
    if (productExists) {
      finalUpdatedProducts = updatedProdsAfterMap;
    } else {
      // Product is new, add it to the array
      finalUpdatedProducts = [...updatedProdsAfterMap, productWithTax];
    }

    // Update local state directly with the new array
    setProducts(finalUpdatedProducts);

    // Update store state
    useRequestDetailStore.getState().setProducts(finalUpdatedProducts);

    updateProductMutation.mutate({
      requestId,
      product: productWithTax // Simplified payload
    });
  };

  // Handle deleting product
  const handleDeleteProduct = async (productId: string, image_url: string | null) => {
    setDeletingProductId(productId);
    await deleteProductMutation.mutateAsync({
      requestId,
      id: productId,
      image_url
    });
  };

  // Get initials for avatar
  const getInitials = (title: string) => {
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Define default column for all cells
  const defaultColumn: Partial<ColumnDef<Product>> = useMemo(
    () => ({
      cell: EditableCell,
    }),
    []
  );

  // Define columns with our reusable EditableCell
  const columnHelper = createColumnHelper<Product>();
  const columns = useMemo<ColumnDef<Product, any>[]>(() => [
    columnHelper.display({
      id: 'image',
      header: '',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex justify-center">
            <Avatar className="h-8 w-8 rounded-md border border-border">
              {product.image_url ? (
                <AvatarImage 
                  src={product.image_url} 
                  alt={product.title}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                  {getInitials(product.title)}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
        );
      },
      size: 60
    }),
    columnHelper.accessor("title", {
      header: 'Producto',
      cell: EditableCell,
      size: 220
    }),
    columnHelper.accessor("base_price", {
      header: 'Precio base',
      cell: EditableCell,
      size: 100,
      meta: { type: 'number', prefix: '$' }
    }),
    columnHelper.accessor("profit_amount", {
      header: "Ganancia",
      cell: EditableCell,
      size: 100,
      meta: { type: 'number', prefix: 'S/' }
    }),
    columnHelper.accessor("tax", {
      header: "Imp. (%)",
      cell: EditableCell,
      size: 90,
      meta: { type: 'number', suffix: '%' }
    }),
    columnHelper.accessor("price", {
      header: "Precio Final",
      cell: EditableCell,
      size: 110,
      meta: { type: 'number', prefix: '$', readOnly: true }
    }),
    columnHelper.accessor("weight", {
      header: 'Peso',
      cell: EditableCell,
      size: 100,
      meta: { type: 'number', suffix: 'kg' }
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteProduct(product.id, product.image_url)}
              disabled={!!deletingProductId}
              className="h-8 w-8 rounded-full hover:bg-red-950/20 hover:text-red-400 transition-colors"
            >
              {deletingProductId === product.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      },
      size: 60
    })
  ], [editingCell, deletingProductId, updateProductMutation.isPending]);

  // Custom hook for skipping page reset when editing data
  function useSkipPageReset() {
    const [autoResetPageIndex, setAutoResetPageIndex] = useState(true);
    
    const skipAutoResetPageIndex = useCallback(() => {
      setAutoResetPageIndex(false);
      
      // Reset after next render
      setTimeout(() => {
        setAutoResetPageIndex(true);
      }, 100);
    }, []);
    
    return [autoResetPageIndex, skipAutoResetPageIndex] as const;
  }

  // Custom debounce implementation using refs and setTimeout
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to update the server with debouncing
  const debouncedUpdateServer = useCallback((updatedProduct: Product) => {
    // Clear any existing timeout
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set a new timeout
    timerRef.current = setTimeout(() => {
      updateProductMutation.mutate({
        requestId,
        product: {
          ...updatedProduct,
          id: updatedProduct.id,
          request_id: requestId
        }
      });
      timerRef.current = null;
    }, 500);
  }, [requestId]);

  // Shared function to calculate the updated product
  const calculateUpdatedProduct = useCallback((productToUpdate: Product, field: string, value: any) => {
    let updatedProduct = { ...productToUpdate };
    
    // Update the field based on its type
    if (field === 'base_price' || field === 'weight' || field === 'profit_amount') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return null;
      
      // Special handling for profit_amount and base_price to update price as well
      if (field === 'profit_amount') {
        updatedProduct.profit_amount = numValue;
        // Final price is now base_price + (base_price * tax / 100)
        const basePrice = updatedProduct.base_price ?? 0;
        const taxPercentage = updatedProduct.tax ?? 7;
        updatedProduct.price = parseFloat((basePrice + (basePrice * taxPercentage / 100)).toFixed(2));
      } else if (field === 'base_price') {
        updatedProduct.base_price = numValue;
        // Final price is now base_price + (base_price * tax / 100)
        const taxPercentage = updatedProduct.tax ?? 7;
        updatedProduct.price = parseFloat((numValue + (numValue * taxPercentage / 100)).toFixed(2));
      } else if (field === 'weight') {
        updatedProduct.weight = numValue;
      } else {
        // Type assertion to fix error
        (updatedProduct as Record<string, any>)[field] = numValue;
      }
    } else if (field === 'tax') {
      const taxPercentage = parseFloat(value);
      if (isNaN(taxPercentage)) return null;
      
      const basePrice = updatedProduct.base_price ?? 0;
      // Final price is now base_price + (base_price * tax / 100)
      const taxAmount = basePrice * (taxPercentage / 100);
      updatedProduct.tax = taxPercentage;
      updatedProduct.price = parseFloat((basePrice + taxAmount).toFixed(2));
    } else {
      // Use type assertion to safely set dynamic properties
      (updatedProduct as Record<string, any>)[field] = value;
    }
    
    return updatedProduct;
  }, []);

  // Initialize React Table with meta
  const table = useReactTable({
    data: products,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex,
    meta: {
      editingCell,
      startEdit: (productId: string, field: string) => {
        // Don't allow editing if there's already a cell being edited
        if (editingCell) return;
        setEditingCell({ productId, field });
      },
      cancelEdit: () => {
        setEditingCell(null);
      },
      // Function to only update the UI (optimistic update)
      updateUIOnly: (productId: string, field: string, value: any) => {
        // Skip page index reset until after next rerender
        skipAutoResetPageIndex();
        
        // First, find the product that needs to be updated
        const currentProducts = useRequestDetailStore.getState().products;
        const productToUpdate = currentProducts.find(p => p.id === productId);
        
        if (!productToUpdate) return; // Product not found
        
        // Calculate the updated product
        const updatedProduct = calculateUpdatedProduct(productToUpdate, field, value);
        if (!updatedProduct) return; // Invalid input
        
        // Optimistically update the UI immediately
        const updatedProducts = currentProducts.map(product => 
          product.id === productId ? updatedProduct : product
        );
        
        // Update local state
        setProducts(updatedProducts);
        
        // Also update the store state
        useRequestDetailStore.getState().setProducts(updatedProducts);
        
        // Recalculate totals
        const totalPrice = updatedProducts.reduce((sum, p) => sum + p.price, 0);
        const totalBasePrice = updatedProducts.reduce((sum, p) => sum + (p.base_price || 0), 0);
        const totalWeight = updatedProducts.reduce((sum, p) => sum + (p.weight || 0), 0);
        
        const store = useRequestDetailStore.getState();
        store.setBasePrice(totalBasePrice);
        store.setWeight(totalWeight);
        
        // Close the edit mode
        setEditingCell(null);
      },
      // Function to update the server (debounced)
      updateData: (productId: string, field: string, value: any) => {
        // Find the product that needs to be updated
        const currentProducts = useRequestDetailStore.getState().products;
        const productToUpdate = currentProducts.find(p => p.id === productId);
        
        if (!productToUpdate) return; // Product not found
        
        // Calculate the updated product
        const updatedProduct = calculateUpdatedProduct(productToUpdate, field, value);
        if (!updatedProduct) return; // Invalid input
        
        // Send the update to the server in the background (debounced)
        debouncedUpdateServer(updatedProduct);
      }
    },
  });

  return (
    <Card className="border shadow-md py-0">
      <CardHeader className="px-6 py-4 border-b">
        <CardTitle className="text-lg font-semibold">Productos</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {products.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <PlusCircle className="h-10 w-10 mb-2 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-1">No hay productos</h3>
            <p>Haz clic en Agregar producto para comenzar.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] min-h-[250px]">
            <div className="w-full">
              <Table className="border-collapse w-full">
                <TableHeader className="bg-slate-100 dark:bg-slate-800/50 sticky top-0 z-10">
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id} className="border-b border-border">
                      {headerGroup.headers.map(header => (
                        <TableHead 
                          key={header.id}
                          style={{ width: header.getSize() }}
                          className="py-2 px-3 font-medium text-foreground/80 text-xs"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row, index) => (
                    <TableRow 
                      key={row.id} 
                      className={`
                        border-b border-border hover:bg-muted/50 transition-colors
                      `}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell 
                          key={cell.id}
                          className="py-2 px-3"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="px-6 py-4 border-t flex justify-between items-center">
        <div className="text-sm">
          <div className="font-medium">{totalProducts} productos</div>
          <div className="text-muted-foreground">
            Base: <span className="font-medium">${totalBasePrice.toFixed(2)}</span> | 
            Total: <span className="font-medium">${totalPrice.toFixed(2)}</span> | 
            Peso: <span className="font-medium">{totalWeight.toFixed(2)} kg</span>
            {digitalProductsCount > 0 && ` (${digitalProductsCount} digital)`}
          </div>
        </div>
        <div className="flex gap-2">
          <AddProductDialog
            onAddProduct={(product) => {
              handleUpdateProduct(product)
            }}
          >
            <Button className="bg-primary hover:bg-primary/90">
              <PlusCircle className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </AddProductDialog>
        </div>
      </CardFooter>
    </Card>
  )
}