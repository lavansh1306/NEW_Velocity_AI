-- Migration to add settings columns for Organization thresholds and AI parameters
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS overload_threshold INTEGER DEFAULT 110,
ADD COLUMN IF NOT EXISTS ai_low_confidence_threshold INTEGER DEFAULT 70,
ADD COLUMN IF NOT EXISTS ai_health_score_warning INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS ai_timeline_risk_days INTEGER DEFAULT 7;

COMMENT ON COLUMN organizations.overload_threshold IS 'Percentage above which utilization is considered overload';
COMMENT ON COLUMN organizations.ai_low_confidence_threshold IS 'Percentage below which AI confidence is considered low';
COMMENT ON COLUMN organizations.ai_health_score_warning IS 'Score below which a project health warning is shown';
COMMENT ON COLUMN organizations.ai_timeline_risk_days IS 'Number of days of predicted delay that triggers a risk alert';
