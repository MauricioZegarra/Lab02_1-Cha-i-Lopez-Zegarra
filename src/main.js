import './styles.css';

const BOOKS_SEED = [
  { id: 1, title: 'Clean Code', author: 'Robert C. Martin', category: 'Programación', year: 2008, total: 3, available: 2 },
  { id: 2, title: 'The Pragmatic Programmer', author: 'Andrew Hunt y David Thomas', category: 'Programación', year: 2019, total: 2, available: 2 },
  { id: 3, title: 'Software Engineering', author: 'Ian Sommerville', category: 'Ingeniería de Software', year: 2016, total: 3, available: 1 },
  { id: 4, title: 'Database System Concepts', author: 'Abraham Silberschatz', category: 'Bases de Datos', year: 2019, total: 2, available: 2 },
  { id: 5, title: 'Computer Networking', author: 'James Kurose y Keith Ross', category: 'Redes', year: 2021, total: 2, available: 1 },
  { id: 6, title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell y Peter Norvig', category: 'Inteligencia Artificial', year: 2021, total: 2, available: 2 },
];

const LOANS_SEED = [
  {
    id: 101,
    bookId: 3,
    bookTitle: 'Software Engineering',
    student: 'Luis Mamani',
    code: '20240180',
    requestedAt: '2026-09-19',
    dueDate: '2026-09-29',
    status: 'Activo'
  },
  {
    id: 102,
    bookId: 4,
    bookTitle: 'Database System Concepts',
    student: 'Ana Quispe',
    code: '20240214',
    requestedAt: '2026-09-20',
    dueDate: '2026-09-30',
    status: 'Pendiente'
  }
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const savedBooks = localStorage.getItem('biblio_books');
const savedLoans = localStorage.getItem('biblio_loans');
const url = new URL(window.location.href);

const state = {
  books: savedBooks ? JSON.parse(savedBooks) : clone(BOOKS_SEED),
  loans: savedLoans ? JSON.parse(savedLoans) : clone(LOANS_SEED),
  role: url.searchParams.get('role') === 'admin' ? 'admin' : (localStorage.getItem('biblio_role') || 'cliente'),
  section: url.searchParams.get('view') || (location.hash.slice(1) || 'inicio'),
  query: '',
  category: 'Todas',
  modalBookId: url.searchParams.get('demo') === 'loan' ? 1 : null,
  notice: '',
};

const currentUser = { name: 'María Quispe', code: '20240318' };
const app = document.querySelector('#app');

function persist() {
  localStorage.setItem('biblio_books', JSON.stringify(state.books));
  localStorage.setItem('biblio_loans', JSON.stringify(state.loans));
  localStorage.setItem('biblio_role', state.role);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(value) {
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

function escapeHtml(value = '') {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function statusClass(status) {
  return status === 'Activo' ? 'success' : status === 'Pendiente' ? 'warning' : status === 'Rechazado' ? 'danger' : 'neutral';
}

function setSection(section) {
  state.section = section;
  state.notice = '';
  history.replaceState(null, '', `?role=${state.role}&view=${section}`);
  render();
}

function navItems() {
  const items = [
    ['inicio', 'Inicio'],
    ['catalogo', 'Catálogo'],
    ['mis-prestamos', 'Mis préstamos'],
    ...(state.role === 'admin' ? [['admin', 'Administración']] : []),
    ['ayuda', 'Ayuda'],
  ];
  return items.map(([id, label]) => `<button class="nav-link ${state.section === id ? 'active' : ''}" data-nav="${id}">${label}</button>`).join('');
}

function header() {
  return `
    <header class="topbar">
      <div class="brand-block">
        <div class="institution-mark"><span>IS</span></div>
        <div>
          <strong>BiblioPrestamo EPIS</strong>
          <span>Préstamo de libros</span>
        </div>
      </div>
      <nav class="nav" aria-label="Navegación principal">${navItems()}</nav>
      <div class="role-switch" aria-label="Cambiar vista">
        <button class="role-btn ${state.role === 'cliente' ? 'active' : ''}" data-role="cliente">Cliente</button>
        <button class="role-btn ${state.role === 'admin' ? 'active' : ''}" data-role="admin">Admin</button>
      </div>
    </header>`;
}

function footer() {
  return `<footer>Laboratorio 02 - Plataformas Emergentes (E) · Prototipo web local</footer>`;
}

function layout(content) {
  app.innerHTML = `${header()}<main class="container">${content}</main>${footer()}${state.notice ? `<div class="toast">${escapeHtml(state.notice)}</div>` : ''}${state.modalBookId ? loanModal() : ''}`;
  bindCommon();
}

function pageIntro(kicker, title, text) {
  return `<div class="page-intro"><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${text}</p></div>`;
}

function bookStatus(book) {
  if (book.available === 0) return { label: 'No disponible', className: 'danger' };
  if (book.available === 1) return { label: 'Último ejemplar', className: 'warning' };
  return { label: 'Disponible', className: 'success' };
}

function bookCard(book) {
  const status = bookStatus(book);
  const clientLoan = state.loans.some(l => l.bookId === book.id && l.code === currentUser.code && ['Pendiente', 'Activo'].includes(l.status));
  return `<article class="book-card">
    <div class="book-cover"><span>${book.title.split(' ').slice(0,2).map(w=>w[0]).join('')}</span></div>
    <div class="book-main">
      <div class="card-top"><span class="tag">${escapeHtml(book.category)}</span><span class="pill ${status.className}">${status.label}</span></div>
      <h3>${escapeHtml(book.title)}</h3>
      <p class="author">${escapeHtml(book.author)}</p>
      <p class="meta">${book.year} · ${book.available} de ${book.total} ejemplares</p>
      <div class="card-actions">
        ${clientLoan ? '<span class="already">Ya tienes una solicitud activa</span>' : state.role === 'cliente' && book.available > 0 ? `<button class="primary small" data-loan="${book.id}">Solicitar préstamo</button>` : ''}
        ${state.role === 'admin' ? `<span class="admin-note">Vista administrativa</span>` : ''}
      </div>
    </div>
  </article>`;
}

function homeView() {
  const available = state.books.reduce((sum, b) => sum + b.available, 0);
  const active = state.loans.filter(l => l.status === 'Activo').length;
  const pending = state.loans.filter(l => l.status === 'Pendiente').length;
  const myLoans = state.loans.filter(l => l.code === currentUser.code && ['Pendiente','Activo'].includes(l.status));
  const next = myLoans[0];
  if (state.role === 'admin') {
    return `${pageIntro('VISTA ADMINISTRADOR', 'Control básico de préstamos', 'La administración se concentra en revisar solicitudes y registrar devoluciones.')}\n      <section class="stats">
        <article class="stat"><span>Libros</span><strong>${state.books.length}</strong></article>
        <article class="stat"><span>Ejemplares disponibles</span><strong>${available}</strong></article>
        <article class="stat"><span>Préstamos activos</span><strong>${active}</strong></article>
        <article class="stat"><span>Solicitudes pendientes</span><strong>${pending}</strong></article>
      </section>
      <section class="panel callout"><div><span class="eyebrow">FLUJO PRINCIPAL</span><h2>Revisar una solicitud</h2><p>El administrador puede aprobar o rechazar una solicitud y luego registrar la devolución del libro.</p></div><button class="primary" data-go="admin">Ir a Administración</button></section>
      <section class="panel"><div class="section-head"><div><span class="eyebrow">CATÁLOGO</span><h2>Libros con disponibilidad</h2></div><button class="text-btn" data-go="catalogo">Ver catálogo</button></div><div class="books-grid">${state.books.slice(0, 3).map(bookCard).join('')}</div></section>`;
  }
  return `${pageIntro('VISTA CLIENTE', 'Consulta y solicita un libro', 'BiblioPrestamo permite buscar un libro, revisar su disponibilidad y enviar una solicitud de préstamo desde el celular o la computadora.')}\n    <section class="stats">
      <article class="stat"><span>Libros registrados</span><strong>${state.books.length}</strong></article>
      <article class="stat"><span>Ejemplares disponibles</span><strong>${available}</strong></article>
      <article class="stat"><span>Mis préstamos</span><strong>${myLoans.length}</strong></article>
      <article class="stat"><span>Solicitudes en revisión</span><strong>${state.loans.filter(l => l.code === currentUser.code && l.status === 'Pendiente').length}</strong></article>
    </section>
    <section class="panel callout"><div><span class="eyebrow">MI CUENTA</span><h2>${escapeHtml(currentUser.name)}</h2><p>Código ${escapeHtml(currentUser.code)} · ${next ? `Próximo libro: ${escapeHtml(next.bookTitle)}.` : 'No tienes préstamos activos.'}</p></div><button class="primary" data-go="catalogo">Buscar libros</button></section>
    <section class="panel"><div class="section-head"><div><span class="eyebrow">CATÁLOGO</span><h2>Disponibles ahora</h2></div><button class="text-btn" data-go="catalogo">Ver todo</button></div><div class="books-grid">${state.books.slice(0, 3).map(bookCard).join('')}</div></section>`;
}

function catalogView() {
  const categories = ['Todas', ...new Set(state.books.map(b => b.category))];
  const filtered = state.books.filter(book => {
    const text = `${book.title} ${book.author} ${book.category}`.toLowerCase();
    return text.includes(state.query.toLowerCase()) && (state.category === 'Todas' || book.category === state.category);
  });
  return `${pageIntro('CATÁLOGO', 'Buscar libros', 'Los resultados se generan dinámicamente con JavaScript a partir de los datos guardados en el navegador.')}
    <section class="panel">
      <div class="filters">
        <label>Buscar<input id="book-search" value="${escapeHtml(state.query)}" placeholder="Título, autor o categoría" /></label>
        <label>Categoría<select id="book-category">${categories.map(c => `<option value="${escapeHtml(c)}" ${c === state.category ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}</select></label>
      </div>
      <div class="books-grid">${filtered.length ? filtered.map(bookCard).join('') : '<div class="empty">No se encontraron libros.</div>'}</div>
    </section>`;
}

function loanStatusCard(loan) {
  const actions = state.role === 'cliente' && loan.code === currentUser.code && loan.status === 'Pendiente'
    ? `<button class="secondary small" data-cancel="${loan.id}">Cancelar solicitud</button>` : '';
  return `<article class="loan-card">
    <div class="loan-copy"><span class="eyebrow">${escapeHtml(loan.status)}</span><h3>${escapeHtml(loan.bookTitle)}</h3><p>${escapeHtml(loan.student)} · ${escapeHtml(loan.code)}</p></div>
    <div class="loan-dates"><span>Solicitado ${formatDate(loan.requestedAt)}</span><span>Devolución ${formatDate(loan.dueDate)}</span>${actions}</div>
  </article>`;
}

function myLoansView() {
  const loans = state.loans.filter(l => l.code === currentUser.code);
  return `${pageIntro('CLIENTE', 'Mis préstamos', 'Aquí se muestran las solicitudes realizadas por el usuario de demostración.')}
    <section class="panel"><div class="loan-list">${loans.length ? loans.map(loanStatusCard).join('') : '<div class="empty">Todavía no has solicitado libros.</div>'}</div></section>`;
}

function adminView() {
  const pending = state.loans.filter(l => l.status === 'Pendiente');
  const active = state.loans.filter(l => l.status === 'Activo');
  return `${pageIntro('ADMINISTRACIÓN', 'Gestionar préstamos', 'Dos acciones mantienen el flujo simple: aprobar solicitudes y registrar devoluciones.')}
    <section class="panel"><div class="section-head"><div><span class="eyebrow">1. SOLICITUDES</span><h2>Pendientes</h2></div><span class="count-badge">${pending.length}</span></div>
      <div class="admin-list">${pending.length ? pending.map(adminLoanRow).join('') : '<div class="empty">No hay solicitudes pendientes.</div>'}</div>
    </section>
    <section class="panel"><div class="section-head"><div><span class="eyebrow">2. DEVOLUCIONES</span><h2>Préstamos activos</h2></div><span class="count-badge">${active.length}</span></div>
      <div class="admin-list">${active.length ? active.map(adminLoanRow).join('') : '<div class="empty">No hay préstamos activos.</div>'}</div>
    </section>`;
}

function adminLoanRow(loan) {
  const buttons = loan.status === 'Pendiente'
    ? `<button class="primary small" data-approve="${loan.id}">Aprobar</button><button class="secondary small" data-reject="${loan.id}">Rechazar</button>`
    : `<button class="secondary small" data-return="${loan.id}">Registrar devolución</button>`;
  return `<article class="admin-row"><div><div class="admin-book"><strong>${escapeHtml(loan.bookTitle)}</strong><span class="pill ${statusClass(loan.status)}">${escapeHtml(loan.status)}</span></div><p>${escapeHtml(loan.student)} · ${escapeHtml(loan.code)}</p></div><div class="admin-actions"><span>Hasta ${formatDate(loan.dueDate)}</span>${buttons}</div></article>`;
}

function helpView() {
  return `${pageIntro('AYUDA', 'Cómo funciona', 'La aplicación mantiene el flujo intencionalmente pequeño para que la funcionalidad principal sea fácil de demostrar en laboratorio.')}
    <section class="help-grid">
      <article><span class="step">01</span><h3>Buscar</h3><p>En Catálogo escribe un título, autor o categoría y observa cómo JavaScript filtra las tarjetas.</p></article>
      <article><span class="step">02</span><h3>Solicitar</h3><p>Un cliente pulsa “Solicitar préstamo”, completa su código y selecciona el tiempo de devolución.</p></article>
      <article><span class="step">03</span><h3>Administrar</h3><p>El administrador aprueba o rechaza la solicitud y puede registrar la devolución.</p></article>
    </section>
    <section class="panel note-list"><strong>Nota de implementación</strong><p>Este laboratorio es un prototipo web local. La persistencia se realiza con <code>localStorage</code>; no se presenta como un sistema multiusuario con servidor.</p></section>`;
}

function loanModal() {
  const book = state.books.find(b => b.id === Number(state.modalBookId));
  if (!book) return '';
  return `<div class="modal-backdrop" data-close-modal><div class="modal" role="dialog" aria-modal="true" aria-labelledby="loan-title" onclick="event.stopPropagation()">
    <div class="modal-head"><div><span class="eyebrow">NUEVA SOLICITUD</span><h2 id="loan-title">Solicitar préstamo</h2></div><button class="icon-btn" data-close-modal aria-label="Cerrar">×</button></div>
    <div class="selected-book"><strong>${escapeHtml(book.title)}</strong><span>${escapeHtml(book.author)} · ${book.available} disponible(s)</span></div>
    <form id="loan-form" class="form-grid">
      <label>Nombre<input name="student" value="${escapeHtml(currentUser.name)}" required maxlength="60" /></label>
      <label>Código<input name="code" value="${escapeHtml(currentUser.code)}" required maxlength="20" /></label>
      <label>Devolver en<select name="days"><option value="7">7 días</option><option value="10">10 días</option><option value="14">14 días</option></select></label>
      <button class="primary" type="submit">Enviar solicitud</button>
    </form>
  </div></div>`;
}

function render() {
  const content = state.section === 'catalogo' ? catalogView()
    : state.section === 'mis-prestamos' ? myLoansView()
    : state.section === 'admin' && state.role === 'admin' ? adminView()
    : state.section === 'ayuda' ? helpView()
    : homeView();
  layout(content);
}

function bindCommon() {
  document.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => setSection(btn.dataset.nav)));
  document.querySelectorAll('[data-role]').forEach(btn => btn.addEventListener('click', () => {
    state.role = btn.dataset.role;
    if (state.role === 'admin' && state.section !== 'admin') state.section = 'admin';
    if (state.role === 'cliente' && state.section === 'admin') state.section = 'inicio';
    persist();
    history.replaceState(null, '', `?role=${state.role}&view=${state.section}`);
    render();
  }));
  document.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => setSection(btn.dataset.go)));
  document.querySelectorAll('[data-loan]').forEach(btn => btn.addEventListener('click', () => {
    state.modalBookId = Number(btn.dataset.loan);
    render();
  }));
  document.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', () => { state.modalBookId = null; render(); }));
  document.querySelector('#book-search')?.addEventListener('input', e => { state.query = e.target.value; render(); setTimeout(() => { const el = document.querySelector('#book-search'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }, 0); });
  document.querySelector('#book-category')?.addEventListener('change', e => { state.category = e.target.value; render(); });
  document.querySelector('#loan-form')?.addEventListener('submit', handleLoanSubmit);
  document.querySelectorAll('[data-approve]').forEach(btn => btn.addEventListener('click', () => manageLoan(Number(btn.dataset.approve), 'approve')));
  document.querySelectorAll('[data-reject]').forEach(btn => btn.addEventListener('click', () => manageLoan(Number(btn.dataset.reject), 'reject')));
  document.querySelectorAll('[data-return]').forEach(btn => btn.addEventListener('click', () => manageLoan(Number(btn.dataset.return), 'return')));
  document.querySelectorAll('[data-cancel]').forEach(btn => btn.addEventListener('click', () => manageLoan(Number(btn.dataset.cancel), 'cancel')));
}

function handleLoanSubmit(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const book = state.books.find(b => b.id === Number(state.modalBookId));
  if (!book || book.available <= 0) return;
  const code = String(data.get('code')).trim();
  const duplicate = state.loans.some(l => l.bookId === book.id && l.code === code && ['Pendiente', 'Activo'].includes(l.status));
  if (duplicate) {
    state.modalBookId = null;
    state.notice = 'Ya existe una solicitud o préstamo activo para ese libro.';
    render();
    return;
  }
  state.loans.unshift({
    id: Date.now(),
    bookId: book.id,
    bookTitle: book.title,
    student: String(data.get('student')).trim(),
    code,
    requestedAt: todayISO(),
    dueDate: addDays(Number(data.get('days'))),
    status: 'Pendiente'
  });
  persist();
  state.modalBookId = null;
  state.section = 'mis-prestamos';
  state.notice = 'Solicitud enviada. El administrador debe aprobarla.';
  history.replaceState(null, '', `?role=cliente&view=mis-prestamos`);
  render();
}

function manageLoan(id, action) {
  const loan = state.loans.find(l => l.id === id);
  if (!loan) return;
  const book = state.books.find(b => b.id === loan.bookId);
  if (action === 'approve') {
    if (!book || book.available <= 0) { state.notice = 'No hay ejemplares disponibles para aprobar la solicitud.'; render(); return; }
    book.available -= 1;
    loan.status = 'Activo';
    state.notice = 'Préstamo aprobado y ejemplar descontado.';
  } else if (action === 'reject') {
    loan.status = 'Rechazado';
    state.notice = 'Solicitud rechazada.';
  } else if (action === 'return') {
    if (book) book.available = Math.min(book.total, book.available + 1);
    loan.status = 'Devuelto';
    state.notice = 'Devolución registrada y ejemplar liberado.';
  } else if (action === 'cancel') {
    state.loans = state.loans.filter(item => item.id !== id);
    state.notice = 'Solicitud cancelada.';
  }
  persist();
  render();
}

window.addEventListener('hashchange', () => {
  state.section = location.hash.slice(1) || 'inicio';
  render();
});

render();
