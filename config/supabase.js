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

  // Track device login
  async trackDeviceLogin(userId, deviceInfo) {
    try {
      const now = new Date().toISOString()
      console.log('=== DEVICE TRACKING START ===')
      console.log('User ID:', userId)
      console.log('Device info:', deviceInfo)
      console.log('Timestamp:', now)
      
      // Check if device session already exists
      const { data: existingSession, error: sessionError } = await supabase
        .from('user_device_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('device_id', deviceInfo.deviceId)
        .single()

      if (sessionError && sessionError.code !== 'PGRST116') {
        console.error('Error checking existing session:', sessionError)
      }

      let deviceSessionId = null

      if (existingSession) {
        // Update existing session
        console.log('Updating existing device session:', existingSession.id)
        const { error: updateError } = await supabase
          .from('user_device_sessions')
          .update({
            last_login: now,
            is_active: true,
            device_name: deviceInfo.deviceName,
            device_type: deviceInfo.deviceType,
            platform: deviceInfo.platform,
            os_version: deviceInfo.osVersion,
            app_version: deviceInfo.appVersion
          })
          .eq('id', existingSession.id)
        
        if (updateError) {
          console.error('Error updating device session:', updateError)
        } else {
          deviceSessionId = existingSession.id
        }
      } else {
        // Create new device session
        console.log('Creating new device session')
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
        } else {
          deviceSessionId = newSession.id
          console.log('✅ Created new device session:', deviceSessionId)
        }
      }

      // Create login history entry
      if (deviceSessionId) {
        const { error: historyError } = await supabase
          .from('user_login_history')
          .insert({
            user_id: userId,
            device_session_id: deviceSessionId,
            login_at: now
          })
        
        if (historyError) {
          console.error('Error creating login history:', historyError)
          console.log('History error details:', JSON.stringify(historyError, null, 2))
        } else {
          console.log('✅ Created login history entry')
        }
      } else {
        console.log('❌ No device session ID available, skipping login history')
      }

      console.log('=== DEVICE TRACKING COMPLETE ===')
    } catch (error) {
      console.error('❌ Device tracking error:', error)
      console.log('Error details:', JSON.stringify(error, null, 2))
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
