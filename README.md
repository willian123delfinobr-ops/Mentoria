# Plataforma de Mentoria

Projeto inicial para uma plataforma de estudos com:

- Login e autenticação
- Área do aluno
- Área administrativa
- Aulas/vídeos
- Provas
- Perguntas
- Mentorias ao vivo
- Materiais

## 1. Instalar

```bash
npm install
```

## 2. Configurar Supabase

Crie um projeto no Supabase e abra:

**SQL Editor → New query**

Cole e execute:

```text
supabase/schema.sql
```

Depois copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
```

## 3. Rodar

```bash
npm run dev
```

## 4. GitHub

Envie o projeto para um repositório GitHub.

**Nunca coloque `.env` no GitHub.**

## 5. Netlify

No Netlify:

- Add new project
- Import an existing project
- Escolha o repositório GitHub
- Build command: `npm run build`
- Publish directory: `dist`

Em Environment Variables, adicione:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## 6. Criar o administrador

O SQL cria automaticamente um perfil quando alguém se cadastra.

Depois que o usuário administrador se cadastrar, no Supabase SQL Editor execute:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users
  where email = 'SEU_EMAIL_AQUI'
);
```

Substitua `SEU_EMAIL_AQUI` pelo e-mail do dono.

## Importante

A `anon key` do Supabase pode aparecer no frontend. A proteção real deve ser feita pelas políticas RLS.

**Nunca coloque a `service_role` key no frontend, no `.env` público ou no GitHub.**

## Próxima etapa

A tela atual é a base visual. O próximo passo é trocar o login de demonstração pelo `supabase.auth`, criar cadastro/recuperação de senha e ligar cada tela às tabelas do banco.