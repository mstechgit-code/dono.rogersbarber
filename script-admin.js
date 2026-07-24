(function () {
  const ADMIN_PASSWORD = 'Roger792';
  const SERVICES = [
    {id:'corte', name:'Corte Masculino/Infantil', duration:30, price:50},
    {id:'barba', name:'Barba Simples', duration:20, price:50},
    {id:'corte_barba', name:'Corte + Barba', duration:50, price:80},
    {id:'sobrancelha', name:'Sobrancelha', duration:10, price:15},
    {id:'bigode', name:'Bigode', duration:10, price:15},
    {id:'corte_mensal', name:'Corte mensal', duration:60, price:140},
    {id:'corte_mensal_barba', name:'Corte mensal + barba', duration:90, price:240}
  ];

  function qs(selector) {
    return document.querySelector(selector);
  }

  function qsa(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function applyTheme(isDark) {
    document.documentElement.classList.toggle('dark-mode', isDark);
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.textContent = isDark ? '☀️' : '🌙';
    }
    localStorage.setItem('barbearia-theme', isDark ? 'dark' : 'light');
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('barbearia-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    applyTheme(shouldUseDark);
  }

  function initTabs() {
    const buttons = qsa('.tab-btn');
    const contents = qsa('.tab-content');

    if (!buttons.length || !contents.length) return;

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-tab');
        buttons.forEach((tabButton) => tabButton.classList.toggle('active', tabButton === button));
        contents.forEach((content) => content.classList.toggle('active', content.id === targetId));
      });
    });
  }

  function getAppointments() {
    try {
      return JSON.parse(localStorage.getItem('appointments') || '[]');
    } catch (error) {
      return [];
    }
  }

  function saveAppointments(appointments) {
    localStorage.setItem('appointments', JSON.stringify(appointments));
  }

  function getBusinessSettings() {
    try {
      return JSON.parse(localStorage.getItem('business-settings') || '{}');
    } catch (error) {
      return {};
    }
  }

  function saveBusinessSettings(settings) {
    localStorage.setItem('business-settings', JSON.stringify(settings));
  }

  function initAdminSettings() {
    const settings = getBusinessSettings();
    const allow16to18 = qs('#setting-allow-16-18');
    const whatsappInput = qs('#setting-whatsapp');
    const emailInput = qs('#setting-email');

    if (allow16to18) {
      allow16to18.checked = Boolean(settings.allow16to18);
      allow16to18.addEventListener('change', () => {
        saveBusinessSettings({
          ...getBusinessSettings(),
          allow16to18: allow16to18.checked,
        });
      });
    }

    if (whatsappInput) {
      whatsappInput.value = settings.whatsapp || '';
      whatsappInput.addEventListener('input', () => {
        saveBusinessSettings({
          ...getBusinessSettings(),
          whatsapp: whatsappInput.value.trim(),
        });
      });
    }

    if (emailInput) {
      emailInput.value = settings.email || '';
      emailInput.addEventListener('input', () => {
        saveBusinessSettings({
          ...getBusinessSettings(),
          email: emailInput.value.trim(),
        });
      });
    }
  }

  function getServiceName(serviceId) {
    return SERVICES.find((service) => service.id === serviceId)?.name || serviceId;
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function sortAppointments(appointments) {
    const sortBy = qs('#filter-sort')?.value || 'date-asc';
    return appointments.slice().sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'price-desc') {
        return getServiceName(b.service).localeCompare(getServiceName(a.service));
      }
      if (sortBy === 'date-desc') {
        return a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date);
      }
      return a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date);
    });
  }

  function applyAppointmentFilters(appointments) {
    const search = qs('#filter-search')?.value.trim().toLowerCase() || '';
    const status = qs('#filter-status')?.value || '';
    const from = qs('#filter-date-from')?.value;
    const to = qs('#filter-date-to')?.value;

    return sortAppointments(appointments.filter((appointment) => {
      if (status && appointment.status !== status) {
        return false;
      }
      if (search) {
        const text = `${appointment.name} ${appointment.phone} ${getServiceName(appointment.service)}`.toLowerCase();
        if (!text.includes(search)) {
          return false;
        }
      }
      if (from && appointment.date < from) {
        return false;
      }
      if (to && appointment.date > to) {
        return false;
      }
      return true;
    }));
  }

  function updateStats(appointments) {
    const today = todayIso();
    const todayCount = appointments.filter((appointment) => appointment.date === today && appointment.status !== 'cancelled').length;
    const weekCount = appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return appointmentDate >= weekAgo && appointmentDate <= now && appointment.status !== 'cancelled';
    }).length;
    const completedCount = appointments.filter((appointment) => appointment.status === 'completed').length;
    const revenue = appointments.reduce((sum, appointment) => {
      if (appointment.status !== 'completed') return sum;
      const service = SERVICES.find((item) => item.id === appointment.service);
      return sum + (service?.price || 0);
    }, 0);
    const durationHours = appointments.reduce((sum, appointment) => {
      if (appointment.status !== 'completed') return sum;
      const service = SERVICES.find((item) => item.id === appointment.service);
      return sum + ((service?.duration || 30) / 60);
    }, 0);

    qs('#stat-today').textContent = todayCount;
    qs('#stat-week').textContent = weekCount;
    qs('#stat-completed').textContent = completedCount;
    qs('#stat-revenue').textContent = `R$ ${revenue.toFixed(2)}`;
    qs('#stat-duration').textContent = `${durationHours.toFixed(1)}h`;
  }

  function renderAppointments() {
    const appointments = applyAppointmentFilters(getAppointments());
    const allAppointments = getAppointments();
    const list = qs('#appointments-list');
    const noAppointments = qs('#no-appointments');
    const count = qs('#appt-count');
    const badge = qs('#pending-badge');

    if (!list || !noAppointments || !count || !badge) return;

    count.textContent = `(${appointments.length})`;
    badge.textContent = `${allAppointments.filter((appt) => appt.status === 'pending' || !appt.status).length}`;

    if (!appointments.length) {
      list.innerHTML = '';
      noAppointments.textContent = 'Nenhum agendamento encontrado.';
      return;
    }

    noAppointments.textContent = '';
    list.innerHTML = appointments.map((appointment) => {
      const serviceName = getServiceName(appointment.service);
      const status = appointment.status || 'pending';
      const statusLabel = status === 'pending' ? 'Pendente' : status === 'completed' ? 'Feito' : 'Cancelado';
      const dataLabel = appointment.date ? `${appointment.date} ${appointment.time || ''}`.trim() : 'Sem data definida';

      return `
        <li class="appointment-item ${status}">
          <div class="appointment-row">
            <div>
              <strong>${appointment.name}</strong>
              <div class="appointment-meta">${serviceName} · ${dataLabel}</div>
              <div class="appointment-phone">${appointment.phone}</div>
            </div>
            <span class="appointment-status-badge ${status}">${statusLabel}</span>
          </div>
          <div class="appointment-actions">
            <button type="button" class="btn btn-small" data-action="complete" data-id="${appointment.id}" ${status === 'completed' ? 'disabled' : ''}>Feito</button>
            <button type="button" class="btn btn-danger btn-small" data-action="cancel" data-id="${appointment.id}" ${status === 'cancelled' ? 'disabled' : ''}>Cancelar</button>
          </div>
        </li>
      `;
    }).join('');
  }

  function handleAppointmentAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const id = Number(button.dataset.id);
    const appointments = getAppointments();
    const updatedAppointments = appointments.map((appointment) => {
      if (appointment.id === id) {
        if (action === 'complete') appointment.status = 'completed';
        if (action === 'cancel') appointment.status = 'cancelled';
      }
      return appointment;
    });

    saveAppointments(updatedAppointments);
    renderAppointments();
    renderTimeline();
    updateStats(getAppointments());
  }

  function csvEscape(value) {
    return `"${String(value || '').replace(/"/g, '""')}"`;
  }

  function exportAppointments() {
    const appointments = getAppointments();
    if (!appointments.length) return;
    const headers = ['Nome', 'Telefone', 'Serviço', 'Data', 'Horário', 'Status'];
    const rows = appointments.map((appointment) => [
      csvEscape(appointment.name),
      csvEscape(appointment.phone),
      csvEscape(getServiceName(appointment.service)),
      csvEscape(appointment.date || ''),
      csvEscape(appointment.time || ''),
      csvEscape(appointment.status || 'pending')
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'agendamentos.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function printAppointments() {
    const section = qs('#appointments-section');
    if (!section) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Agendamentos</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .appointment-item { border-bottom: 1px solid #ddd; padding: 12px 0; }
            .appointment-item:last-child { border-bottom: none; }
            .appointment-row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.5rem; }
            .appointment-row strong { display: block; font-size: 1.05rem; margin-bottom: 0.25rem; }
            .appointment-meta, .appointment-phone { color: #555; font-size: 0.95rem; }
          </style>
        </head>
        <body>
          <h1>Agendamentos</h1>
          ${section.querySelector('#appointments-list')?.outerHTML || ''}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  function renderTimeline() {
    const dateInput = qs('#timeline-date');
    const timelineView = qs('#timeline-view');
    if (!timelineView || !dateInput) return;

    const selectedDate = dateInput.value || todayIso();
    const appointments = getAppointments().filter((appointment) => appointment.date === selectedDate);
    const sortedAppointments = appointments.sort((a, b) => a.time.localeCompare(b.time));

    if (!sortedAppointments.length) {
      timelineView.innerHTML = `<p class="timeline-empty">Sem agendamentos para ${selectedDate}.</p>`;
      return;
    }

    timelineView.innerHTML = sortedAppointments.map((appointment) => {
      const status = appointment.status || 'pending';
      const serviceName = getServiceName(appointment.service);
      return `
        <div class="timeline-slot ${status}">
          <div class="timeline-time">${appointment.time || '---'}</div>
          <div class="timeline-appointment">
            <strong>${appointment.name}</strong>
            <div>${serviceName}</div>
            <div>${appointment.phone}</div>
            <div class="timeline-status">${status === 'completed' ? 'Feito' : status === 'cancelled' ? 'Cancelado' : 'Pendente'}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function resetFilters() {
    const search = qs('#filter-search');
    const status = qs('#filter-status');
    const from = qs('#filter-date-from');
    const to = qs('#filter-date-to');
    const sort = qs('#filter-sort');

    if (search) search.value = '';
    if (status) status.value = '';
    if (from) from.value = '';
    if (to) to.value = '';
    if (sort) sort.value = 'date-asc';

    renderAppointments();
  }

  function initAppointmentFilters() {
    const applyButton = qs('#filter-apply');
    const resetButton = qs('#filter-reset');
    const exportButton = qs('#filter-export');
    const printButton = qs('#filter-print');
    const searchInput = qs('#filter-search');
    const statusSelect = qs('#filter-status');
    const fromInput = qs('#filter-date-from');
    const toInput = qs('#filter-date-to');
    const sortInput = qs('#filter-sort');
    const appointmentsList = qs('#appointments-list');

    if (applyButton) {
      applyButton.addEventListener('click', renderAppointments);
    }
    if (resetButton) {
      resetButton.addEventListener('click', resetFilters);
    }
    if (exportButton) {
      exportButton.addEventListener('click', exportAppointments);
    }
    if (printButton) {
      printButton.addEventListener('click', printAppointments);
    }
    [searchInput, statusSelect, fromInput, toInput, sortInput].forEach((element) => {
      if (element) {
        element.addEventListener('change', renderAppointments);
        element.addEventListener('input', renderAppointments);
      }
    });
    if (appointmentsList) {
      appointmentsList.addEventListener('click', handleAppointmentAction);
    }
  }

  function initTimeline() {
    const todayButton = qs('#timeline-today');
    const dateInput = qs('#timeline-date');
    if (dateInput) {
      dateInput.value = todayIso();
      dateInput.addEventListener('change', renderTimeline);
    }
    if (todayButton) {
      todayButton.addEventListener('click', () => {
        if (dateInput) {
          dateInput.value = todayIso();
          renderTimeline();
        }
      });
    }
    renderTimeline();
  }

  function showAuth(isAuthenticated) {
    const modal = document.getElementById('auth-modal');
    const content = document.getElementById('admin-content');
    const input = document.getElementById('admin-password');

    if (modal) {
      modal.style.display = isAuthenticated ? 'none' : 'flex';
    }
    if (content) {
      content.style.display = isAuthenticated ? 'block' : 'none';
    }
    if (input && !isAuthenticated) {
      input.value = '';
      input.focus();
    }
  }

  function handleLogin() {
    const input = document.getElementById('admin-password');
    if (!input) return;
    const enteredPassword = input.value.trim();

    if (enteredPassword === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin-auth', 'true');
      showAuth(true);
      initAdminData();
    } else {
      alert('Senha incorreta.');
      input.value = '';
      input.focus();
    }
  }

  function initAdminData() {
    renderAppointments();
    initAppointmentFilters();
    initTimeline();
    initAdminSettings();
    updateStats(getAppointments());
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();

    const toggleButton = document.getElementById('dark-mode-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        const isDark = !document.documentElement.classList.contains('dark-mode');
        applyTheme(isDark);
      });
    }

    const isAuthenticated = sessionStorage.getItem('admin-auth') === 'true';
    if (isAuthenticated) {
      showAuth(true);
      initAdminData();
      return;
    }

    const loginButton = document.getElementById('admin-login');
    const passwordInput = document.getElementById('admin-password');
    const logoutLink = document.getElementById('admin-logout');

    if (loginButton) {
      loginButton.addEventListener('click', handleLogin);
    }
    if (passwordInput) {
      passwordInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          handleLogin();
        }
      });
    }
    if (logoutLink) {
      logoutLink.addEventListener('click', (event) => {
        event.preventDefault();
        sessionStorage.removeItem('admin-auth');
        showAuth(false);
      });
    }

    showAuth(false);
  });
})();
