(() => {
  const KEY = 'footprints:theme';
  const root = document.documentElement;
  const current = () => (root.dataset.theme === 'light' ? 'light' : 'dark');

  function syncThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = current() === 'light' ? '#FFF3EA' : '#211A1A';
  }

  function label() {
    const text = I18n.t(current() === 'dark' ? 'themeLight' : 'themeDark');
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.title = text;
      btn.setAttribute('aria-label', text);
    });
  }

  function set(theme) {
    if (theme === 'light') root.dataset.theme = 'light';
    else delete root.dataset.theme;
    try { localStorage.setItem(KEY, theme); } catch {}
    label();
    syncThemeColor();
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.theme-btn')) set(current() === 'dark' ? 'light' : 'dark');
  });

  I18n.onChange(label);
  label();
  syncThemeColor();
})();
