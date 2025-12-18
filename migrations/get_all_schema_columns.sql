-- Query to show ALL SCHEMAS, TABLES, and COLUMNS with their details
-- This provides a complete overview of your database structure

SELECT
  t.table_schema as "Schema",
  t.table_name as "Table",
  c.column_name as "Column",
  c.data_type as "Data Type",
  c.character_maximum_length as "Max Length",
  c.numeric_precision as "Precision",
  c.numeric_scale as "Scale",
  c.is_nullable as "Nullable",
  c.column_default as "Default Value",
  CASE 
    WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'PRIMARY KEY'
    WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FOREIGN KEY'
    WHEN tc.constraint_type = 'UNIQUE' THEN 'UNIQUE'
    ELSE NULL
  END as "Constraint"
FROM 
  information_schema.tables t
  LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
  LEFT JOIN information_schema.key_column_usage kcu ON c.table_name = kcu.table_name 
    AND c.column_name = kcu.column_name AND c.table_schema = kcu.table_schema
  LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name 
    AND kcu.table_schema = tc.table_schema
WHERE 
  t.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY 
  t.table_schema, t.table_name, c.ordinal_position;
