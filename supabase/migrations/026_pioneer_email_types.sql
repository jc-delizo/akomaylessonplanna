-- Add Pioneer program email types to email_configuration
-- Pioneer workflow: welcome when added, notification when removed

INSERT INTO email_configuration (email_type, is_enabled, notes) VALUES
  ('pioneer_welcome', true, 'Pioneer welcome - Sent when seller is added as Pioneer'),
  ('pioneer_removed', true, 'Pioneer status removed - Sent when Pioneer status is removed')
ON CONFLICT (email_type) DO NOTHING;
