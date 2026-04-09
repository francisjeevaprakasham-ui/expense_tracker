-- Remove all global/default categories (those not belonging to any user)
DELETE FROM categories WHERE user_id IS NULL;
