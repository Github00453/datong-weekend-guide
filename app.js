(() => {
  'use strict';
  const toast = document.querySelector('#toast');
  let toastTimer;
  function notify(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
  }

  document.querySelectorAll('[data-map]').forEach(link => {
    const query = new URLSearchParams({keyword: link.dataset.map, city: link.dataset.city || '大同', view: 'map'});
    link.href = `https://uri.amap.com/search?${query}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `${link.textContent.trim()}：${link.dataset.map}（在高德地图中搜索）`);
  });

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function activateTab(tab, focus = false) {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {event.preventDefault(); activateTab(tabs[next], true);}
    });
  });
  function showLinkedDay() {
    if (location.hash === '#day2') activateTab(tabs[1]);
    if (location.hash === '#day1') activateTab(tabs[0]);
  }
  showLinkedDay();
  addEventListener('hashchange', showLinkedDay);

  const checks = [...document.querySelectorAll('[data-check]')];
  const storageKey = 'datong-weekend-checklist-v1';
  let storageAvailable = true;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (stored && typeof stored === 'object') checks.forEach(input => {input.checked = stored[input.dataset.check] === true;});
  } catch { storageAvailable = false; }
  function updateChecklist(save = false) {
    const count = checks.filter(input => input.checked).length;
    document.querySelector('#check-count').textContent = `${count} / ${checks.length} 项已就绪`;
    document.querySelector('#progress-fill').style.width = `${count / checks.length * 100}%`;
    document.querySelector('#mobile-count').textContent = `${count}/${checks.length}`;
    if (save && storageAvailable) {
      try { localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(checks.map(input => [input.dataset.check, input.checked])))); }
      catch { storageAvailable = false; notify('浏览器暂不支持保存，清单在本次打开期间有效'); }
    }
    if (save && count === checks.length) notify('准备齐了！祝你们一路顺风。');
  }
  updateChecklist();
  checks.forEach(input => input.addEventListener('change', () => updateChecklist(true)));
  document.querySelector('#reset-checklist').addEventListener('click', () => {
    checks.forEach(input => { input.checked = false; });
    updateChecklist(true);
    notify('清单已重置');
  });

  const shareDialog = document.querySelector('#share-dialog');
  const shareInput = document.querySelector('#share-url');
  function getShareUrl() { const url = new URL(location.href); url.hash = ''; return url.href; }
  async function copyUrl() {
    const url = getShareUrl();
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(url); return true; } catch { /* use selection fallback */ }
    }
    const input = document.createElement('textarea');
    input.value = url;
    input.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.append(input);
    input.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { /* manual fallback below */ }
    input.remove();
    return copied;
  }
  function manualShare() {
    shareInput.value = getShareUrl();
    if (!shareDialog.open) shareDialog.showModal();
    shareInput.focus();
    shareInput.select();
  }
  document.querySelectorAll('[data-share]').forEach(button => button.addEventListener('click', async () => {
    if (navigator.share) {
      try { await navigator.share({title: '把周末，交给大同。', text: '北京出发，两天一夜自驾手册。一起去看云冈、古城、悬空寺和应县木塔。', url: getShareUrl()}); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    if (await copyUrl()) notify('攻略链接已复制，发给同行的人吧');
    else manualShare();
  }));
  document.querySelector('#close-dialog').addEventListener('click', () => shareDialog.close());
  shareDialog.addEventListener('click', event => { if (event.target === shareDialog) { const r = shareDialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) shareDialog.close(); } });
  document.querySelector('#copy-dialog-url').addEventListener('click', async () => {
    if (await copyUrl()) {shareDialog.close(); notify('攻略链接已复制');}
    else { shareInput.focus(); shareInput.select(); notify('请长按链接，或按 Ctrl / Command + C 复制'); }
  });

  let closedDetails = [];
  addEventListener('beforeprint', () => {
    closedDetails = [...document.querySelectorAll('details:not([open])')];
    closedDetails.forEach(detail => {detail.open = true;});
  });
  addEventListener('afterprint', () => { closedDetails.forEach(detail => {detail.open = false;}); closedDetails = []; });
  document.querySelector('#print-guide').addEventListener('click', () => window.print());
})();
