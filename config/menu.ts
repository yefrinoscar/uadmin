import {
  MessageSquareDot,
  BadgePercent,
  Calculator,
  Files,
  FileSearch,
  FileSignature,
  ShoppingBag,
  FolderKanban,
  Store
} from "lucide-react";

// Define the structure for a menu item, including potential children
export type MenuItemConfig = {
  name: string;
  url: string;
  icon: React.ComponentType<any>; // Use a general type for Lucide icons
  path: string;
  disabled: boolean;
  description?: string;
  childs?: MenuItemConfig[]; // Optional array of child items
};

// Export the menu configuration as a constant array
export const menu: MenuItemConfig[] = [
  {
    name: 'Pedidos',
    url: '',
    icon: MessageSquareDot,
    path: '/dashboard/requests',
    disabled: false,
    description: 'Gestiona tus pedidos y sus estados'
  },
  {
    name: 'Tienda',
    url: '',
    icon: Store,
    path: '/dashboard/store',
    disabled: false,
    description: 'Gestiona tu tienda online',
    childs: [
      {
        name: 'Categorías',
        url: '',
        icon: FolderKanban,
        path: '/dashboard/collections',
        disabled: false,
        description: 'Gestiona las colecciones de Shopify con imágenes y videos'
      },
      {
        name: 'Promociones',
        url: '',
        icon: BadgePercent,
        path: '/dashboard/promotions',
        disabled: false,
        description: 'Gestiona las promociones activas que hay en la tienda'
      },
    ]
  },
  {
    name: 'Ventas',
    url: '',
    icon: ShoppingBag,
    path: '/dashboard/sales',
    disabled: false,
    description: 'Gestiona tus ventas y analiza tus ganancias'
  },
  {
    name: 'Calculadora',
    url: '',
    icon: Calculator,
    path: '/dashboard/calculator',
    disabled: false,
    description: 'Calcula tus descuentos y promociones'
  },
  {
    name: 'Facturación',  
    url: '',
    icon: Files,
    path: '/dashboard/invoices',
    disabled: true,
    description: 'Gestiona tus facturas electrónicas y proformas',
    childs: [
      {
        name: 'Eletronica',
        url: '',
        icon: FileSignature,
        path: '/dashboard/invoices/electronic',
        disabled: false,
        description: 'Gestiona tus facturas electrónicas'
      },
      {
        name: 'Proformas',
        url: '',
        icon: FileSearch,
        path: '/dashboard/invoices/proforma',
          disabled: false,
        description: 'Gestiona tus proformas'
      },
    ]
  }
]; 