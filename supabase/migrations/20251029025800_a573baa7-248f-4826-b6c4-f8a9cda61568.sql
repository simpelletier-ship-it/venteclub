-- Add foreign key relationship between businesses and seller_contacts
-- First check if there's already a constraint, if so drop it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'seller_contacts_seller_id_fkey'
    ) THEN
        ALTER TABLE seller_contacts DROP CONSTRAINT seller_contacts_seller_id_fkey;
    END IF;
END $$;

-- Add the correct foreign key
ALTER TABLE seller_contacts
    ADD CONSTRAINT seller_contacts_seller_id_fkey 
    FOREIGN KEY (seller_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Also ensure businesses table has seller_id properly set
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'businesses_seller_id_fkey'
    ) THEN
        ALTER TABLE businesses DROP CONSTRAINT businesses_seller_id_fkey;
    END IF;
END $$;

ALTER TABLE businesses
    ADD CONSTRAINT businesses_seller_id_fkey 
    FOREIGN KEY (seller_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;