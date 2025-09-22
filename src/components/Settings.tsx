import { useEffect, useState } from 'react'

import { RotateCcw } from 'lucide-react'

import { SettingInput } from '@/components/SettingInput'
import { Button } from '@/components/ui/button'
import { AppConfig, defaultConfig, useAppStore } from '@/store/app-store'

export function Settings() {
  const { config, setConfig, resetConfig } = useAppStore()
  const [formData, setFormData] = useState<AppConfig>(config)
  const [fieldStatus, setFieldStatus] = useState<
    Record<keyof AppConfig, 'idle' | 'saving' | 'saved' | 'error'>
  >({
    gatewayUrl: 'idle',
    databaseUrl: 'idle',
    cuUrl: 'idle',
    hyperbeamNodeUrl: 'idle',
    turboPaymentUrl: 'idle',
    turboUploadUrl: 'idle',
  })

  // Update form data when config changes (e.g., from persistence)
  useEffect(() => {
    setFormData(config)
  }, [config])

  const configFields = [
    {
      key: 'gatewayUrl' as keyof AppConfig,
      label: 'Gateway URL',
      description: 'Primary Arweave gateway for data retrieval',
      placeholder: 'https://arweave.net',
    },
    {
      key: 'databaseUrl' as keyof AppConfig,
      label: 'Database URL',
      description: 'ClickHouse database URL or ArNS parquet host',
      placeholder: 'https://clickhouse.ar-io.dev',
    },
    {
      key: 'cuUrl' as keyof AppConfig,
      label: 'Compute Unit (CU) URL',
      description: 'AO Compute Unit endpoint for process execution',
      placeholder: 'https://cu.ar-io.dev',
    },
    {
      key: 'hyperbeamNodeUrl' as keyof AppConfig,
      label: 'Hyperbeam Node URL',
      description: 'Hyperbeam node for enhanced data processing',
      placeholder: 'https://hyperbeam.ar-io.dev',
    },
    {
      key: 'turboPaymentUrl' as keyof AppConfig,
      label: 'Turbo Payment URL',
      description: 'Turbo payment service endpoint',
      placeholder: 'https://payment.ardrive.io',
    },
    {
      key: 'turboUploadUrl' as keyof AppConfig,
      label: 'Turbo Upload URL',
      description: 'Turbo upload service endpoint',
      placeholder: 'https://upload.ardrive.io',
    },
  ]

  const handleInputChange = (key: keyof AppConfig, value: string) => {
    const newFormData = { ...formData, [key]: value }
    setFormData(newFormData)

    // Reset field status when input changes
    setFieldStatus((prev) => ({ ...prev, [key]: 'idle' }))
  }

  const handleFieldSave = async (key: keyof AppConfig) => {
    setFieldStatus((prev) => ({ ...prev, [key]: 'saving' }))

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Update only this specific field in the config
      const newConfig = { ...config, [key]: formData[key] }
      setConfig(newConfig)

      setFieldStatus((prev) => ({ ...prev, [key]: 'saved' }))

      // Reset status after 2 seconds
      setTimeout(() => {
        setFieldStatus((prev) => ({ ...prev, [key]: 'idle' }))
      }, 2000)
    } catch (error) {
      console.error('Failed to save field:', error)
      setFieldStatus((prev) => ({ ...prev, [key]: 'error' }))
      setTimeout(() => {
        setFieldStatus((prev) => ({ ...prev, [key]: 'idle' }))
      }, 3000)
    }
  }

  const handleFieldReset = (key: keyof AppConfig) => {
    setFormData((prev) => ({ ...prev, [key]: config[key] }))
    setFieldStatus((prev) => ({ ...prev, [key]: 'idle' }))
  }

  const handleResetToDefaults = () => {
    resetConfig()
    setFormData(defaultConfig)
    setFieldStatus({
      gatewayUrl: 'idle',
      databaseUrl: 'idle',
      cuUrl: 'idle',
      hyperbeamNodeUrl: 'idle',
      turboPaymentUrl: 'idle',
      turboUploadUrl: 'idle',
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      {/* Header */}
      <div className="border-border border-b pb-4">
        <h1 className="text-foreground text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure application-wide endpoints and services
        </p>
      </div>

      {/* Configuration Form */}
      <div className="space-y-4">
        <h2 className="text-foreground text-lg font-semibold">
          Service Endpoints
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {configFields.map((field) => (
            <SettingInput
              key={field.key}
              id={field.key}
              label={field.label}
              description={field.description}
              placeholder={field.placeholder}
              value={formData[field.key]}
              originalValue={config[field.key]}
              onChange={(value) => handleInputChange(field.key, value)}
              onSave={() => handleFieldSave(field.key)}
              onReset={() => handleFieldReset(field.key)}
              status={fieldStatus[field.key]}
            />
          ))}
        </div>
      </div>

      {/* Global Action Buttons */}
      <div className="border-border flex items-center justify-center border-t pt-4">
        <Button
          variant="outline"
          onClick={handleResetToDefaults}
          className="flex items-center space-x-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset All to Defaults</span>
        </Button>
      </div>

      {/* Info Section */}
      <div className="bg-muted/50 space-y-2 rounded-lg p-3">
        <h3 className="text-foreground font-medium">About These Settings</h3>
        <ul className="text-muted-foreground space-y-1 text-sm">
          <li>
            • Settings are automatically saved to your browser's local storage
          </li>
          <li>• Changes will take effect immediately across the application</li>
          <li>• Use the "Test" button to verify endpoint connectivity</li>
          <li>• Reset to defaults if you encounter connectivity issues</li>
        </ul>
      </div>
    </div>
  )
}
