"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { VerticalSteps, Step } from './vertical-steps'
import { ArrowLeft, ArrowRight, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { motion } from 'framer-motion'
import { useProformaStore } from '@/store/proformaStore'
// import { api } from '@/app/providers'

// Step components
import { ClientInfoStep } from './steps/client-info-step'
import { ItemsStep } from './steps/items-step'
import { ConditionsStep } from './steps/conditions-step'
import { SummaryStep } from './steps/summary-step'

const STEPS: Step[] = [
  { id: 'client', label: 'Información del Cliente', description: 'Datos del cliente' },
  { id: 'items', label: 'Productos y Servicios', description: 'Agregar productos' },
  { id: 'conditions', label: 'Términos y Condiciones', description: 'Configurar condiciones' },
  { id: 'summary', label: 'Resumen y Vista Previa', description: 'Revisar y guardar' },
]

export function ProformaForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors] = useState<Record<string, string[]>>({})
  
  // Get state and actions from the store
  const proforma = useProformaStore()
  const {
    currentStep: stepIndex,
    setCurrentStep,
    formValid,
    getTotals,
    reset: resetStore
  } = proforma
  
  // Convert step index to step ID
  const currentStep = STEPS[stepIndex].id
  
  // Create proforma mutation
  // const createProformaMutation = api.proforma.create.useMutation({
  //   onSuccess: (data) => {
  //     toast.success('Proforma creada', {
  //       description: 'La proforma ha sido creada exitosamente.'
  //     })
  //     router.push(`/dashboard/invoices/proforma/preview/${data.id}`)
  //     resetStore()
  //   },
  //   onError: (error) => {
  //     toast.error('Error', {
  //       description: error.message || 'No se pudo crear la proforma. Por favor, intente nuevamente.'
  //     })
  //     setIsSubmitting(false)
  //   }
  // })

  // Validate current step
  // const validateCurrentStep = (): boolean => {
  //   const errors: Record<string, string[]> = {}
    
  //   if (currentStep === 'client') {
  //     if (!clientInfo.client_id) {
  //       errors.client = ['Debe seleccionar un cliente']
  //       validateStep('client', false)
  //     } else {
  //       validateStep('client', true)
  //     }
  //   } else if (currentStep === 'items') {
  //     if (items.length === 0) {
  //       errors.items = ['Debe agregar al menos un producto']
  //       validateStep('items', false)
  //     } else {
  //       validateStep('items', true)
  //     }
  //   } else if (currentStep === 'conditions') {
  //     if (conditions.currency === 'USD' && conditions.exchange_rate <= 0) {
  //       errors.exchange_rate = ['El tipo de cambio debe ser mayor a 0']
  //       validateStep('conditions', false)
  //     } else if (conditions.validity_period_days <= 0) {
  //       errors.validity_period_days = ['El período de validez debe ser mayor a 0']
  //       validateStep('conditions', false)
  //     } else {
  //       validateStep('conditions', true)
  //     }
  //   }
    
  //   setValidationErrors(errors)
  //   return Object.keys(errors).length === 0
  // }

  // const handleNext = () => {
  //   if (validateCurrentStep() && stepIndex < STEPS.length - 1) {
  //     setCurrentStep(stepIndex + 1)
  //   } else if (!validateCurrentStep()) {
  //     toast.error('Error de validación', {
  //       description: 'Por favor, complete todos los campos requeridos.'
  //     })
  //   }
  // }

  const handlePrevious = () => {
    if (stepIndex > 0) {
      setCurrentStep(stepIndex - 1)
    }
  }

  const handleSubmit = async () => {
    // Final validation before submission
    if (!Object.values(formValid).every(Boolean)) {
      toast.error('Error de validación', {
        description: 'Por favor, complete todos los campos requeridos en los pasos anteriores.'
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // const { subtotal, tax, total } = getTotals()
      
      // createProformaMutation.mutate({
      //   number: new Date().getTime().toString(),
      //   date: new Date().toISOString(),
      //   due_date: new Date(Date.now() + conditions.validity_period_days * 24 * 60 * 60 * 1000).toISOString(),
      //   currency: conditions.currency as 'USD' | 'PEN',
      //   exchange_rate: conditions.exchange_rate,
      //   client_id: proforma.client_id,
      //   items: items,
      //   conditions: {
      //     includeIGV: conditions.include_igv,
      //     validityPeriodDays: conditions.validity_period_days,
      //     deliveryTime: conditions.delivery_time,
      //     paymentMethod: conditions.payment_method,
      //   },
      //   seller_id: '',
      //   subtotal,
      //   tax,
      //   total,
      //   status: 'draft',
      //   notes: conditions.notes,
      //   include_igv: conditions.include_igv,
      //   validity_period_days: conditions.validity_period_days,
      //   delivery_time: conditions.delivery_time,
      //   payment_method: conditions.payment_method,
      //   warranty_months: conditions.warranty_months,
      // })
    } catch (error) {
      console.error('Error creating proforma:', error)
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'client':
        return <ClientInfoStep />
      case 'items':
        return <ItemsStep />
      case 'conditions':
        return <ConditionsStep />
      case 'summary':
        return <SummaryStep />
      default:
        return null
    }
  }

  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === STEPS.length - 1
  
  const hasValidationErrors = Object.keys(validationErrors).length > 0
  const isNextDisabled = !formValid[currentStep as keyof typeof formValid] || isSubmitting

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-8">
        <VerticalSteps 
          steps={STEPS.map((step) => ({
            ...step,
            isValid: formValid[step.id as keyof typeof formValid]
          }))}
          currentStep={currentStep}
          onStepChange={(stepId) => {
            const newIndex = STEPS.findIndex(s => s.id === stepId)
            if (newIndex >= 0) {
              setCurrentStep(newIndex)
            }
          }}
          allowNavigation={true}
        />
        
        <div className="flex-1">
          {hasValidationErrors && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de validación</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2">
                    {Object.entries(validationErrors).flatMap(([field, errors]) => 
                      errors.map((error, i) => <li key={`${field}-${i}`}>{error}</li>)
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {formValid[currentStep as keyof typeof formValid] && !hasValidationErrors && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200 mb-6">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle>Paso válido</AlertTitle>
                <AlertDescription>
                  Todos los campos requeridos están completos.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{STEPS.find(step => step.id === currentStep)?.label}</span>
                </CardTitle>
            </CardHeader>
              <CardContent>
                {renderStepContent()}
            </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isFirstStep || isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                
                <div className="flex space-x-2">
                  {isLastStep ? (
                    <Button 
                      onClick={handleSubmit}
                      disabled={isSubmitting || !Object.values(formValid).every(Boolean)}
                      className={Object.values(formValid).every(Boolean) 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                        : ""}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? 'Guardando...' : 'Guardar Proforma'}
                    </Button>
                  ) : (
                    <Button 
                      // onClick={handleNext} 
                      disabled={isNextDisabled}
                      className={!isNextDisabled ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                    >
                      Siguiente
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardFooter>
          </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

