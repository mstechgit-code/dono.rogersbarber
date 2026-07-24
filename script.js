  function initUsers(){
    const form = qs('#user-form');
    const nameInput = qs('#user-name');
    const loginInput = qs('#user-login');
    const passwordInput = qs('#user-password');
    const submitBtn = qs('button[type="submit"]');
    
    if(!form) return;

    renderUsers();

    // Debug: Verificar se os elementos existem
    console.log('Form:', form);
    console.log('Name Input:', nameInput);
    console.log('Login Input:', loginInput);
    console.log('Password Input:', passwordInput);

    form.addEventListener('submit', (event)=>{
      event.preventDefault();
      console.log('Form submitted!');

      const name = nameInput?.value.trim();
      const login = loginInput?.value.trim().toLowerCase();
      const password = passwordInput?.value.trim();

      console.log('Valores coletados:', {name, login, password});

      // Validação
      if(!name || !login || !password){
        setUserStatus('Preencha nome, login e senha.', 'error');
        console.error('Campos vazios');
        return;
      }

      if(password.length < 4){
        setUserStatus('Senha deve ter pelo menos 4 caracteres.', 'error');
        console.error('Senha muito curta');
        return;
      }

      if(login === 'admin'){
        setUserStatus('Não é permitido usar "admin" como login.', 'error');
        console.error('Login é admin');
        return;
      }

      const users = getBarberUsers();
      console.log('Usuários existentes:', users);
      
      if(users.some((user)=>String(user.login || '').toLowerCase() === login)){
        setUserStatus('Ja existe um barbeiro com esse login.', 'error');
        console.error('Login duplicado');
        return;
      }

      // Criar nova conta de barbeiro
      const newUser = {
        id: Date.now(),
        name,
        login,
        password,
        createdAt: new Date().toISOString()
      };

      console.log('Novo usuário:', newUser);

      users.push(newUser);
      console.log('Array atualizado:', users);

      // Salvar conta
      const saved = saveBarberUsers(users);
      console.log('Salvo com sucesso?', saved);
      
      if(saved){
        // Limpar formulário
        form.reset();
        
        // Mensagem de sucesso
        setUserStatus(`✅ Conta de barbeiro "${name}" criada! Login: ${login}`, 'success');
        
        // Renderizar lista atualizada
        renderUsers();
        
        console.log('✅ Barbeiro cadastrado:', newUser);
        console.log('Usuários após salvar:', getBarberUsers());
        
        setTimeout(()=>{
          const status = qs('#user-status');
          if(status) status.textContent = '';
        }, 5000);
      } else {
        setUserStatus('Erro ao salvar conta. Tente novamente.', 'error');
      }
    });
  }
