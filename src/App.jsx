import { useEffect, useState } from "react";
import {
  acceptInvite, AuthError, getUser, handleAuthCallback, login, logout,
  MissingIdentityError, onAuthChange, requestPasswordRecovery, updateUser
} from "@netlify/identity";
import {
  LayoutDashboard, Video, FileText, HelpCircle, Radio,
  FolderOpen, Users, Settings, LogOut, Menu, X, LockKeyhole
} from "lucide-react";

const menuAluno = [
  ["Início", LayoutDashboard],
  ["Aulas", Video],
  ["Provas", FileText],
  ["Perguntas", HelpCircle],
  ["Mentoria ao vivo", Radio],
  ["Materiais", FolderOpen]
];

const menuAdmin = [
  ["Dashboard", LayoutDashboard],
  ["Alunos", Users],
  ["Vídeos", Video],
  ["Provas", FileText],
  ["Perguntas", HelpCircle],
  ["Mentorias", Radio],
  ["Materiais", FolderOpen],
  ["Configurações", Settings]
];

function authMessage(error) {
  if (error instanceof MissingIdentityError) return "A autenticação ainda não está disponível neste ambiente.";
  if (error instanceof AuthError && error.status === 401) return "E-mail ou senha inválidos.";
  return error instanceof AuthError ? error.message : "Não foi possível concluir a operação. Tente novamente.";
}

function Login({ onLogin, inviteToken, recoveryMode, onPasswordUpdated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (inviteToken) {
        const invitedUser = await acceptInvite(inviteToken, password);
        onPasswordUpdated();
        onLogin(invitedUser);
      } else if (recoveryMode) {
        const updatedUser = await updateUser({ password });
        onPasswordUpdated();
        onLogin(updatedUser);
      } else {
        onLogin(await login(email.trim(), password));
      }
    } catch (error) {
      setMessage(authMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function recover() {
    if (!email.trim()) {
      setMessage("Informe seu e-mail para recuperar a senha.");
      return;
    }
    setBusy(true);
    try {
      await requestPasswordRecovery(email.trim());
      setMessage("Enviamos as instruções de recuperação para o seu e-mail.");
    } catch (error) {
      setMessage(authMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const changingPassword = Boolean(inviteToken || recoveryMode);

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark">M</div>
        <h1>{changingPassword ? "Defina sua senha" : "Plataforma de Mentoria"}</h1>
        <p className="muted">{changingPassword ? "Crie uma senha para concluir o acesso." : "Entre para continuar seus estudos."}</p>

        {!changingPassword && <>
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
        </>}

        <label htmlFor="password">{changingPassword ? "Nova senha" : "Senha"}</label>
        <input id="password" type="password" autoComplete={changingPassword ? "new-password" : "current-password"} minLength={6} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

        {message && <p className="auth-message" role="status">{message}</p>}

        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Aguarde..." : changingPassword ? "Salvar senha" : "Entrar"}
        </button>

        {!changingPassword && <button className="link-button" type="button" disabled={busy} onClick={recover}>Esqueci minha senha</button>}
      </form>
    </main>
  );
}

function Dashboard({ admin = false, onLogout }) {
  const [active, setActive] = useState(admin ? "Dashboard" : "Início");
  const menu = admin ? menuAdmin : menuAluno;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">M</div>
          <span>Mentoria</span>
        </div>

        <nav>
          {menu.map(([label, Icon]) => (
            <button
              key={label}
              className={active === label ? "nav-item active" : "nav-item"}
              onClick={() => setActive(label)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button className="nav-item logout" onClick={onLogout}>
          <LogOut size={19} />
          <span>Sair</span>
        </button>
      </aside>

      <main className="content">
        <header className="topbar">
          <button className="mobile-menu"><Menu size={22} /></button>
          <div>
            <h2>{active}</h2>
            <span className="muted">{admin ? "Área administrativa" : "Área do aluno"}</span>
          </div>
          <div className="avatar">{admin ? "AD" : "AL"}</div>
        </header>

        <section className="page">
          {active === "Início" && <AlunoHome />}
          {active === "Dashboard" && <AdminHome />}
          {active !== "Início" && active !== "Dashboard" && (
            <Placeholder title={active} admin={admin} />
          )}
        </section>
      </main>
    </div>
  );
}

function AlunoHome() {
  return <>
    <div className="hero">
      <div>
        <span className="eyebrow">BEM-VINDO</span>
        <h1>Continue seus estudos</h1>
        <p>Acompanhe suas aulas, provas e próximas mentorias.</p>
      </div>
      <Video size={54} strokeWidth={1.4} />
    </div>

    <div className="cards">
      <Stat title="Aulas disponíveis" value="24" />
      <Stat title="Provas" value="8" />
      <Stat title="Progresso" value="68%" />
      <Stat title="Dúvidas abertas" value="3" />
    </div>

    <div className="grid-two">
      <div className="panel">
        <h3>Continue de onde parou</h3>
        <div className="lesson">
          <div className="icon-box"><Video size={20}/></div>
          <div><strong>Aula 12 — Introdução</strong><small>68% concluída</small></div>
          <button>Continuar</button>
        </div>
      </div>
      <div className="panel">
        <h3>Próxima mentoria</h3>
        <div className="live-box">
          <Radio size={22}/>
          <div><strong>Mentoria ao vivo</strong><small>Hoje • 20:00</small></div>
        </div>
      </div>
    </div>
  </>;
}

function AdminHome() {
  return <>
    <div className="hero admin-hero">
      <div>
        <span className="eyebrow">ADMINISTRADOR</span>
        <h1>Painel de controle</h1>
        <p>Gerencie alunos, conteúdos, provas e mentorias.</p>
      </div>
      <LockKeyhole size={54} strokeWidth={1.4} />
    </div>
    <div className="cards">
      <Stat title="Alunos" value="0" />
      <Stat title="Vídeos" value="0" />
      <Stat title="Provas" value="0" />
      <Stat title="Perguntas pendentes" value="0" />
    </div>
    <div className="panel">
      <h3>Próximos módulos</h3>
      <p className="muted">Quando o Supabase estiver conectado, os conteúdos cadastrados aparecerão aqui.</p>
    </div>
  </>;
}

function Stat({ title, value }) {
  return <div className="stat"><span>{title}</span><strong>{value}</strong></div>;
}

function Placeholder({ title, admin }) {
  return <div className="empty panel">
    <div className="empty-icon">{title === "Mentoria ao vivo" ? <Radio/> : <FolderOpen/>}</div>
    <h2>{title}</h2>
    <p className="muted">Módulo preparado para receber os dados do Supabase.</p>
    {admin && <button className="primary small-button">Adicionar conteúdo</button>}
  </div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteToken, setInviteToken] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthChange((_event, nextUser) => {
      if (active) setUser(nextUser);
    });

    async function restoreSession() {
      try {
        const callback = await handleAuthCallback();
        if (!active) return;
        if (callback?.type === "invite") setInviteToken(callback.token);
        else if (callback?.type === "recovery") {
          setRecoveryMode(true);
          setUser(null);
        } else if (callback?.user) setUser(callback.user);
        else setUser(await getUser());
      } catch {
        if (active) setUser(await getUser());
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  if (loading) return <main className="login-page"><p className="muted">Carregando acesso...</p></main>;
  if (!user || inviteToken || recoveryMode) return <Login
    onLogin={setUser}
    inviteToken={inviteToken}
    recoveryMode={recoveryMode}
    onPasswordUpdated={() => { setInviteToken(null); setRecoveryMode(false); }}
  />;

  const admin = user.roles?.includes("admin") || user.role === "admin";
  return <Dashboard admin={admin} onLogout={handleLogout} />;
}
