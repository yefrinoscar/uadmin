export const defaultProformaData = {
    id: "123123213",
    companyInfo: {
      ruc: "20506717044",
      name: "UNDERLA S.A.C.",
      address: "Av. Garcilaso de la Vega 1261 Tdas 226-227",
    },
    proformaInfo: {
      number: "005-928315",
      date: "18/03/2025",
      currency: "PEN",
      exchangeRate: 3.8,
      seller: {
        name: "GONZALES FAUSTINO NELSY",
        phone: "981 384 825",
        email: "nelsy.gonzales@memorykings.com.pe",
      },
    },
    clientInfo: {
      name: "",
      address: "",
      ruc: "",
      contactPerson: "",
    },
    conditions: {
      includeIGV: true,
      validityPeriodDays: 2,
      deliveryTime: "Inmediata",
      paymentMethod: "CONTADO",
    },
    items: [
      {
        id: "",
        description: "",
        unit: "UNI",
        quantity: 1,
        unit_price: 0,
        total: 0,
        warranty_months: 0,
        notes: "",
      },
    ],
    totalAmount: 49.5
  }