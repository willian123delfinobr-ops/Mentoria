import { useState } from "react";
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

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">M</div>
        <h1>Plataforma de Mentoria</h1>
        <p className="muted">Entre para continuar seus estudos.</p>

        <label>E-mail</label>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />

        <label>Senha</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

        <button className="primary" onClick={() => onLogin({ email, password })}>
          Entrar
        </button>

        <button className="link-button">Esqueci minha senha</button>
        <p className="demo-note">Tela inicial de demonstração. O login real será conectado ao Supabase.</p>
      </section>
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
  if (!user) return <Login onLogin={setUser} />;

  const admin = user.email?.toLowerCase() === "admin@admin.com";
  return <Dashboard admin={admin} onLogout={() => setUser(null)} />;
}