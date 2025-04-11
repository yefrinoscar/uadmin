'use client'

import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCallback } from 'react'

export type Step = {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  isValid?: boolean
}

type VerticalStepsProps = {
  steps: Step[]
  currentStep: string
  onStepChange?: (stepId: string) => void
  className?: string
  allowNavigation?: boolean
}

export function VerticalSteps({ 
  steps, 
  currentStep, 
  onStepChange, 
  className,
  allowNavigation = true 
}: VerticalStepsProps) {
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
    <div className={cn('w-full md:w-64 flex-shrink-0', className)}>
      <div className="sticky top-6">
        <h3 className="text-lg font-semibold mb-6">Pasos</h3>
        <nav aria-label="Progress" className="overflow-hidden">
          <ol role="list" className="relative">
            {steps.map((step, stepIdx) => {
              const status = getStepStatus(step.id)
              const isInvalid = status !== 'upcoming' && step.isValid === false
              const isActive = step.id === currentStep
              
              return (
                <li 
                  key={step.id} 
                  className={cn(
                    "relative pb-8",
                    stepIdx !== steps.length - 1 ? "before:absolute before:left-4 before:top-8 before:h-full before:w-0.5 before:bg-gray-200" : ""
                  )}
                >
                  <div className="group relative flex items-start">
                    <motion.span 
                      className="flex h-9 items-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: stepIdx * 0.1, duration: 0.3 }}
                    >
                      <motion.span
                        className={cn(
                          "relative z-10 flex h-8 w-8 items-center justify-center rounded-full",
                          status === 'completed' && !isInvalid ? 'bg-emerald-500 text-white' : 
                          status === 'current' && !isInvalid ? 'border-2 border-emerald-500 bg-white' : 
                          isInvalid ? 'border-2 border-gray-500 bg-red-50 text-gray-600' :
                          'border-2 border-gray-300 bg-white',
                          allowNavigation && status !== 'upcoming' ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'
                        )}
                        onClick={() => handleStepClick(step.id)}
                        whileHover={allowNavigation && status !== 'upcoming' ? { scale: 1.05 } : {}}
                        whileTap={allowNavigation && status !== 'upcoming' ? { scale: 0.95 } : {}}
                      >
                        {status === 'completed' && !isInvalid ? (
                          <CheckIcon className="h-5 w-5" />
                        ) : isInvalid ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <span className='text-gray-500'>{stepIdx + 1}</span>
                        )}
                      </motion.span>
                    </motion.span>
                    
                    <motion.span 
                      className="ml-4 flex min-w-0 flex-col"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: stepIdx * 0.1 + 0.1, duration: 0.3 }}
                    >
                      <span 
                        className={cn(
                          "text-sm font-medium",
                          status === 'completed' && !isInvalid ? 'text-white' : 
                          status === 'current' && !isInvalid ? 'text-white' : 
                          isInvalid ? 'text-neutral-500' : 'text-neutral-500'
                        )}
                      >
                        {step.label}
                      </span>
                      
                      {step.description && (
                        <span className={cn(
                          "text-xs",
                          isActive && !isInvalid ? 'text-white' : 
                          isInvalid ? 'text-neutral-500' : 'text-neutral-500'
                        )}>
                          {step.description}
                        </span>
                      )}
                      
                      {/* {isActive && (
                        <motion.div 
                          className="mt-2 flex items-center text-neutral-300 text-xs font-medium"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.3 }}
                        >
                          <ArrowRightIcon className="mr-1 h-3 w-3" />
                          Paso actual
                        </motion.div>
                      )} */}
                    </motion.span>
                  </div>
                </li>
              )
            })}
          </ol>
        </nav>
        
        {/* <motion.div 
          className="mt-6 bg-emerald-50 border border-emerald-100 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <div className="text-xs text-emerald-800 font-medium mb-1">Progreso</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
              style={{ 
                width: `${((steps.findIndex(step => step.id === currentStep) + 1) / steps.length) * 100}%` 
              }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Paso {steps.findIndex(step => step.id === currentStep) + 1} de {steps.length}
          </div>
        </motion.div> */}
      </div>
    </div>
  )
} 