-- Rename reserved keyword column 'month' to 'budget_month' to avoid PostgreSQL conflicts
ALTER TABLE budgets RENAME COLUMN month TO budget_month;

-- Drop the old unique constraint and recreate it with the new column name
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS unique_budget_per_category_month;
ALTER TABLE budgets ADD CONSTRAINT unique_budget_per_category_month
    UNIQUE (user_id, category_id, budget_month, budget_year);
