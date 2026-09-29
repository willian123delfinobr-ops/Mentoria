-- =========================================================
-- PLATAFORMA DE MENTORIA - SUPABASE
-- Execute este arquivo no SQL Editor do seu projeto Supabase.
-- =========================================================

create extension if not exists "pgcrypto";

-- PERFIS
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'student' check (role in ('student','mentor','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CURSOS / MÓDULOS
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- AULAS / VÍDEOS
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.modules(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  thumbnail_url text,
  duration_seconds integer,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(lesson_id, student_id)
);

-- PROVAS
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  duration_minutes integer,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'multiple_choice'
    check (question_type in ('multiple_choice','true_false','text')),
  options jsonb,
  correct_answer text,
  points numeric(8,2) not null default 1,
  sort_order integer not null default 0
);

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  score numeric(8,2),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.student_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  question_id uuid not null references public.exam_questions(id) on delete cascade,
  answer text,
  is_correct boolean,
  points_earned numeric(8,2) default 0
);

-- PERGUNTAS / DÚVIDAS
create table if not exists public.student_questions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  title text not null,
  body text not null,
  answer text,
  answered_by uuid references public.profiles(id) on delete set null,
  answered_at timestamptz,
  status text not null default 'open' check (status in ('open','answered','closed')),
  created_at timestamptz not null default now()
);

-- MENTORIAS AO VIVO
create table if not exists public.live_classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  meeting_url text,
  recording_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- MATERIAIS
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_url text not null,
  file_type text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- AVISOS
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================================================
-- FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE APÓS CADASTRO
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'Novo aluno'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================================================
-- FUNÇÃO SEGURA PARA VERIFICAR ADMIN
-- =========================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =========================================================
-- RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.student_answers enable row level security;
alter table public.student_questions enable row level security;
alter table public.live_classes enable row level security;
alter table public.materials enable row level security;
alter table public.announcements enable row level security;

-- Perfil: usuário vê o próprio perfil; admin vê todos.
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Conteúdos publicados podem ser lidos por usuários autenticados.
create policy "courses_read_authenticated"
on public.courses for select
to authenticated
using (published = true or public.is_admin());

create policy "modules_read_authenticated"
on public.modules for select
to authenticated
using (
  public.is_admin() or exists (
    select 1 from public.courses c
    where c.id = course_id and c.published = true
  )
);

create policy "lessons_read_authenticated"
on public.lessons for select
to authenticated
using (published = true or public.is_admin());

create policy "exams_read_authenticated"
on public.exams for select
to authenticated
using (published = true or public.is_admin());

create policy "exam_questions_read_authenticated"
on public.exam_questions for select
to authenticated
using (
  public.is_admin() or exists (
    select 1 from public.exams e
    where e.id = exam_id and e.published = true
  )
);

create policy "live_classes_read_authenticated"
on public.live_classes for select
to authenticated
using (published = true or public.is_admin());

create policy "materials_read_authenticated"
on public.materials for select
to authenticated
using (published = true or public.is_admin());

create policy "announcements_read_authenticated"
on public.announcements for select
to authenticated
using (published = true or public.is_admin());

-- Progresso: cada aluno acessa apenas o próprio.
create policy "progress_own"
on public.lesson_progress for all
to authenticated
using (student_id = auth.uid() or public.is_admin())
with check (student_id = auth.uid() or public.is_admin());

-- Tentativas: aluno vê/cria as próprias.
create policy "attempts_own"
on public.exam_attempts for all
to authenticated
using (student_id = auth.uid() or public.is_admin())
with check (student_id = auth.uid() or public.is_admin());

create policy "answers_own_or_admin"
on public.student_answers for all
to authenticated
using (
  public.is_admin() or exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id and a.student_id = auth.uid()
  )
)
with check (
  public.is_admin() or exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id and a.student_id = auth.uid()
  )
);

-- Perguntas: aluno vê e cria as próprias; admin/mentor poderá gerenciar.
create policy "questions_read"
on public.student_questions for select
to authenticated
using (student_id = auth.uid() or public.is_admin());

create policy "questions_insert"
on public.student_questions for insert
to authenticated
with check (student_id = auth.uid());

create policy "questions_update"
on public.student_questions for update
to authenticated
using (student_id = auth.uid() or public.is_admin())
with check (student_id = auth.uid() or public.is_admin());

-- =========================================================
-- POLÍTICAS ADMINISTRATIVAS
-- =========================================================

create policy "admin_courses_insert"
on public.courses for insert to authenticated
with check (public.is_admin());

create policy "admin_courses_update"
on public.courses for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admin_courses_delete"
on public.courses for delete to authenticated
using (public.is_admin());

create policy "admin_modules_all"
on public.modules for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admin_lessons_all"
on public.lessons for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admin_exams_all"
on public.exams for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admin_exam_questions_all"
on public.exam_questions for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admin_live_classes_all"
on public.live_classes for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admin_materials_all"
on public.materials for all
to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admin_announcements_all"
on public.announcements for all
to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Índices úteis
create index if not exists idx_lessons_module on public.lessons(module_id);
create index if not exists idx_progress_student on public.lesson_progress(student_id);
create index if not exists idx_questions_student on public.student_questions(student_id);
create index if not exists idx_live_classes_starts on public.live_classes(starts_at);
create index if not exists idx_attempts_student on public.exam_attempts(student_id);