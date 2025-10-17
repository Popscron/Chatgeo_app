// Supabase configuration for mobile app
import { createClient } from '@supabase/supabase-js'

// Your Supabase credentials (same as admin dashboard)
const supabaseUrl = 'https://xgelzppcffgmrlxpjfoq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZWx6cHBjZmZnbXJseHBqZm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDA5NDMsImV4cCI6MjA3NDcxNjk0M30.TJqvE8Q6DgffaZt6jSvjPeqsPOXrJsbqxpAekQHoYMI'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for mobile app
export const mobileSupabaseHelpers = {
  // User authentication
  async authenticateUser(phoneNumber, password) {
    try {
      // Get user from database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phoneNumber)
        .eq('status', 'active')
        .single()

      if (error || !user) {
        return { success: false, error: 'Invalid credentials' }
      }

      // For now, we'll use simple password check
      // In production, you should hash passwords properly
      if (password === '123456') { // Default password for new users
        return { 
          success: true, 
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            status: user.status
          }
        }
      }

      return { success: false, error: 'Invalid password' }
    } catch (error) {
      return { success: false, error: 'Authentication failed' }
    }
  },

  // Check user subscription status
  async checkSubscription(userId) {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error || !subscription) {
        return { 
          hasActiveSubscription: false, 
          daysRemaining: 0,
          subscription: null 
        }
      }

      const now = new Date()
      const endDate = new Date(subscription.end_date)
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))

      return {
        hasActiveSubscription: daysRemaining > 0,
        daysRemaining: Math.max(0, daysRemaining),
        subscription: subscription
      }
    } catch (error) {
      return { 
        hasActiveSubscription: false, 
        daysRemaining: 0,
        subscription: null 
      }
    }
  },

  // Log user activity
  async logActivity(userId, activityType, activityData = {}) {
    try {
      const { error } = await supabase
        .from('user_activity')
        .insert({
          user_id: userId,
          activity_type: activityType,
          activity_data: activityData,
          timestamp: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to log activity:', error)
      }
    } catch (error) {
      console.error('Activity logging error:', error)
    }
  },

  // Update analytics summary
  async updateAnalytics(userId, activityType) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get existing analytics for today
      const { data: existing } = await supabase
        .from('analytics_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single()

      const updates = {}
      if (activityType === 'screenshot') {
        updates.screenshots_count = (existing?.screenshots_count || 0) + 1
      } else if (activityType === 'recording') {
        updates.recordings_count = (existing?.recordings_count || 0) + 1
      } else if (activityType === 'login') {
        updates.login_count = (existing?.login_count || 0) + 1
      }

      if (existing) {
        // Update existing record
        await supabase
          .from('analytics_summary')
          .update(updates)
          .eq('id', existing.id)
      } else {
        // Create new record
        await supabase
          .from('analytics_summary')
          .insert({
            user_id: userId,
            date: today,
            ...updates
          })
      }
    } catch (error) {
      console.error('Analytics update error:', error)
    }
  },

  // Track device login with multi-device detection
  async trackDeviceLogin(userId, deviceInfo) {
    try {
      const now = new Date().toISOString()
      
      // First, check if there's an existing session for this specific device
      console.log('🔍 Checking for existing session on current device:', deviceInfo.deviceId)
      
      const { data: currentDeviceSession, error: currentSessionError } = await supabase
        .from('user_device_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('device_id', deviceInfo.deviceId)
        .single()

      if (currentSessionError && currentSessionError.code !== 'PGRST116') {
        console.error('Error checking current device session:', currentSessionError)
      }

      // If there's an existing session on the same device (even if inactive), allow login
      if (currentDeviceSession) {
        console.log('✅ Found existing session on same device - allowing login')
        console.log('📱 Current device session details:', {
          id: currentDeviceSession.id,
          device_id: currentDeviceSession.device_id,
          is_active: currentDeviceSession.is_active,
          last_login: currentDeviceSession.last_login
        })
        
        // Update the existing session to active
        const { error: updateError } = await supabase
          .from('user_device_sessions')
          .update({
            last_login: now,
            is_active: true,
            device_name: deviceInfo.deviceName,
            device_type: deviceInfo.deviceType,
            platform: deviceInfo.platform,
            os_version: deviceInfo.osVersion,
            app_version: deviceInfo.appVersion,
            updated_at: now
          })
          .eq('id', currentDeviceSession.id)

        if (updateError) {
          console.error('Error updating existing session:', updateError)
        } else {
          console.log('✅ Existing session reactivated for same device')
        }

        return {
          success: true,
          hasConflict: false,
          message: 'Same device login allowed'
        }
      }
      
      // If no existing session on current device, check for active sessions on OTHER devices
      console.log('🔍 No existing session on current device - checking for active sessions on OTHER devices for user:', userId)
      
      const { data: activeSessions, error: activeSessionsError } = await supabase
        .from('user_device_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .neq('device_id', deviceInfo.deviceId)

      console.log('🔍 Active sessions on other devices found:', activeSessions?.length || 0, activeSessions)

      if (activeSessionsError) {
        console.error('Error checking active sessions:', activeSessionsError)
      }

      // If there are active sessions on other devices, create a login request
      if (activeSessions && activeSessions.length > 0) {
        console.log(`Found ${activeSessions.length} active sessions on other devices - creating login request`)
        
        // Create a login request for admin approval
        const { error: requestError } = await supabase
          .from('login_requests')
          .insert({
            user_id: userId,
            device_id: deviceInfo.deviceId,
            device_name: deviceInfo.deviceName,
            device_type: deviceInfo.deviceType,
            platform: deviceInfo.platform,
            os_version: deviceInfo.osVersion,
            app_version: deviceInfo.appVersion,
            status: 'pending',
            requested_at: new Date().toISOString(),
            reason: 'Account already in use on another device'
          })

        if (requestError) {
          console.error('Error creating login request:', requestError)
        } else {
          console.log('✅ Login request created for admin approval')
        }
        
        // Return conflict info - block the login
        return {
          success: false,
          hasConflict: true,
          error: 'Account is already in use on another device.',
          activeSessions: activeSessions.length,
          requestCreated: true
        }
      }

      // No active sessions on other devices, create new session for this device
      console.log('No active sessions on other devices - creating new session')
      const { data: newSession, error: insertError } = await supabase
        .from('user_device_sessions')
        .insert({
          user_id: userId,
          device_id: deviceInfo.deviceId,
          device_name: deviceInfo.deviceName,
          device_type: deviceInfo.deviceType,
          platform: deviceInfo.platform,
          os_version: deviceInfo.osVersion,
          app_version: deviceInfo.appVersion,
          last_login: now,
          first_login: now,
          is_active: true
        })
        .select()
        .single()
        
      if (insertError) {
        console.error('Error creating device session:', insertError)
        console.log('Insert error details:', JSON.stringify(insertError, null, 2))
        return {
          success: false,
          hasConflict: false,
          error: 'Failed to create device session'
        }
      } else {
        console.log('✅ Created new device session:', newSession.id)
        
        // Create login history entry
        const { error: historyError } = await supabase
          .from('user_login_history')
          .insert({
            user_id: userId,
            device_session_id: newSession.id,
            login_at: now
          })
        
        if (historyError) {
          console.error('Error creating login history:', historyError)
          console.log('History error details:', JSON.stringify(historyError, null, 2))
        } else {
          console.log('✅ Created login history entry')
        }

        console.log('=== DEVICE TRACKING COMPLETE ===')
        
        return {
          success: true,
          hasConflict: false,
          message: 'New device session created successfully'
        }
      }
    } catch (error) {
      console.error('❌ Device tracking error:', error)
      console.log('Error details:', JSON.stringify(error, null, 2))
      return {
        success: false,
        hasConflict: false,
        error: error.message
      }
    }
  },

  // Check if current session is still active
  async checkSessionStatus(userId, deviceId) {
    try {
      const { data: session, error } = await supabase
        .from('user_device_sessions')
        .select('is_active, last_login, device_name')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .single()

      if (error) {
        // If no session found (PGRST116), that's not necessarily an error
        if (error.code === 'PGRST116') {
          console.log('No session found for this device - this is normal for first login')
          return { isActive: true, error: null, message: 'No session found' }
        }
        console.error('Error checking session status:', error)
        return { isActive: false, error: error.message }
      }

      return {
        isActive: session?.is_active || false,
        lastLogin: session?.last_login,
        deviceName: session?.device_name
      }
    } catch (error) {
      console.error('Session status check error:', error)
      return { isActive: false, error: error.message }
    }
  },

  // Check if there's an approved login request for this device
  async checkLoginRequest(userId, deviceId) {
    try {
      const { data: request, error } = await supabase
        .from('login_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('device_id', deviceId)
        .eq('status', 'approved')
        .order('requested_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { hasApprovedRequest: false, request: null }
        }
        console.error('Error checking login request:', error)
        return { hasApprovedRequest: false, error: error.message }
      }

      return {
        hasApprovedRequest: true,
        request: request
      }
    } catch (error) {
      console.error('Login request check error:', error)
      return { hasApprovedRequest: false, error: error.message }
    }
  },

  // Mark login request as used (after successful login)
  async markLoginRequestUsed(requestId) {
    try {
      const { error } = await supabase
        .from('login_requests')
        .update({ 
          status: 'used',
          used_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) {
        console.error('Error marking login request as used:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Mark login request used error:', error)
      return { success: false, error: error.message }
    }
  },

  // Deactivate device session (on logout)
  async deactivateDeviceSession(userId, deviceId) {
    try {
      const { error } = await supabase
        .from('user_device_sessions')
        .update({ 
          is_active: false
        })
        .eq('user_id', userId)
        .eq('device_id', deviceId)

      if (error) {
        console.error('Error deactivating device session:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Device session deactivated for user:', userId, 'device:', deviceId)
      return { success: true }
    } catch (error) {
      console.error('Deactivate device session error:', error)
      return { success: false, error: error.message }
    }
  },

  // Get notifications for user
  async getNotifications() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('target_audience', 'all')
        .eq('status', 'sent')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Notifications fetch error:', error)
      return []
    }
  },

  // Mark notification as viewed by user
  async markNotificationViewed(notificationId, userId, action = 'viewed') {
    try {
      const { data, error } = await supabase
        .from('notification_views')
        .upsert({
          notification_id: notificationId,
          user_id: userId,
          action: action,
          viewed_at: new Date().toISOString()
        }, {
          onConflict: 'notification_id,user_id'
        })
        .select()

      if (error) {
        console.error('Error marking notification as viewed:', error)
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Mark notification viewed error:', error)
      return { success: false, error }
    }
  },

  // Get viewed notifications for user
  async getViewedNotifications(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_views')
        .select('notification_id, action, viewed_at')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching viewed notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Get viewed notifications error:', error)
      return []
    }
  },

  // Get user status
  async getUserStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('status')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user status:', error)
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Get user status error:', error)
      return { success: false, error }
    }
  },

  // Get user profile data
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, phone, status, created_at, updated_at, last_active, profile_image, country, timezone')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Get user profile error:', error)
      return { success: false, error }
    }
  },

  // Get user subscription data
  async getUserSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, start_date, end_date, days_remaining, status, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        // No subscription found is not necessarily an error
        if (error.code === 'PGRST116') {
          return { success: true, data: null }
        }
        console.error('Error fetching user subscription:', error)
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Get user subscription error:', error)
      return { success: false, error }
    }
  }
}
