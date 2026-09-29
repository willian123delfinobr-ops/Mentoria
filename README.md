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

## 2. Serviços da plataforma

O projeto usa Netlify Identity para as contas dos membros e Netlify Database para aulas, mentorias e notificações. O banco e suas migrações são provisionados automaticamente no deploy.

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

## 6. Criar o administrador

Depois de criar sua conta, atribua a função `admin` ao usuário proprietário em **Netlify → Identity → Users**. Contas administrativas recebem os controles para publicar aulas, agendar mentorias e iniciar transmissões.

## Transmissões

Ao publicar uma mentoria, informe um link incorporável do YouTube ou Vimeo. Os membros assistem sem sair da plataforma e recebem notificações internas; também podem ativar os avisos do navegador.
