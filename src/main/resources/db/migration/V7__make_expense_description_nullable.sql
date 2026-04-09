-- Allow expenses to have no description
ALTER TABLE expenses ALTER COLUMN description DROP NOT NULL;
