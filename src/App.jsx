import { useEffect, useState } from "react";
import { Bell, BookOpen, CalendarDays, ChevronRight, CircleUserRound, LayoutDashboard, LogOut, Menu, Play, Plus, Radio, Sparkles, Video, X } from "lucide-react";
import { getUser, handleAuthCallback, login, logout, requestPasswordRecovery, signup } from "@netlify/identity";

const api = async (path, options) => {
  const response = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir a operação.");
  return data;
};

const embedUrl = (url = "") => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes("youtube.com")) return `https://www.youtube.com/embed/${parsed.searchParams.get("v")}`;
    if (parsed.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video/${parsed.pathname.split("/").filter(Boolean).pop()}`;
    return url;
  } catch { return ""; }
};

function Login({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const user = mode === "signup" ? await signup(form.email, form.password, { full_name: form.name }) : await login(form.email, form.password);
      if (mode === "signup" && !user.emailVerified) setMessage("Enviamos um link de confirmação para o seu e-mail.");
      else onAuthenticated(user);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  async function recover() {
    if (!form.email) return setMessage("Digite seu e-mail primeiro.");
    try { await requestPasswordRecovery(form.email); setMessage("Enviamos as instruções de recuperação por e-mail."); }
    catch (error) { setMessage(error.message); }
  }

  return <main className="login-page">
    <section className="login-intro"><span className="brand-chip"><Sparkles size={16}/> CASA MENTORIA</span><h1>Conhecimento que continua <em>depois</em> do encontro.</h1><p>Aulas, materiais e mentorias ao vivo reunidos em um espaço só seu.</p><div className="quote"><Radio/><span>Quando a mentoria começar, você recebe o aviso e assiste aqui mesmo.</span></div></section>
    <form className="login-card" onSubmit={submit}><span className="form-kicker">ÁREA DE MEMBROS</span><h2>{mode === "login" ? "Que bom ter você de volta" : "Crie seu acesso"}</h2><p>Use seus dados para entrar na plataforma.</p>
      {mode === "signup" && <label>Nome completo<input value={form.name} onChange={update("name")} required placeholder="Como podemos chamar você?" /></label>}
      <label>E-mail<input type="email" value={form.email} onChange={update("email")} required placeholder="voce@email.com" /></label><label>Senha<input type="password" minLength="6" value={form.password} onChange={update("password")} required placeholder="Mínimo de 6 caracteres" /></label>
      {message && <div className="form-message">{message}</div>}<button className="primary" disabled={busy}>{busy ? "Aguarde..." : mode === "login" ? "Entrar na plataforma" : "Criar minha conta"}</button>
      {mode === "login" && <button type="button" className="text-button" onClick={recover}>Esqueci minha senha</button>}
      <div className="form-switch">{mode === "login" ? "Ainda não tem acesso?" : "Já tem uma conta?"}<button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "Cadastre-se" : "Entrar"}</button></div>
    </form>
  </main>;
}

function ContentForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ type: "lesson", title: "", description: "", videoUrl: "", scheduledAt: "", isLive: false });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value });
  async function submit(event) { event.preventDefault(); setBusy(true); setError(""); try { await api("/api/content", { method: "POST", body: JSON.stringify(form) }); onSaved(); onClose(); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  return <div className="modal-backdrop"><form className="modal" onSubmit={submit}><button type="button" className="modal-close" onClick={onClose}><X/></button><span className="form-kicker">NOVO CONTEÚDO</span><h2>Publicar na plataforma</h2>
    <div className="segmented"><button type="button" className={form.type === "lesson" ? "selected" : ""} onClick={() => setForm({ ...form, type: "lesson", isLive: false })}>Videoaula</button><button type="button" className={form.type === "live" ? "selected" : ""} onClick={() => setForm({ ...form, type: "live" })}>Mentoria ao vivo</button></div>
    <label>Título<input required value={form.title} onChange={update("title")} placeholder="Ex.: Estratégia de posicionamento" /></label><label>Descrição<textarea value={form.description} onChange={update("description")} placeholder="Conte aos membros o que será abordado" /></label><label>Link do vídeo ou transmissão<input type="url" required value={form.videoUrl} onChange={update("videoUrl")} placeholder="YouTube, Vimeo ou link incorporável" /></label>
    {form.type === "live" && <><label>Data e horário<input type="datetime-local" value={form.scheduledAt} onChange={update("scheduledAt")} /></label><label className="check"><input type="checkbox" checked={form.isLive} onChange={update("isLive")} /> Iniciar a transmissão agora</label></>}
    {error && <div className="form-message">{error}</div>}<button className="primary" disabled={busy}>{busy ? "Publicando..." : "Publicar e notificar membros"}</button></form></div>;
}

function Player({ item, onClose }) {
  return <div className="modal-backdrop"><section className="player-modal"><button className="modal-close light" onClick={onClose}><X/></button><div className="video-frame"><iframe src={embedUrl(item.videoUrl)} title={item.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /></div><div className="player-copy"><span className={item.isLive ? "live-pill" : "type-pill"}>{item.isLive ? "AO VIVO" : "AULA"}</span><h2>{item.title}</h2><p>{item.description || "Conteúdo exclusivo para membros."}</p></div></section></div>;
}

function AppShell({ user, onLogout }) {
  const [data, setData] = useState({ items: [], notifications: [], admin: false });
  const [active, setActive] = useState("Início"); const [menuOpen, setMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(false); const [player, setPlayer] = useState(null); const [noticeOpen, setNoticeOpen] = useState(false);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const unread = data.notifications.filter((item) => !item.read).length;
  const lessons = data.items.filter((item) => item.type === "lesson"); const lives = data.items.filter((item) => item.type === "live"); const liveNow = lives.find((item) => item.isLive);
  async function load(silent = false) { try { const next = await api("/api/content"); if (silent && typeof Notification !== "undefined" && Notification.permission === "granted") { const known = new Set(data.notifications.map((n) => n.id)); next.notifications.filter((n) => !known.has(n.id)).forEach((n) => new Notification(n.title, { body: n.message })); } setData(next); setError(""); } catch (err) { setError(err.message); } finally { setLoading(false); } }
  useEffect(() => { load(); const timer = setInterval(() => load(true), 30000); return () => clearInterval(timer); }, []);
  async function openNotices() { setNoticeOpen(!noticeOpen); const ids = data.notifications.filter((n) => !n.read).map((n) => n.id); if (ids.length) { await api("/api/notifications/read", { method: "POST", body: JSON.stringify({ ids }) }); setData((old) => ({ ...old, notifications: old.notifications.map((n) => ({ ...n, read: true })) })); } }
  async function toggleLive(item) { await api("/api/content", { method: "PATCH", body: JSON.stringify({ id: item.id, isLive: !item.isLive }) }); load(); }
  const visible = active === "Aulas" ? lessons : active === "Mentorias" ? lives : data.items;
  return <div className="app-shell">
    <aside className={menuOpen ? "sidebar open" : "sidebar"}><div className="side-brand"><span>M</span><strong>CASA<br/>MENTORIA</strong></div><nav>{[["Início", LayoutDashboard], ["Aulas", BookOpen], ["Mentorias", Radio]].map(([label, Icon]) => <button key={label} className={active === label ? "active" : ""} onClick={() => { setActive(label); setMenuOpen(false); }}><Icon size={19}/>{label}</button>)}</nav>{data.admin && <button className="side-add" onClick={() => setShowForm(true)}><Plus size={18}/>Adicionar conteúdo</button>}<div className="member"><CircleUserRound/><span><strong>{user.name || "Membro"}</strong><small>{data.admin ? "Administradora" : "Membro"}</small></span></div><button className="logout" onClick={onLogout}><LogOut size={18}/>Sair</button></aside>
    <main className="main-area"><header><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}><Menu/></button><div className="welcome"><small>OLÁ, {user.name?.split(" ")[0]?.toUpperCase() || "MEMBRO"}</small><strong>{active === "Início" ? "Seu espaço de evolução" : active}</strong></div><div className="notice-wrap"><button className="bell" onClick={openNotices}><Bell/>{unread > 0 && <b>{unread}</b>}</button>{noticeOpen && <div className="notice-panel"><div className="notice-title"><strong>Notificações</strong><span>{data.notifications.length}</span></div>{data.notifications.length ? data.notifications.map((n) => <button key={n.id} onClick={() => { const item = data.items.find((x) => x.id === n.contentId); if (item) setPlayer(item); setNoticeOpen(false); }}><i className={n.kind === "live" ? "live-dot" : "content-dot"}/><span><strong>{n.title}</strong><small>{n.message}</small></span></button>) : <p>Nenhuma novidade por enquanto.</p>}{typeof Notification !== "undefined" && Notification.permission === "default" && <button className="browser-notice" onClick={() => Notification.requestPermission()}>Ativar avisos no dispositivo</button>}</div>}</div></header>
      <div className="workspace">{error && <div className="error-banner">{error}<button onClick={() => load()}>Tentar novamente</button></div>}
        {active === "Início" && <section className="feature"><div className="feature-copy"><span className="eyebrow">{liveNow ? "MENTORIA ACONTECENDO AGORA" : "CONTEÚDO EM DESTAQUE"}</span><h1>{liveNow?.title || lessons[0]?.title || "Sua jornada começa aqui"}</h1><p>{liveNow?.description || lessons[0]?.description || "As próximas aulas e mentorias aparecerão neste espaço."}</p>{(liveNow || lessons[0]) && <button onClick={() => setPlayer(liveNow || lessons[0])}><Play fill="currentColor"/> {liveNow ? "Entrar na live" : "Assistir agora"}</button>}</div><div className="feature-art"><div className="orbit one"/><div className="orbit two"/><div className="play-disc"><Play fill="currentColor"/></div>{liveNow && <span className="onair"><i/> AO VIVO</span>}</div></section>}
        <section className="section-heading"><div><span className="eyebrow">{active === "Início" ? "BIBLIOTECA" : "CONTEÚDOS"}</span><h2>{active === "Início" ? "Continue aprendendo" : active === "Aulas" ? "Todas as aulas" : "Mentorias"}</h2></div>{data.admin && <button className="outline-button" onClick={() => setShowForm(true)}><Plus/>Publicar</button>}</section>
        {loading ? <div className="lesson-grid"><div className="skeleton"/><div className="skeleton"/></div> : visible.length ? <div className="lesson-grid">{visible.map((item) => <article className="lesson-card" key={item.id}><button className="thumb" onClick={() => setPlayer(item)}><span className="card-index">{item.type === "live" ? "LIVE" : String(item.id).padStart(2, "0")}</span><span className="card-play"><Play fill="currentColor"/></span>{item.isLive && <span className="live-pill">AO VIVO</span>}</button><div className="card-copy"><div className="card-meta">{item.type === "live" ? <><CalendarDays/> {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Disponível"}</> : <><Video/> Videoaula</>}</div><h3>{item.title}</h3><p>{item.description || "Conteúdo exclusivo da comunidade."}</p><button className="watch" onClick={() => setPlayer(item)}>{item.isLive ? "Entrar agora" : "Assistir"}<ChevronRight/></button>{data.admin && item.type === "live" && <button className="live-toggle" onClick={() => toggleLive(item)}>{item.isLive ? "Encerrar transmissão" : "Iniciar live e notificar"}</button>}</div></article>)}</div> : <div className="empty-state"><BookOpen/><h3>Nenhum conteúdo publicado</h3><p>{data.admin ? "Publique a primeira aula ou agende uma mentoria." : "Novos conteúdos aparecerão aqui assim que forem publicados."}</p>{data.admin && <button className="primary" onClick={() => setShowForm(true)}>Adicionar conteúdo</button>}</div>}
      </div></main>{showForm && <ContentForm onClose={() => setShowForm(false)} onSaved={load}/>} {player && <Player item={player} onClose={() => setPlayer(null)}/>} {menuOpen && <button className="mobile-overlay" onClick={() => setMenuOpen(false)}/>} 
  </div>;
}

export default function App() {
  const [user, setUser] = useState(undefined);
  useEffect(() => { (async () => { try { const callback = await handleAuthCallback(); setUser(callback?.user || await getUser()); } catch { setUser(await getUser()); } })(); }, []);
  async function signOut() { await logout(); setUser(null); }
  if (user === undefined) return <div className="boot"><span>M</span><p>Preparando seu espaço...</p></div>;
  return user ? <AppShell user={user} onLogout={signOut}/> : <Login onAuthenticated={setUser}/>;
}
