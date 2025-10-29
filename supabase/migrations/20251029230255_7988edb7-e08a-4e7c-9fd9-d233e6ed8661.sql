-- Remove equipment lease fields from businesses table
ALTER TABLE businesses 
DROP COLUMN IF EXISTS equipment_lease,
DROP COLUMN IF EXISTS equipment_lease_cost;