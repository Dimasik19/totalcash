export default function Header() {
  return (
    <header className="app-header">
      <div className="header-ornament">❧</div>
      <h1 className="header-title">Финансовая книга</h1>
      <p className="header-subtitle">Доходы, расходы, активы и пассивы в одном реестре</p>
      <div className="header-divider">
        <span className="divider-line" />
        <span className="divider-ornament">✦</span>
        <span className="divider-line" />
      </div>
    </header>
  );
}
