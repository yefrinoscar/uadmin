'use client'

import { cn } from '@/lib/utils'
import { CheckIcon, AlertCircle } from 'lucide-react'
import { useCallback } from 'react'

export type Step = {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  isValid?: boolean
}

type StepTabsProps = {
  steps: Step[]
  currentStep: string
  onStepChange?: (stepId: string) => void
  className?: string
  allowNavigation?: boolean
}

export function StepTabs({ 
  steps, 
  currentStep, 
  onStepChange, 
  className,
  allowNavigation = true 
}: StepTabsProps) {
  const getStepStatus = useCallback(
    (stepId: string) => {
      const currentIndex = steps.findIndex(step => step.id === currentStep)
      const stepIndex = steps.findIndex(step => step.id === stepId)
      
      if (stepIndex < currentIndex) return 'completed'
      if (stepIndex === currentIndex) return 'current'
      return 'upcoming'
    },
    [steps, currentStep]
  )

  const handleStepClick = (stepId: string) => {
    if (!allowNavigation) return
    const status = getStepStatus(stepId)
    if (status === 'upcoming') return // Don't allow skipping ahead
    onStepChange?.(stepId)
  }

  return (
    <div className={cn('w-full', className)}>
      <nav aria-label="Progress">
        <ol role="list" className="overflow-hidden">
          {/* Progress bar */}
          <div className="relative mx-4 mt-2 h-1 flex-1 bg-gray-200">
            <div 
              className="absolute h-full bg-primary transition-all duration-500 ease-in-out"
              style={{ 
                width: `${(steps.findIndex(step => step.id === currentStep) / (steps.length - 1)) * 100}%` 
              }}
            />
          </div>
          
          <div className="relative flex items-center justify-between px-2 pt-6">
            {steps.map((step, stepIdx) => {
              const status = getStepStatus(step.id)
              const isInvalid = status !== 'upcoming' && step.isValid === false
              
              return (
                <li key={step.id} className="relative flex flex-col items-center">
                  <div className="flex items-center" aria-hidden="true">
                    {stepIdx !== 0 && (
                      <div 
                        className={cn(
                          "absolute left-0 top-4 h-0.5 w-full -translate-x-1/2",
                          status === 'upcoming' ? 'bg-gray-200' : 
                          isInvalid ? 'bg-red-300' : 'bg-primary'
                        )}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStepClick(step.id)}
                    className={cn(
                      "relative flex h-8 w-8 items-center justify-center rounded-full",
                      status === 'completed' && !isInvalid ? 'bg-primary text-white' : 
                      status === 'current' && !isInvalid ? 'border-2 border-primary bg-white' : 
                      isInvalid ? 'border-2 border-red-500 bg-red-50 text-red-600' :
                      'border-2 border-gray-300 bg-white',
                      allowNavigation && status !== 'upcoming' ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'
                    )}
                    aria-current={status === 'current' ? 'step' : undefined}
                  >
                    {status === 'completed' && !isInvalid ? (
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    ) : isInvalid ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <span>{stepIdx + 1}</span>
                    )}
                  </button>
                  <div className="mt-2 flex flex-col items-center">
                    <span 
                      className={cn(
                        "text-sm font-medium",
                        status === 'completed' && !isInvalid ? 'text-primary' : 
                        status === 'current' && !isInvalid ? 'text-primary' : 
                        isInvalid ? 'text-red-600' :
                        'text-gray-500'
                      )}
                    >
                      {step.label}
                    </span>
                    {step.description && (
                      <span className={cn(
                        "text-xs hidden md:block",
                        isInvalid ? 'text-red-500' : 'text-gray-500'
                      )}>
                        {step.description}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </div>
        </ol>
      </nav>
    </div>
  )
} 