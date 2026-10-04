"""
Lightweight, dependency-free migration runner.

This project has no Alembic — models.Base.metadata.create_all() only
creates brand-new TABLES, it never adds new COLUMNS to a table that
already exists in the live database. Since there's a production
Postgres with real user rows, any new column added to models.py needs
to be added to the live table by hand once.

run_migrations() is called once at startup, after create_all(). It is
idempotent and safe to run on every boot: it inspects the actual
columns on each table and only issues an ALTER TABLE for columns that
are missing. New users created after create_all() runs will already
have the column (because the table was just created fresh in a brand
new environment), so this only matters for the live, pre-existing
table — but it's harmless either way.

To add a new column to an existing model in the future:
1. Add the Column(...) to the model in models.py as normal.
2. Add one entry to MIGRATIONS below: (table_name, column_name, ddl_type, default_sql_or_None).
3. Deploy. run_migrations() picks it up on next boot.
"""

from sqlalchemy import inspect, text


# (table, column, column_type_sql, default_sql | None)
MIGRATIONS = [
    ("users", "content_style", "VARCHAR", None),
    ("users", "biggest_challenge", "VARCHAR", None),
    ("users", "goal", "VARCHAR", None),
    ("users", "questionnaire_completed", "BOOLEAN", "FALSE"),
]


def run_migrations(engine):
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as conn:
        for table, column, col_type, default_sql in MIGRATIONS:
            if table not in existing_tables:
                # Table doesn't exist yet (fresh DB) - create_all() will
                # make it with the column already included. Nothing to do.
                continue

            existing_columns = {c["name"] for c in inspector.get_columns(table)}
            if column in existing_columns:
                continue

            default_clause = f" DEFAULT {default_sql}" if default_sql else ""
            ddl = f'ALTER TABLE {table} ADD COLUMN {column} {col_type}{default_clause}'
            print(f"[migrations] Adding missing column: {table}.{column}")
            conn.execute(text(ddl))