-- Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- Create a table for the voice thesaurus / semantic glossary
create table if not exists public.voice_thesaurus (
  id uuid primary key default gen_random_uuid(),
  canonical_term text not null,
  category text, -- e.g. 'quantity', 'action', 'entity'
  embedding vector(768), -- For Google Gemini text-embedding-004
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for faster similarity search
create index on public.voice_thesaurus using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Enable RLS
alter table public.voice_thesaurus enable row level security;

-- Allow public read access (glossary is non-sensitive)
create policy "Allow public read access for voice_thesaurus"
  on public.voice_thesaurus for select
  using (true);

-- RPC function for semantic normalization
create or replace function match_voice_term (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  canonical_term text,
  category text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    vt.id,
    vt.canonical_term,
    vt.category,
    1 - (vt.embedding <=> query_embedding) as similarity
  from voice_thesaurus vt
  where 1 - (vt.embedding <=> query_embedding) > match_threshold
  order by vt.embedding <=> query_embedding
  limit match_count;
end;
$$;
