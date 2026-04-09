CREATE TABLE budgets (
    id BIGSERIAL PRIMARY KEY,
    monthly_limit DECIMAL(15, 2) NOT NULL,
    month INTEGER NOT NULL,
    budget_year INTEGER NOT NULL,
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    CONSTRAINT unique_budget_per_category_month UNIQUE (user_id, category_id, month, budget_year)
);
