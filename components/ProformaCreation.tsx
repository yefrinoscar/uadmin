import { useProformaStore } from '@/store/proformaStore'
import { ClientInfoStep } from '@/app/(dashboard)/dashboard/invoices/proforma/_components/steps/client-info-step'
import { ItemsStep } from '@/app/(dashboard)/dashboard/invoices/proforma/_components/steps/items-step'
import { ConditionsStep } from '@/app/(dashboard)/dashboard/invoices/proforma/_components/steps/conditions-step'
import { ProformaPreview } from './ProformaPreview'

const steps = [
  { id: 'client', title: 'Client Information', component: ClientInfoStep },
  { id: 'items', title: 'Items & Services', component: ItemsStep },
  { id: 'conditions', title: 'Conditions', component: ConditionsStep },
]

export const ProformaCreation = () => {
  const { currentStep, setCurrentStep } = useProformaStore()
  const { handleSubmit, isLoading } = { handleSubmit: () => {}, isLoading: false }

  const CurrentStep = steps[currentStep].component

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <nav className="mb-8">
            <ol className="flex items-center">
              {steps.map((s, i) => (
                <li key={s.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(i)}
                    className={`${
                      i === currentStep ? 'text-indigo-600' : 'text-gray-500'
                    } hover:text-indigo-600`}
                  >
                    {s.title}
                  </button>
                  {i < steps.length - 1 && (
                    <span className="mx-2 text-gray-400">/</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <CurrentStep />

          <div className="mt-8 flex justify-between">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="btn-secondary"
              >
                Previous
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="btn-primary"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Creating...' : 'Create Proforma'}
              </button>
            )}
          </div>
        </div>

        <div className="sticky top-8">
          <ProformaPreview />
        </div>
      </div>
    </div>
  )
} 