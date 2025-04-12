import { AlertCircle, RefreshCcw } from 'lucide-react'
import { Button } from './button'

interface ErrorMessageProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorMessage({ 
  title = "Ha ocurrido un error", 
  message = "No se pudo cargar la información", 
  onRetry 
}: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="inline-block p-3 bg-red-50 rounded-full text-red-500 mb-2">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
        {onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="mt-4"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Intentar nuevamente
          </Button>
        )}
      </div>
    </div>
  )
} 