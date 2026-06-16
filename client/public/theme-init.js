try {
  var s = localStorage.getItem('pb-theme');
  if (s === 'light' || s === 'dark') document.documentElement.setAttribute('data-theme', s);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.setAttribute('data-theme', 'dark');
} catch (e) {}
