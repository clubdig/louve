-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ENUM types
create type funcao_usuario as enum (
  'admin', 'ministro', 'vocal', 'baixo', 'bateria', 'guitarra', 'violao', 'teclado'
);

create type status_usuario as enum ('ativo', 'inativo');

create type categoria_musica as enum (
  'adoracao', 'celebracao', 'ceia', 'oferta', 'encerramento', 'especial'
);

-- Usuarios
create table usuarios (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  email text unique not null,
  senha_hash text not null,
  funcao funcao_usuario not null default 'vocal',
  telefone text,
  foto text,
  status status_usuario not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Musicas
create table musicas (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  artista text,
  tom_original text,
  tom_atual text,
  versao text,
  bpm integer,
  youtube text,
  cifra text,
  spotify text,
  playback text,
  multitrack text,
  categoria categoria_musica not null default 'adoracao',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cultos
create table cultos (
  id uuid primary key default uuid_generate_v4(),
  data date not null,
  horario time not null,
  tema text,
  pregador text,
  observacoes text,
  created_at timestamptz not null default now()
);

-- Repertorios (musicas do culto)
create table repertorios (
  id uuid primary key default uuid_generate_v4(),
  culto_id uuid not null references cultos(id) on delete cascade,
  musica_id uuid not null references musicas(id) on delete cascade,
  ordem integer not null,
  tom text,
  versao text,
  observacao text,
  created_at timestamptz not null default now()
);

-- Escalas (quem toca em cada culto)
create table escalas (
  id uuid primary key default uuid_generate_v4(),
  culto_id uuid not null references cultos(id) on delete cascade,
  usuario_id uuid not null references usuarios(id) on delete cascade,
  funcao funcao_usuario not null,
  confirmado boolean default false,
  observacao text,
  created_at timestamptz not null default now()
);

-- Transposicoes de tom
create table transposicoes (
  id uuid primary key default uuid_generate_v4(),
  musica_id uuid not null references musicas(id) on delete cascade,
  tom_original text not null,
  tom_novo text not null,
  acordes text not null,
  created_at timestamptz not null default now()
);

-- Historico de uso de musicas
create table musica_historico (
  id uuid primary key default uuid_generate_v4(),
  musica_id uuid not null references musicas(id) on delete cascade,
  culto_id uuid not null references cultos(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS policies
alter table usuarios enable row level security;
alter table musicas enable row level security;
alter table cultos enable row level security;
alter table repertorios enable row level security;
alter table escalas enable row level security;
alter table transposicoes enable row level security;
alter table musica_historico enable row level security;

-- Allow all for authenticated users (simplified for now)
create policy "Allow all for authenticated" on usuarios for all using (true);
create policy "Allow all for authenticated" on musicas for all using (true);
create policy "Allow all for authenticated" on cultos for all using (true);
create policy "Allow all for authenticated" on repertorios for all using (true);
create policy "Allow all for authenticated" on escalas for all using (true);
create policy "Allow all for authenticated" on transposicoes for all using (true);
create policy "Allow all for authenticated" on musica_historico for all using (true);

-- Indexes
create index on musicas(titulo);
create index on musicas(artista);
create index on musicas(categoria);
create index on cultos(data);
create index on repertorios(culto_id);
create index on escalas(culto_id);
create index on escalas(usuario_id);
