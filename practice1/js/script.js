document.addEventListener('DOMContentLoaded',()=>{
    // Date/time
    const dt = document.getElementById('datetime');
    function updateTime(){
        const now=new Date();
        dt.textContent = now.toLocaleString();
    }
    updateTime(); setInterval(updateTime,1000);

    // Visits counter
    const visitsEl = document.getElementById('visits');
    const key = 'visits_mcalic1';
    let visits = parseInt(localStorage.getItem(key)||'0',10);
    visits++;
    localStorage.setItem(key,String(visits));
    visitsEl.textContent = 'Visitas: '+visits;

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    function applyTheme(t){
        // CSS: default (no attribute) = light; [data-theme="dark"] = dark
        if(t === 'dark') root.setAttribute('data-theme','dark'); else root.removeAttribute('data-theme');
        themeToggle.textContent = t === 'dark' ? 'Modo claro' : 'Modo oscuro';
    }
    const saved = localStorage.getItem('theme') || (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    applyTheme(saved);
    themeToggle.addEventListener('click', ()=>{
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', next);
        applyTheme(next);
    });

    // Project modals
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    // ensure modal link exists
    let modalLink = document.getElementById('modalLink');
    if(!modalLink){
        modalLink = document.createElement('a');
        modalLink.id = 'modalLink';
        modalLink.target = '_blank';
        modalLink.rel = 'noopener';
        modalLink.className = 'modal-link';
        document.querySelector('.modal-content').appendChild(modalLink);
    }
    const modalClose = document.getElementById('modalClose');
    document.querySelectorAll('.more').forEach(btn=>{
        btn.addEventListener('click',()=>{
            modalTitle.textContent = btn.dataset.title;
            modalBody.textContent = btn.dataset.desc;
            if(btn.dataset.url){
                modalLink.href = btn.dataset.url;
                modalLink.textContent = 'Abrir en GitHub \u2197';
                modalLink.style.display = 'inline-block';
                modalLink.style.marginTop = '12px';
            } else {
                modalLink.style.display = 'none';
            }
            modal.setAttribute('aria-hidden','false');
        });
    });
    modalClose.addEventListener('click',()=>modal.setAttribute('aria-hidden','true'));
    modal.addEventListener('click',(e)=>{ if(e.target===modal) modal.setAttribute('aria-hidden','true'); });

    // Contact form validation
    const form = document.getElementById('contactForm');
    const feedback = document.getElementById('formFeedback');
    form.addEventListener('submit',(e)=>{
        e.preventDefault(); feedback.textContent='';
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!name || !email || !message){ feedback.textContent='Por favor complete todos los campos.'; return; }
        if(!emailRe.test(email)){ feedback.textContent='Ingrese un correo válido.'; return; }
        feedback.style.color='green';
        feedback.textContent='Mensaje listo (no se envía en esta práctica). Gracias.';
        form.reset();
        setTimeout(()=>{ feedback.textContent=''; feedback.style.color=''; },4000);
    });

});
