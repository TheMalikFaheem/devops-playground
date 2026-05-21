/**
 * LAN Legends — route data packets through LAN topologies while blocking malware.
 * DevOps-themed puzzle / light tower-defense in the browser.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'lan-legends-progress';

  const NODE_TYPES = {
    source: { label: 'Workstation', color: '#5eead4', radius: 22 },
    sink: { label: 'Server', color: '#6ea8fe', radius: 22 },
    switch: { label: 'Switch', color: '#94a3b8', radius: 18 },
    router: { label: 'Router', color: '#fbbf24', radius: 20 },
    firewall: { label: 'Firewall', color: '#f97316', radius: 20 },
    gateway: { label: 'Edge GW', color: '#a78bfa', radius: 20 },
  };

  const TOOLS = {
    route: { id: 'route', name: 'Enable Link', desc: 'Toggle cable between two nodes' },
    firewall: { id: 'firewall', name: 'Block Port', desc: 'Toggle firewall on a node' },
    subnet: { id: 'subnet', name: 'Subnet Mask', desc: 'Cycle router ACL (/24, /25, open)' },
    pfsense: { id: 'pfsense', name: 'Deploy pfSense', desc: 'Edge gateway — blocks malware 8s' },
  };

  const LEVELS = [
    {
      id: 1,
      name: 'Flat LAN',
      hint: 'Enable links from Workstation → Switch → Server. Toggle the Firewall before malware crosses it.',
      timer: 75,
      targetPackets: 8,
      maxLeaks: 3,
      spawnInterval: 2.8,
      malwareChance: 0.22,
      nodes: [
        { id: 'ws', type: 'source', x: 0.12, y: 0.5 },
        { id: 'sw1', type: 'switch', x: 0.35, y: 0.5 },
        { id: 'fw1', type: 'firewall', x: 0.55, y: 0.5, blocked: false },
        { id: 'srv', type: 'sink', x: 0.88, y: 0.5 },
        { id: 'inf', type: 'switch', x: 0.35, y: 0.78, infected: true },
      ],
      edges: [
        ['ws', 'sw1'],
        ['sw1', 'fw1'],
        ['fw1', 'srv'],
        ['inf', 'sw1'],
      ],
      enabledEdges: [['ws', 'sw1'], ['sw1', 'fw1'], ['fw1', 'srv']],
    },
    {
      id: 2,
      name: 'Subnetted VLAN',
      hint: 'Data uses subnet A. Malware uses subnet B — set the Router mask to /25 to drop B while allowing A.',
      timer: 90,
      targetPackets: 10,
      maxLeaks: 2,
      spawnInterval: 2.4,
      malwareChance: 0.35,
      nodes: [
        { id: 'ws', type: 'source', x: 0.1, y: 0.45 },
        { id: 'r1', type: 'router', x: 0.38, y: 0.45, mask: 24 },
        { id: 'sw2', type: 'switch', x: 0.62, y: 0.45 },
        { id: 'srv', type: 'sink', x: 0.9, y: 0.45 },
        { id: 'dmz', type: 'switch', x: 0.38, y: 0.75, infected: true },
        { id: 'fw2', type: 'firewall', x: 0.62, y: 0.72, blocked: false },
      ],
      edges: [
        ['ws', 'r1'],
        ['r1', 'sw2'],
        ['sw2', 'srv'],
        ['dmz', 'r1'],
        ['dmz', 'fw2'],
        ['fw2', 'srv'],
      ],
      enabledEdges: [['ws', 'r1'], ['r1', 'sw2'], ['sw2', 'srv']],
      dataSubnet: 'A',
      malwareSubnet: 'B',
    },
    {
      id: 3,
      name: 'Edge pfSense',
      hint: 'Malware floods the backup link. Deploy pfSense on the Edge Gateway before the wave hits.',
      timer: 100,
      targetPackets: 12,
      maxLeaks: 2,
      spawnInterval: 2.0,
      malwareChance: 0.42,
      nodes: [
        { id: 'ws', type: 'source', x: 0.08, y: 0.5 },
        { id: 'swA', type: 'switch', x: 0.28, y: 0.35 },
        { id: 'swB', type: 'switch', x: 0.28, y: 0.65 },
        { id: 'r2', type: 'router', x: 0.48, y: 0.5, mask: 24 },
        { id: 'gw', type: 'gateway', x: 0.68, y: 0.5, pfsense: false },
        { id: 'fw3', type: 'firewall', x: 0.68, y: 0.78, blocked: true },
        { id: 'srv', type: 'sink', x: 0.92, y: 0.5 },
        { id: 'bot', type: 'switch', x: 0.48, y: 0.82, infected: true },
      ],
      edges: [
        ['ws', 'swA'],
        ['ws', 'swB'],
        ['swA', 'r2'],
        ['swB', 'r2'],
        ['r2', 'gw'],
        ['gw', 'srv'],
        ['bot', 'fw3'],
        ['fw3', 'gw'],
        ['bot', 'r2'],
      ],
      enabledEdges: [['ws', 'swA'], ['swA', 'r2'], ['r2', 'gw'], ['gw', 'srv']],
      dataSubnet: 'A',
      malwareSubnet: 'B',
    },
    {
      id: 4,
      name: 'DMZ Siege',
      hint: 'Combine subnet ACLs, firewalls, and pfSense. Block the DMZ path while keeping production online.',
      timer: 110,
      targetPackets: 15,
      maxLeaks: 2,
      spawnInterval: 1.7,
      malwareChance: 0.48,
      nodes: [
        { id: 'ws', type: 'source', x: 0.06, y: 0.5 },
        { id: 'fwA', type: 'firewall', x: 0.22, y: 0.38, blocked: false },
        { id: 'fwB', type: 'firewall', x: 0.22, y: 0.62, blocked: false },
        { id: 'r3', type: 'router', x: 0.42, y: 0.5, mask: 24 },
        { id: 'gw2', type: 'gateway', x: 0.62, y: 0.42, pfsense: false },
        { id: 'swC', type: 'switch', x: 0.62, y: 0.62 },
        { id: 'srv', type: 'sink', x: 0.92, y: 0.5 },
        { id: 'dmz2', type: 'switch', x: 0.42, y: 0.82, infected: true },
        { id: 'fwD', type: 'firewall', x: 0.78, y: 0.72, blocked: false },
      ],
      edges: [
        ['ws', 'fwA'],
        ['ws', 'fwB'],
        ['fwA', 'r3'],
        ['fwB', 'r3'],
        ['r3', 'gw2'],
        ['r3', 'swC'],
        ['gw2', 'srv'],
        ['swC', 'srv'],
        ['dmz2', 'fwD'],
        ['fwD', 'srv'],
        ['dmz2', 'r3'],
      ],
      enabledEdges: [['ws', 'fwA'], ['fwA', 'r3'], ['r3', 'gw2'], ['gw2', 'srv']],
      dataSubnet: 'A',
      malwareSubnet: 'B',
    },
  ];

  const canvas = document.getElementById('lan-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('lan-overlay');
  const overlayTitle = document.getElementById('lan-overlay-title');
  const overlayText = document.getElementById('lan-overlay-text');
  const overlayBtn = document.getElementById('lan-overlay-btn');
  const levelPills = document.getElementById('lan-level-pills');
  const statTimer = document.getElementById('stat-timer');
  const statDelivered = document.getElementById('stat-delivered');
  const statLeaks = document.getElementById('stat-leaks');
  const statLevel = document.getElementById('stat-level');
  const gameLog = document.getElementById('lan-log');
  const hintEl = document.getElementById('lan-hint');
  const btnPause = document.getElementById('btn-pause');
  const btnRestart = document.getElementById('btn-restart');

  let progress = loadProgress();
  let levelIndex = 0;
  let state = null;
  let activeTool = 'route';
  let selectedNode = null;
  let animId = null;
  let lastTs = 0;

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { unlocked: 1, completed: [] };
    } catch {
      return { unlocked: 1, completed: [] };
    }
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    renderLevelPills();
  }

  function log(msg, cls) {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    p.textContent = msg;
    gameLog.prepend(p);
    while (gameLog.children.length > 12) gameLog.removeChild(gameLog.lastChild);
  }

  function edgeKey(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  function cloneLevel(idx) {
    const L = LEVELS[idx];
    const nodes = L.nodes.map((n) => ({ ...n }));
    const enabled = new Set((L.enabledEdges || []).map(([a, b]) => edgeKey(a, b)));
    return {
      ...L,
      nodes,
      enabled,
      packets: [],
      delivered: 0,
      leaks: 0,
      spawnAcc: 0,
      timeLeft: L.timer,
      running: false,
      paused: false,
      pfsenseCooldown: 0,
      waveAlert: false,
    };
  }

  function getNode(id) {
    return state.nodes.find((n) => n.id === id);
  }

  function nodePos(n) {
    return { x: n.x * canvas.width, y: n.y * canvas.height };
  }

  function isEdgeEnabled(a, b) {
    return state.enabled.has(edgeKey(a, b));
  }

  function setEdge(a, b, on) {
    const k = edgeKey(a, b);
    if (on) state.enabled.add(k);
    else state.enabled.delete(k);
  }

  function neighbors(nodeId) {
    const out = [];
    for (const [a, b] of state.edges) {
      if (!isEdgeEnabled(a, b)) continue;
      if (a === nodeId) out.push(b);
      if (b === nodeId) out.push(a);
    }
    return out;
  }

  function findPath(fromId, toId, packet) {
    const queue = [[fromId]];
    const seen = new Set([fromId]);
    while (queue.length) {
      const path = queue.shift();
      const cur = path[path.length - 1];
      if (cur === toId) return path;
      for (const next of neighbors(cur)) {
        if (seen.has(next)) continue;
        const node = getNode(next);
        if (!canTraverse(node, packet, path, next)) continue;
        seen.add(next);
        queue.push([...path, next]);
      }
    }
    return null;
  }

  function canTraverse(node, packet, pathSoFar, nextId) {
    if (node.type === 'firewall' && node.blocked && packet.kind === 'malware') {
      return false;
    }
    if (node.type === 'gateway' && node.pfsense && packet.kind === 'malware') {
      return false;
    }
    if (node.type === 'router' && packet.subnet) {
      const mask = node.mask ?? 24;
      if (mask === 0) return true;
      if (mask === 24 && packet.subnet === state.malwareSubnet) return false;
      if (mask === 25 && packet.subnet !== state.dataSubnet) return false;
    }
    return true;
  }

  function spawnPacket(kind) {
    const source = state.nodes.find((n) => n.type === 'source');
    const sink = state.nodes.find((n) => n.type === 'sink');
    if (!source || !sink) return;

    const subnet =
      kind === 'data'
        ? state.dataSubnet || 'A'
        : state.malwareSubnet || 'B';

    const path = findPath(source.id, sink.id, { kind, subnet });
    if (!path && kind === 'data') {
      log('No route to server — enable links!', 'warn');
      return;
    }

    const startPath =
      kind === 'malware'
        ? findMalwarePath()
        : path;

    if (!startPath || startPath.length < 2) return;

    state.packets.push({
      id: Math.random().toString(36).slice(2),
      kind,
      subnet,
      path: startPath,
      seg: 0,
      t: 0,
      speed: kind === 'malware' ? 0.55 : 0.42,
    });
  }

  function findMalwarePath() {
    const infected = state.nodes.filter((n) => n.infected);
    const sink = state.nodes.find((n) => n.type === 'sink');
    for (const start of infected) {
      const p = findPath(start.id, sink.id, { kind: 'malware', subnet: state.malwareSubnet || 'B' });
      if (p) return p;
    }
    return null;
  }

  function resizeCanvas() {
    const panel = canvas.parentElement;
    const w = panel.clientWidth;
    const h = Math.max(400, Math.min(520, w * 0.55));
    canvas.width = w;
    canvas.height = h;
  }

  function hitTest(mx, my) {
    let best = null;
    let bestD = Infinity;
    for (const n of state.nodes) {
      const p = nodePos(n);
      const meta = NODE_TYPES[n.type];
      const d = Math.hypot(mx - p.x, my - p.y);
      if (d < meta.radius + 8 && d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  function hitTestEdge(mx, my) {
    let best = null;
    let bestD = 25;
    for (const [a, b] of state.edges) {
      const na = getNode(a);
      const nb = getNode(b);
      const pa = nodePos(na);
      const pb = nodePos(nb);
      const d = distToSegment(mx, my, pa.x, pa.y, pb.x, pb.y);
      if (d < bestD) {
        bestD = d;
        best = [a, b];
      }
    }
    return best;
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function handleClick(mx, my) {
    if (!state.running || state.paused) return;

    const node = hitTest(mx, my);

    if (activeTool === 'route') {
      if (node) {
        if (!selectedNode) {
          selectedNode = node.id;
          log(`Selected ${NODE_TYPES[node.type].label} — pick another node to toggle link.`);
          return;
        }
        if (selectedNode === node.id) {
          selectedNode = null;
          return;
        }
        const hasEdge = state.edges.some(
          ([a, b]) =>
            (a === selectedNode && b === node.id) || (b === selectedNode && a === node.id)
        );
        if (hasEdge) {
          const on = !isEdgeEnabled(selectedNode, node.id);
          setEdge(selectedNode, node.id, on);
          log(`${on ? 'Enabled' : 'Disabled'} link.`, on ? 'good' : 'warn');
        }
        selectedNode = null;
        return;
      }
      const edge = hitTestEdge(mx, my);
      if (edge) {
        const on = !isEdgeEnabled(edge[0], edge[1]);
        setEdge(edge[0], edge[1], on);
        log(`${on ? 'Enabled' : 'Disabled'} link.`, on ? 'good' : 'warn');
      }
      return;
    }

    if (!node) return;

    if (activeTool === 'firewall' && node.type === 'firewall') {
      node.blocked = !node.blocked;
      log(`Firewall ${node.blocked ? 'BLOCK' : 'ALLOW'}`, node.blocked ? 'good' : 'warn');
      return;
    }

    if (activeTool === 'subnet' && node.type === 'router') {
      const cycle = [24, 25, 0];
      const i = cycle.indexOf(node.mask ?? 24);
      node.mask = cycle[(i + 1) % cycle.length];
      const labels = { 24: '/24 (block malware net)', 25: '/25 (strict — data only)', 0: 'OPEN' };
      log(`Router mask → ${labels[node.mask]}`, 'good');
      return;
    }

    if (activeTool === 'pfsense' && node.type === 'gateway') {
      if (state.pfsenseCooldown > 0) {
        log('pfSense deploy on cooldown…', 'warn');
        return;
      }
      if (node.pfsense) {
        log('pfSense already active on this gateway.', 'warn');
        return;
      }
      node.pfsense = true;
      state.pfsenseCooldown = 14;
      log('pfSense deployed — edge malware filter ON (8s).', 'good');
      setTimeout(() => {
        if (state) {
          node.pfsense = false;
          log('pfSense rule expired — redeploy if needed.', 'warn');
        }
      }, 8000);
      return;
    }

    log('Wrong tool for this node.', 'warn');
  }

  function update(dt) {
    if (!state.running || state.paused) return;

    state.timeLeft -= dt;
    if (state.pfsenseCooldown > 0) state.pfsenseCooldown -= dt;

    state.spawnAcc += dt;
    if (state.spawnAcc >= state.spawnInterval) {
      state.spawnAcc = 0;
      const roll = Math.random();
      if (roll < state.malwareChance) spawnPacket('malware');
      else spawnPacket('data');
    }

    if (state.timeLeft <= 15 && !state.waveAlert) {
      state.waveAlert = true;
      log('Final wave — tighten ACLs!', 'warn');
    }

    for (let i = state.packets.length - 1; i >= 0; i--) {
      const pkt = state.packets[i];
      pkt.t += dt * pkt.speed;
      if (pkt.t >= 1) {
        pkt.t = 0;
        pkt.seg++;
        if (pkt.seg >= pkt.path.length - 1) {
          finishPacket(pkt);
          state.packets.splice(i, 1);
        } else {
          const nextNode = getNode(pkt.path[pkt.seg + 1]);
          if (!canTraverse(nextNode, pkt, pkt.path.slice(0, pkt.seg + 1), pkt.path[pkt.seg + 1])) {
            state.packets.splice(i, 1);
            if (pkt.kind === 'malware') log('Threat neutralized.', 'good');
          }
        }
      }
    }

    statTimer.querySelector('strong').textContent = Math.max(0, Math.ceil(state.timeLeft)) + 's';
    statDelivered.querySelector('strong').textContent =
      `${state.delivered}/${state.targetPackets}`;
    statLeaks.querySelector('strong').textContent =
      `${state.leaks}/${state.maxLeaks}`;

    if (state.delivered >= state.targetPackets) endGame(true);
    else if (state.leaks > state.maxLeaks) endGame(false, 'Too many malware packets reached the server.');
    else if (state.timeLeft <= 0) {
      if (state.delivered >= state.targetPackets) endGame(true);
      else endGame(false, 'Timer expired before quota was delivered.');
    }
  }

  function finishPacket(pkt) {
    const sink = state.nodes.find((n) => n.type === 'sink');
    const last = pkt.path[pkt.path.length - 1];
    if (last !== sink.id) return;

    if (pkt.kind === 'data') {
      state.delivered++;
      log(`Packet delivered (${state.delivered}/${state.targetPackets})`, 'good');
    } else {
      state.leaks++;
      log(`Malware breach! (${state.leaks}/${state.maxLeaks})`, 'bad');
    }
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(17, 26, 51, 0.6)';
    ctx.fillRect(0, 0, w, h);

    drawGrid(w, h);

    for (const [a, b] of state.edges) {
      const na = getNode(a);
      const nb = getNode(b);
      const pa = nodePos(na);
      const pb = nodePos(nb);
      const on = isEdgeEnabled(a, b);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.strokeStyle = on ? 'rgba(94, 234, 212, 0.45)' : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = on ? 3 : 1.5;
      if (!on) ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (const n of state.nodes) {
      drawNode(n);
    }

    for (const pkt of state.packets) {
      drawPacket(pkt);
    }

    if (selectedNode) {
      const n = getNode(selectedNode);
      const p = nodePos(n);
      ctx.beginPath();
      ctx.arc(p.x, p.y, NODE_TYPES[n.type].radius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#6ea8fe';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawGrid(w, h) {
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  function drawNode(n) {
    const p = nodePos(n);
    const meta = NODE_TYPES[n.type];
    const r = meta.radius;

    if (n.infected) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 107, 107, 0.25)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = meta.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (n.type === 'firewall') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(n.blocked ? '⛔' : '✓', p.x, p.y + 4);
    }

    if (n.type === 'router') {
      const maskLabel = n.mask === 0 ? 'open' : `/${n.mask}`;
      ctx.fillStyle = '#0b1020';
      ctx.font = '10px system-ui';
      ctx.fillText(maskLabel, p.x, p.y + 3);
    }

    if (n.type === 'gateway') {
      ctx.fillStyle = '#fff';
      ctx.font = '10px system-ui';
      ctx.fillText(n.pfsense ? 'pf' : '+', p.x, p.y + 3);
    }

    ctx.fillStyle = 'rgba(232, 236, 255, 0.9)';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(n.id, p.x, p.y + r + 14);
  }

  function drawPacket(pkt) {
    const a = getNode(pkt.path[pkt.seg]);
    const b = getNode(pkt.path[pkt.seg + 1]);
    const pa = nodePos(a);
    const pb = nodePos(b);
    const x = pa.x + (pb.x - pa.x) * pkt.t;
    const y = pa.y + (pb.y - pa.y) * pkt.t;

    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = pkt.kind === 'data' ? '#5eead4' : '#ff6b6b';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (pkt.subnet) {
      ctx.fillStyle = '#fff';
      ctx.font = '9px system-ui';
      ctx.fillText(pkt.subnet, x, y - 11);
    }
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }

  function startLevel(idx) {
    if (animId) cancelAnimationFrame(animId);
    levelIndex = idx;
    state = cloneLevel(idx);
    state.edges = LEVELS[idx].edges;
    state.running = true;
    state.paused = false;
    lastTs = 0;
    selectedNode = null;

    statLevel.querySelector('strong').textContent = `L${state.id}`;
    hintEl.textContent = state.hint;
    gameLog.innerHTML = '';
    log(`Level ${state.id}: ${state.name}`, 'good');
    log('Select a tool, then click nodes or links.', '');

    overlay.classList.add('hidden');
    resizeCanvas();
    animId = requestAnimationFrame(loop);
  }

  function endGame(won, reason) {
    state.running = false;
    if (animId) cancelAnimationFrame(animId);

    if (won) {
      if (!progress.completed.includes(state.id)) progress.completed.push(state.id);
      if (state.id >= progress.unlocked && state.id < LEVELS.length) {
        progress.unlocked = state.id + 1;
      }
      saveProgress();
      overlayTitle.textContent = 'Network Secured';
      overlayText.textContent = `Level ${state.id} complete. ${state.delivered} packets delivered.`;
      overlayBtn.textContent = state.id < LEVELS.length ? 'Next Level' : 'Play Again';
      overlayBtn.onclick = () => {
        if (state.id < LEVELS.length) startLevel(levelIndex + 1);
        else showMenu();
      };
    } else {
      overlayTitle.textContent = 'Breach Detected';
      overlayText.textContent = reason || 'Malware overwhelmed the LAN.';
      overlayBtn.textContent = 'Retry';
      overlayBtn.onclick = () => startLevel(levelIndex);
    }
    overlay.classList.remove('hidden');
  }

  function showMenu() {
    state = { running: false };
    if (animId) cancelAnimationFrame(animId);
    overlayTitle.textContent = 'LAN Legends';
    overlayText.textContent =
      'Route data packets through switches, routers, and firewalls. Block malware with subnet masks and pfSense before time runs out.';
    overlayBtn.textContent = 'Start Level 1';
    overlayBtn.onclick = () => startLevel(0);
    overlay.classList.remove('hidden');
    renderLevelPills();
    drawMenuBackdrop();
  }

  function drawMenuBackdrop() {
    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(110, 168, 254, 0.15)';
    ctx.font = '18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Select a level or press Start', canvas.width / 2, canvas.height / 2);
  }

  function renderLevelPills() {
    levelPills.innerHTML = '';
    LEVELS.forEach((L, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lan-level-pill';
      btn.textContent = L.id;
      if (progress.completed.includes(L.id)) btn.classList.add('done');
      if (L.id > progress.unlocked) btn.classList.add('locked');
      btn.addEventListener('click', () => {
        if (L.id <= progress.unlocked) startLevel(i);
      });
      levelPills.appendChild(btn);
    });
  }

  document.querySelectorAll('.lan-tool-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lan-tool-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeTool = btn.dataset.tool;
      selectedNode = null;
    });
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const my = ((e.clientY - rect.top) / rect.height) * canvas.height;
    handleClick(mx, my);
  });

  btnPause.addEventListener('click', () => {
    if (!state || !state.running) return;
    state.paused = !state.paused;
    btnPause.textContent = state.paused ? 'Resume' : 'Pause';
    log(state.paused ? 'Paused' : 'Resumed', 'warn');
  });

  btnRestart.addEventListener('click', () => startLevel(levelIndex));

  window.addEventListener('resize', () => {
    if (state && state.running) resizeCanvas();
    else drawMenuBackdrop();
  });

  document.querySelector('.lan-tool-btn[data-tool="route"]').classList.add('active');
  renderLevelPills();
  showMenu();
})();
