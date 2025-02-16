-- Create the set_updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS TRIGGER
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN new;
END;
$$
LANGUAGE plpgsql;

CREATE TABLE table_widgets(
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    prefixed_id text NOT NULL,
    user_id uuid NOT NULL,
    widgets jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (prefixed_id, user_id)
);

ALTER TABLE table_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated user can manage their table widgets" ON table_widgets
    FOR ALL TO authenticated
        USING (auth.uid() = user_id);

-- Add trigger to update updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON table_widgets
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

