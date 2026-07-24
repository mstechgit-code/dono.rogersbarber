  // DASHBOARD & CHARTS
  function updateStats(){
    const appts = getAppointments();
    const today = new Date().toISOString().slice(0,10);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().slice(0,10);
    
    const todayAppts = appts.filter(a => a.date === today);
    const weekAppts = appts.filter(a => a.date >= weekStartStr);
    const completed = appts.filter(a => a.status === 'completed');
    const cancelled = appts.filter(a => a.status === 'cancelled');
    const pending = appts.filter(a => !a.status || a.status === 'pending');
    
    let revenue = 0;
    completed.forEach(a => {
      const service = SERVICES.find(s => s.id === a.service);
      if(service) revenue += service.price || 0;
    });
    
    let duration = 0;
    completed.forEach(a => {
      const service = SERVICES.find(s => s.id === a.service);
      if(service && service.duration) duration += service.duration;
    });
    
    // Atualizar apenas se os elementos existem
    if(qs('#stat-today')) qs('#stat-today').textContent = todayAppts.length;
    if(qs('#stat-week')) qs('#stat-week').textContent = weekAppts.length;
    if(qs('#stat-completed')) qs('#stat-completed').textContent = completed.length;
    if(qs('#stat-cancelled')) qs('#stat-cancelled').textContent = cancelled.length;
    if(qs('#stat-revenue')) qs('#stat-revenue').textContent = `R$ ${revenue.toFixed(2).replace('.',',')}`;
    
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    if(qs('#stat-duration')) qs('#stat-duration').textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    
    if(qs('#pending-badge')) qs('#pending-badge').textContent = pending.length;
  }
