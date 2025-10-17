-- Create login_requests table for admin approval system
CREATE TABLE IF NOT EXISTS login_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  platform TEXT,
  os_version TEXT,
  app_version TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'used')),
  reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES users(id),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_login_requests_user_id ON login_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_login_requests_status ON login_requests(status);
CREATE INDEX IF NOT EXISTS idx_login_requests_requested_at ON login_requests(requested_at);

-- Create RLS policies
ALTER TABLE login_requests ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own requests
CREATE POLICY "Users can view their own login requests" ON login_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own requests
CREATE POLICY "Users can create their own login requests" ON login_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own requests (for marking as used)
CREATE POLICY "Users can update their own login requests" ON login_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for admins to see all requests (assuming admin users have specific status or you can modify this)
CREATE POLICY "Admins can view all login requests" ON login_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.status = 'admin'
    )
  );
