'use client'

import { Component, ReactNode } from 'react'
import { ErrorMessage } from './ui/error-message'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public reset = () => {
    this.setState({ hasError: false })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorMessage
          title="Algo salió mal"
          message={this.state.error?.message}
          onRetry={this.reset}
        />
      )
    }

    return this.props.children
  }
} 