(() => {
  'use strict';
  const doc = document;
  doc.documentElement.classList.add('js-enabled');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menu = doc.getElementById('menu-toggle');
  const nav = doc.getElementById('main-nav');
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation');
    nav.classList.remove('open');
  }
  menu.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(expanded));
    menu.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('open', expanded);
  });
  nav.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });
  doc.addEventListener('click', (event) => { if (!event.target.closest('.site-header')) closeMenu(); });
  function selectGroup(selector, selected) {
    doc.querySelectorAll(selector).forEach(button => button.setAttribute('aria-pressed', String(button === selected)));
  }
  const lenses = {
    sense: ['Understand the scene.', 'Pose estimation, activity recognition and multi-model computer vision on edge devices.'],
    retrieve: ['Find the useful context.', 'Document embeddings, semantic search and context-aware retrieval for LLM applications.'],
    reason: ['Reason with evidence.', 'Agentic investigation, controlled tools and explicit hypothesis tracking.'],
    deploy: ['Connect models to software.', 'Edge devices, Docker packages and cloud inference workflows with observable outputs.']
  };
  doc.querySelectorAll('[data-lens]').forEach(button => button.addEventListener('click', () => {
    selectGroup('[data-lens]', button);
    const [title, description] = lenses[button.dataset.lens];
    doc.getElementById('lens-title').textContent = title;
    doc.getElementById('lens-description').textContent = description;
  }));
  const descriptions = {
    plan: 'The planner uses the LLM to choose which question to investigate and which tool can answer it.',
    act: 'Controlled tools search the repository, inspect targeted files and return evidence for the next reasoning step.',
    evidence: 'Investigation notes and hypothesis tracking preserve useful evidence. The loop continues as the hypothesis changes.',
    report: 'The reporting LLM reasons over the collected evidence and investigation notes, then writes the final root-cause analysis. It distinguishes supported findings from open questions.'
  };
  doc.querySelectorAll('[data-node]').forEach(button => button.addEventListener('click', () => {
    selectGroup('[data-node]', button);
    doc.querySelectorAll('[data-node]').forEach(node => node.classList.toggle('active', node === button));
    doc.getElementById('node-description').textContent = descriptions[button.dataset.node];
  }));
  doc.querySelectorAll('[data-architecture]').forEach(button => button.addEventListener('click', () => {
    const isAgent = button.dataset.architecture === 'agent';
    selectGroup('[data-architecture]', button);
    doc.getElementById('diagram-agent').hidden = !isAgent;
    doc.getElementById('diagram-graph').hidden = isAgent;
    doc.getElementById('node-description').textContent = isAgent
      ? descriptions[doc.querySelector('[data-node][aria-pressed="true"]').dataset.node]
      : 'Structural retrieval depended on graph construction and seed selection. Noisy evidence and setup costs motivated the redesign.';
    doc.querySelector('.diagram-caption').textContent = isAgent ? 'Simplified conceptual view · Select a stage to explore' : 'Simplified conceptual view · Original graph-based approach';
  }));
  const vision = {
    activity: ['MoveNet pose keypoints feed a custom neural network for human activity classification.', 'POSE → ACTIVITY'],
    objects: ['YOLOv8 fine-tuned on a custom dataset adds object detections to the integrated vision pipeline.', 'FRAMES → OBJECTS'],
    identity: ['dlib-based face recognition connects identity to activity events; MediaPipe supports drowsiness detection.', 'IDENTITY + OBSERVATIONS'],
    stream: ['RTSP and WebRTC support video streaming, alongside timestamped activity, identity and object logs.', 'VIDEO → STREAM + LOGS']
  };
  doc.querySelectorAll('[data-vision]').forEach(button => button.addEventListener('click', () => {
    selectGroup('[data-vision]', button);
    const [description, label] = vision[button.dataset.vision];
    doc.getElementById('vision-description').textContent = description;
    doc.querySelector('.frame-label').textContent = label;
  }));
  doc.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    selectGroup('[data-filter]', button);
    let count = 0;
    doc.querySelectorAll('[data-category]').forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) count++;
    });
    doc.getElementById('filter-status').textContent = `Showing ${count} projects`;
  }));
  doc.querySelectorAll('[data-open-details]').forEach(link => link.addEventListener('click', (event) => {
    event.preventDefault();
    const details = doc.getElementById(link.dataset.openDetails);
    details.open = true;
    details.querySelector('summary').focus({ preventScroll: true });
    details.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#${details.id}`);
  }));
  const hashTarget = doc.getElementById(location.hash.slice(1));
  if (hashTarget?.tagName === 'DETAILS') hashTarget.open = true;
  const copyButton = doc.getElementById('copy-email');
  copyButton.addEventListener('click', async () => {
    const status = doc.getElementById('copy-status');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText('jankimandviya2003@gmail.com');
      status.textContent = 'Email address copied.';
      copyButton.textContent = 'Copied ✓';
      window.setTimeout(() => { copyButton.textContent = 'Copy email'; }, 2500);
    } catch {
      status.textContent = 'Select the email address to copy it, or click it to open your email app.';
    }
  });
  doc.getElementById('year').textContent = String(new Date().getFullYear());
  if ('IntersectionObserver' in window) {
    if (!reduced.matches) {
      doc.documentElement.classList.add('motion-ready');
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      }), { threshold: 0.06 });
      doc.querySelectorAll('.reveal').forEach(element => observer.observe(element));
      // Content remains visible if observation fails or preference changes.
      reduced.addEventListener?.('change', () => { if (reduced.matches) doc.documentElement.classList.remove('motion-ready'); });
    }
    const activeObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        nav.querySelectorAll('a').forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    }), { rootMargin: '-10% 0px -70% 0px', threshold: 0 });
    ['work', 'experience', 'about', 'contact'].forEach(id => activeObserver.observe(doc.getElementById(id)));
  }
})();
