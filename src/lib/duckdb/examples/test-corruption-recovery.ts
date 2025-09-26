/**
 * Test script for database corruption recovery
 * 
 * This script demonstrates how the corruption recovery mechanism works
 * and provides utilities for testing it.
 */

import { getPersistentDataManager } from '../persistent-data-manager'
import { ANTStatisticsUtils } from '@/lib/ant-statistics'

/**
 * Test the corruption recovery mechanism
 */
export async function testCorruptionRecovery() {
  console.log('🧪 Testing database corruption recovery...')
  
  try {
    // Get a test instance
    const testManager = getPersistentDataManager('test-corruption-recovery', {
      name: 'Test Corruption Recovery',
      debug: true,
      config: {
        memory_limit: '128MB',
      }
    })
    
    // Try to initialize (this might fail if corrupted)
    console.log('1️⃣ Attempting initial database initialization...')
    await testManager.initialize()
    console.log('✅ Database initialized successfully')
    
    // Test recovery method
    console.log('2️⃣ Testing manual recovery method...')
    await testManager.recoverFromCorruption()
    console.log('✅ Manual recovery completed successfully')
    
    return true
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}

/**
 * Test the ANT statistics recovery utilities
 */
export async function testANTStatisticsRecovery() {
  console.log('🧪 Testing ANT statistics corruption recovery...')
  
  try {
    // Test automatic recovery
    console.log('1️⃣ Testing automatic recovery...')
    await ANTStatisticsUtils.recoverFromCorruption()
    console.log('✅ Automatic recovery completed')
    
    return true
  } catch (error) {
    console.error('❌ ANT statistics recovery test failed:', error)
    return false
  }
}

/**
 * Simulate database corruption for testing (USE WITH CAUTION!)
 * This creates an invalid database file to test recovery
 */
export async function simulateCorruption(instanceName: string = 'test-corruption') {
  console.warn('⚠️ SIMULATING DATABASE CORRUPTION - USE ONLY FOR TESTING!')
  
  try {
    // Create a test instance
    const testManager = getPersistentDataManager(instanceName, {
      name: 'Test Corruption Simulation',
      debug: true,
    })
    
    // Initialize it first
    await testManager.initialize()
    console.log('✅ Test database created')
    
    // Now we would need to manually corrupt the IndexedDB file
    // This is complex to do programmatically, so we'll just log instructions
    console.log(`
📋 To manually test corruption recovery:

1. Open Browser DevTools → Application → Storage → IndexedDB
2. Find the database: ${instanceName}.db
3. Delete or corrupt some entries manually
4. Refresh the page
5. The corruption should be detected and recovery should trigger

Or use the console commands:
- ANTStatisticsUtils.recoverFromCorruption()
- ANTStatisticsUtils.clearCorruptedDatabase()
    `)
    
    return true
  } catch (error) {
    console.error('❌ Failed to simulate corruption:', error)
    return false
  }
}

/**
 * Console utilities for testing
 */
export const CorruptionTestUtils = {
  testRecovery: testCorruptionRecovery,
  testANTRecovery: testANTStatisticsRecovery,
  simulate: simulateCorruption,
  
  // Quick recovery commands
  recoverDefault: () => ANTStatisticsUtils.recoverFromCorruption(),
  clearDefault: () => ANTStatisticsUtils.clearCorruptedDatabase(),
  
  // Manual recovery for specific instances
  recoverInstance: async (instanceName: string) => {
    const manager = getPersistentDataManager(instanceName)
    await manager.recoverFromCorruption()
  },
}

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  ;(window as any).CorruptionTestUtils = CorruptionTestUtils
}
