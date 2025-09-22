import { useState } from 'react'

import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  RotateCcw,
  Save,
  Wifi,
  WifiOff,
} from 'lucide-react'
import validator from 'validator'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SettingInputProps {
  id: string
  label: string
  description: string
  placeholder: string
  value: string
  originalValue: string
  onChange: (value: string) => void
  onSave: () => Promise<void>
  onReset: () => void
  status: 'idle' | 'saving' | 'saved' | 'error'
}

type ValidationState =
  | 'unchecked'
  | 'checking'
  | 'valid'
  | 'invalid'
  | 'unreachable'

export function SettingInput({
  id,
  label,
  description,
  placeholder,
  value,
  originalValue,
  onChange,
  onSave,
  onReset,
  status,
}: SettingInputProps) {
  const [validation, setValidation] = useState<ValidationState>('unchecked')

  const validateUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false

    // Use validator package for more robust URL validation
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false,
    })
  }

  const checkUrlConnectivity = async (url: string) => {
    if (!validateUrl(url)) {
      setValidation('invalid')
      return
    }

    setValidation('checking')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors', // Try CORS first
      })

      clearTimeout(timeoutId)

      // Check if response is successful (2xx status codes)
      if (response.ok) {
        setValidation('valid')
      } else {
        setValidation('unreachable')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setValidation('unreachable')
      } else {
        // If CORS fails, try with no-cors mode as a fallback
        try {
          const controller2 = new AbortController()
          const timeoutId2 = setTimeout(() => controller2.abort(), 3000)

          await fetch(url, {
            method: 'HEAD',
            signal: controller2.signal,
            mode: 'no-cors',
          })

          clearTimeout(timeoutId2)
          // For no-cors, we can't check the status, but if it doesn't throw,
          // it's likely reachable (though we can't be certain)
          setValidation('valid')
        } catch {
          setValidation('unreachable')
        }
      }
    }
  }

  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    setValidation('unchecked')

    // Debounce URL validation check
    const timeoutId = setTimeout(() => {
      if (newValue && validateUrl(newValue)) {
        checkUrlConnectivity(newValue)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }

  const testConnection = async () => {
    if (validateUrl(value)) {
      await checkUrlConnectivity(value)
      window.open(value, '_blank')
    }
  }

  const getValidationIcon = () => {
    const isValidFormat = validateUrl(value)

    if (!value) return null

    switch (validation) {
      case 'checking':
        return <Clock className="h-4 w-4 animate-pulse text-blue-500" />
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'unreachable':
        return <WifiOff className="h-4 w-4 text-orange-500" />
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return isValidFormat ? (
          <Wifi className="h-4 w-4 text-gray-400" />
        ) : (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )
    }
  }

  const getValidationMessage = () => {
    const isValidFormat = validateUrl(value)

    if (!value) return null

    switch (validation) {
      case 'checking':
        return <p className="text-xs text-blue-600">Checking connectivity...</p>
      case 'valid':
        return <p className="text-xs text-green-600">URL is reachable</p>
      case 'unreachable':
        return (
          <p className="text-xs text-orange-600">
            URL format is valid but may not be reachable
          </p>
        )
      case 'invalid':
        return (
          <p className="text-xs text-destructive">Please enter a valid URL</p>
        )
      default:
        return !isValidFormat ? (
          <p className="text-xs text-destructive">Please enter a valid URL</p>
        ) : null
    }
  }

  const isValid = validateUrl(value)
  const hasChanged = value !== originalValue

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={testConnection}
            disabled={!isValid}
            className="h-6 px-2 text-xs"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Test
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Input
            id={id}
            type="url"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className={`pr-8 ${
              value && !isValid
                ? 'border-destructive focus:border-destructive'
                : ''
            }`}
          />
          {value && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {getValidationIcon()}
            </div>
          )}
        </div>

        {/* Inline Save/Reset Buttons */}
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={!hasChanged || status === 'saving'}
            className="h-8 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            onClick={onSave}
            disabled={!hasChanged || !isValid || status === 'saving'}
            className="h-8 px-2 text-xs"
          >
            {status === 'saving' ? (
              <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{description}</p>

        {/* Status Indicator */}
        <div className="flex items-center space-x-1">
          {status === 'saved' && (
            <div className="flex items-center text-xs text-green-600">
              <CheckCircle className="mr-1 h-3 w-3" />
              Saved
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center text-xs text-destructive">
              <AlertCircle className="mr-1 h-3 w-3" />
              Error
            </div>
          )}
          {hasChanged && status === 'idle' && (
            <div className="text-xs text-muted-foreground">Unsaved changes</div>
          )}
        </div>
      </div>

      {getValidationMessage()}
    </div>
  )
}
