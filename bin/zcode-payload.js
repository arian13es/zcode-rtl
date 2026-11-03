/* ZCODE PRO RTL PATCH - PRO UI */
(function() {
    let rtlConfig = { 
        faFont: '', 
        enFont: '', 
        codeFont: '', 
        lh: '1.6', 
        fs: '13', 
        isRTL: true, 
        forceRTL: false, 
        fixAtSign: true 
    };

    try {
        const saved = localStorage.getItem('zcode-rtl-config') || localStorage.getItem('smart-rtl-config');
        if (saved) {
            rtlConfig = { ...rtlConfig, ...JSON.parse(saved) };
        }
    } catch (e) {}

    let isRTL = rtlConfig.isRTL;
    let forceRTL = rtlConfig.forceRTL || false;
    let fixAtSign = rtlConfig.fixAtSign !== false;

    function injectStyle(id, css) {
        let style = document.getElementById(id);
        if (!style) {
            style = document.createElement('style');
            style.id = id;
            document.head.appendChild(style);
        }
        style.textContent = css;
    }

    const staticCSS = `
        .zcode-rtl-widget-container { 
            position: fixed; z-index: 2147483647; 
            display: flex; flex-direction: column; 
            touch-action: none; user-select: none; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        
        .zcode-rtl-widget-panel { 
            position: absolute; 
            transform: scale(0.95); opacity: 0; pointer-events: none; 
            transition: opacity 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); 
        }
        .zcode-rtl-widget-panel.open { transform: scale(1); opacity: 1; pointer-events: auto; }
        
        .zcode-rtl-theme-panel { 
            background: rgba(24, 24, 27, 0.95) !important; 
            color: #f4f4f5 !important; 
            border: 1px solid rgba(255, 255, 255, 0.12) !important; 
            padding: 16px 20px; 
            border-radius: 12px; 
            width: 290px; 
            box-shadow: 0 16px 40px rgba(0,0,0,0.65) !important; 
            max-height: 80vh; overflow-y: auto; 
            backdrop-filter: blur(16px);
        }
        
        .zcode-rtl-theme-input { 
            background-color: rgba(255, 255, 255, 0.08) !important; 
            color: #f4f4f5 !important; 
            border: 1px solid rgba(255, 255, 255, 0.15) !important; 
            padding: 6px 8px; border-radius: 6px; 
            width: 140px; font-size: 12px; 
            outline: none; transition: border-color 0.2s; 
        }
        .zcode-rtl-theme-input:focus { 
            border-color: #38bdf8 !important; 
        }
        
        .zcode-rtl-toggle-btn-reset { 
            background: rgba(121, 121, 121, 0.35) !important; 
            border: none; border-radius: 14px; 
            width: 44px; height: 24px; position: relative; 
            cursor: pointer; transition: background 0.3s; flex-shrink: 0; 
        }
        .zcode-rtl-toggle-btn-reset.active { 
            background: #0284c7 !important; 
        }
        .zcode-rtl-toggle-knob { 
            background: #fff; border-radius: 50%; 
            width: 18px; height: 18px; position: absolute; 
            top: 3px; left: 3px; transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1); 
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .zcode-rtl-toggle-btn-reset.active .zcode-rtl-toggle-knob { transform: translateX(20px); }
        
        .zcode-rtl-row { 
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 14px; padding-bottom: 12px; 
            border-bottom: 1px solid rgba(255, 255, 255, 0.08); 
        }
        .zcode-rtl-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .zcode-rtl-label { font-size: 13px; font-weight: 500; opacity: 0.9; }
        
        .zcode-rtl-widget-trigger { 
            width: 46px; height: 46px; border-radius: 50%; 
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%) !important; 
            color: #ffffff !important; 
            display: flex; align-items: center; justify-content: center; 
            cursor: grab; 
            box-shadow: 0 4px 16px rgba(2, 132, 199, 0.45), 0 2px 6px rgba(0,0,0,0.3) !important; 
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s !important; 
            touch-action: none;
        }
        .zcode-rtl-widget-trigger:active { cursor: grabbing; }
        .zcode-rtl-widget-trigger:hover { 
            transform: scale(1.08); 
            box-shadow: 0 6px 20px rgba(2, 132, 199, 0.6), 0 2px 8px rgba(0,0,0,0.4) !important; 
        }
        .zcode-rtl-widget-trigger svg { transition: transform 0.3s; pointer-events: none; }
        .zcode-rtl-widget-panel.open ~ .zcode-rtl-widget-trigger svg { transform: rotate(90deg); }

        /* NATIVE BIDIRECTIONAL ENGINE FOR PROMPT INPUT / LEXICAL (ZERO DOM MUTATION) */
        [data-lexical-editor="true"],
        [contenteditable="true"],
        .chat-composer-input-surface [contenteditable="true"] {
            unicode-bidi: plaintext !important;
            text-align: start !important;
        }
        [data-lexical-editor="true"] p,
        [contenteditable="true"] p {
            unicode-bidi: plaintext !important;
            text-align: start !important;
        }

        /* CRITICAL BIDI ISOLATION FOR INLINE CODE, TERMINALS & MONOSPACE */
        code,
        kbd,
        samp,
        var,
        .font-mono,
        [class*="mono"],
        pre,
        pre code,
        .xterm,
        .terminal-xterm-shell,
        [class*="terminal"],
        [class*="terminal"] *,
        .monaco-editor,
        .monaco-editor *,
        .cm-editor,
        .cm-editor *,
        [data-code-block],
        [data-code-block] *,
        .bg-markdown-inline-code,
        [class*="diff"] {
            direction: ltr !important;
            unicode-bidi: isolate !important;
            text-align: left !important;
            font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace) !important;
        }

        /* Math and KaTeX formulas */
        .katex, .katex * {
            direction: ltr !important;
            unicode-bidi: isolate !important;
        }

        /* RTL block definitions */
        [dir="rtl"] {
            text-align: right !important;
            direction: rtl !important;
            unicode-bidi: isolate !important;
        }

        [dir="rtl"] p,
        [dir="rtl"] li,
        [dir="rtl"] h1,
        [dir="rtl"] h2,
        [dir="rtl"] h3,
        [dir="rtl"] h4,
        [dir="rtl"] h5,
        [dir="rtl"] h6,
        [dir="rtl"] blockquote {
            text-align: right !important;
            direction: rtl !important;
            unicode-bidi: isolate !important;
        }

        /* Headings in RTL */
        [dir="rtl"] h1, [dir="rtl"] h2, [dir="rtl"] h3, [dir="rtl"] h4, [dir="rtl"] h5, [dir="rtl"] h6,
        h1[dir="rtl"], h2[dir="rtl"], h3[dir="rtl"], h4[dir="rtl"], h5[dir="rtl"], h6[dir="rtl"] {
            text-align: right !important;
            direction: rtl !important;
            unicode-bidi: isolate !important;
        }

        /* Tables in RTL */
        table[dir="rtl"],
        [dir="rtl"] table,
        [data-markdown-table-frame][dir="rtl"] table {
            direction: rtl !important;
        }

        [data-markdown-table-frame][dir="rtl"] {
            direction: rtl !important;
        }

        table[dir="rtl"] th,
        table[dir="rtl"] td,
        [dir="rtl"] table th,
        [dir="rtl"] table td,
        [data-markdown-table-frame][dir="rtl"] th,
        [data-markdown-table-frame][dir="rtl"] td,
        th[dir="rtl"],
        td[dir="rtl"] {
            direction: rtl !important;
            text-align: right !important;
            unicode-bidi: isolate !important;
        }

        table[dir="rtl"] th[align="center"],
        table[dir="rtl"] td[align="center"],
        [dir="rtl"] table th[align="center"],
        [dir="rtl"] table td[align="center"] {
            text-align: center !important;
        }

        table[dir="rtl"] th[align="left"],
        table[dir="rtl"] td[align="left"],
        [dir="rtl"] table th[align="left"],
        [dir="rtl"] table td[align="left"] {
            text-align: left !important;
        }

        /* Lists in RTL */
        ul[dir="rtl"],
        ol[dir="rtl"],
        [dir="rtl"] ul,
        [dir="rtl"] ol {
            direction: rtl !important;
            text-align: right !important;
            padding-right: 1.5rem !important;
            padding-left: 0 !important;
        }

        li[dir="rtl"],
        [dir="rtl"] li {
            direction: rtl !important;
            text-align: right !important;
            unicode-bidi: isolate !important;
        }

        /* Blockquotes in RTL */
        blockquote[dir="rtl"],
        [dir="rtl"] blockquote {
            direction: rtl !important;
            text-align: right !important;
            unicode-bidi: isolate !important;
            border-right: 3px solid rgba(128, 128, 128, 0.4) !important;
            border-left: none !important;
            padding-right: 0.75rem !important;
            padding-left: 0 !important;
        }

        [dir="ltr"] {
            text-align: left !important;
            direction: ltr !important;
            unicode-bidi: isolate !important;
        }
    `;
    injectStyle('zcode-rtl-widget-style', staticCSS);

    function updateDynamicCSS(faFont, enFont, codeFont, lh, fs) {
        let faFontName = "'PersianOnlyFont'";
        let faFontRule = '';
        const persianUnicodeRange = 'U+0600-06FF, U+FB50-FDFF, U+FE70-FEFF';
        
        if (faFont) {
            faFontName = `'UserPersianFont', 'PersianOnlyFont'`;
            let baseFaFont = faFont.replace(/[-\s]?Regular$/i, '');
            faFontRule = `
                @font-face { font-family: 'UserPersianFont'; src: local('${faFont}'), local('${baseFaFont}'); font-weight: 400; unicode-range: ${persianUnicodeRange}; }
                @font-face { font-family: 'UserPersianFont'; src: local('${baseFaFont} Bold'), local('${baseFaFont}-Bold'); font-weight: 700; unicode-range: ${persianUnicodeRange}; }
            `;
        }
        
        let enFontStr = enFont ? `'${enFont}', ` : '';
        
        const dynamicCSS = `
            ${faFontRule}
            @font-face {
                font-family: 'PersianOnlyFont';
                src: url('data:font/woff2;base64,__FONT_BASE64__') format('woff2');
                font-weight: 100 900;
                unicode-range: ${persianUnicodeRange};
            }

            :root, html, body, #root {
                --font-sans: ${faFontName}, ${enFontStr}ui-sans-serif, system-ui, sans-serif !important;
                --tw-font-sans: ${faFontName}, ${enFontStr}ui-sans-serif, system-ui, sans-serif !important;
            }

            .zcode-rtl-text-node,
            [dir="rtl"],
            [dir="rtl"] p,
            [dir="rtl"] li,
            [dir="rtl"] h1,
            [dir="rtl"] h2,
            [dir="rtl"] h3,
            [dir="rtl"] h4,
            [dir="rtl"] h5,
            [dir="rtl"] h6,
            [dir="rtl"] table,
            [dir="rtl"] th,
            [dir="rtl"] td,
            [dir="rtl"] span,
            [dir="rtl"] a,
            [dir="rtl"] blockquote {
                font-family: ${faFontName}, ${enFontStr}var(--font-sans, ui-sans-serif), "Segoe UI Emoji", sans-serif !important;
            }

            p[dir="rtl"],
            [dir="rtl"] p,
            li[dir="rtl"],
            [dir="rtl"] li,
            td[dir="rtl"],
            [dir="rtl"] td {
                font-size: ${fs}px !important;
                line-height: ${lh} !important;
            }
        `;
        if (isRTL) injectStyle('zcode-rtl-dynamic-style', dynamicCSS);
    }
    updateDynamicCSS(rtlConfig.faFont, rtlConfig.enFont, rtlConfig.codeFont, rtlConfig.lh, rtlConfig.fs);

    function createWidget() {
        if (document.querySelector('.zcode-rtl-widget-container')) return;

        const container = document.createElement('div');
        container.className = 'zcode-rtl-widget-container';

        const panel = document.createElement('div');
        panel.className = 'zcode-rtl-widget-panel zcode-rtl-theme-panel';
        
        const title = document.createElement('div');
        title.style.cssText = 'text-align:center; font-weight:700; font-size:15px; margin-bottom:16px; letter-spacing:0.5px;';
        title.textContent = 'ZCode Pro RTL Settings';
        panel.appendChild(title);

        const trigger = document.createElement('div');
        trigger.className = 'zcode-rtl-widget-trigger';
        trigger.title = 'ZCode RTL (کلیک: تنظیمات | درگ: جابجایی)';
        
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', '#ffffff');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');

        const line1 = document.createElementNS(ns, 'line');
        line1.setAttribute('x1', '21'); line1.setAttribute('y1', '6'); line1.setAttribute('x2', '3'); line1.setAttribute('y2', '6');
        
        const line2 = document.createElementNS(ns, 'line');
        line2.setAttribute('x1', '21'); line2.setAttribute('y1', '12'); line2.setAttribute('x2', '10'); line2.setAttribute('y2', '12');
        
        const line3 = document.createElementNS(ns, 'line');
        line3.setAttribute('x1', '21'); line3.setAttribute('y1', '18'); line3.setAttribute('x2', '6'); line3.setAttribute('y2', '18');
        
        const poly = document.createElementNS(ns, 'polyline');
        poly.setAttribute('points', '10 15 7 12 10 9');

        svg.appendChild(line1);
        svg.appendChild(line2);
        svg.appendChild(line3);
        svg.appendChild(poly);
        
        trigger.appendChild(svg);

        function applyPosition(x, y) {
            const margin = 12;
            const btnSize = 48;
            const maxX = Math.max(margin, window.innerWidth - btnSize - margin);
            const maxY = Math.max(margin, window.innerHeight - btnSize - margin);
            const clampedX = Math.min(Math.max(margin, x), maxX);
            const clampedY = Math.min(Math.max(margin, y), maxY);

            container.style.left = clampedX + 'px';
            container.style.top = clampedY + 'px';
            container.style.right = 'auto';
            container.style.bottom = 'auto';

            const isBottomHalf = clampedY > (window.innerHeight / 2);
            const isRightHalf = clampedX > (window.innerWidth / 2);

            if (isBottomHalf) {
                panel.style.bottom = '54px';
                panel.style.top = 'auto';
            } else {
                panel.style.top = '54px';
                panel.style.bottom = 'auto';
            }

            if (isRightHalf) {
                panel.style.right = '0';
                panel.style.left = 'auto';
                panel.style.transformOrigin = isBottomHalf ? 'bottom right' : 'top right';
                container.style.alignItems = 'flex-end';
            } else {
                panel.style.left = '0';
                panel.style.right = 'auto';
                panel.style.transformOrigin = isBottomHalf ? 'bottom left' : 'top left';
                container.style.alignItems = 'flex-start';
            }

            return { x: clampedX, y: clampedY };
        }

        try {
            const savedPos = JSON.parse(localStorage.getItem('zcode-rtl-widget-pos') || localStorage.getItem('smart-rtl-widget-pos') || 'null');
            if (savedPos && typeof savedPos.x === 'number' && typeof savedPos.y === 'number') {
                applyPosition(savedPos.x, savedPos.y);
            } else {
                applyPosition(window.innerWidth - 64, window.innerHeight - 64);
            }
        } catch (e) {
            applyPosition(window.innerWidth - 64, window.innerHeight - 64);
        }

        window.addEventListener('resize', () => {
            const curX = parseInt(container.style.left, 10) || (window.innerWidth - 64);
            const curY = parseInt(container.style.top, 10) || (window.innerHeight - 64);
            applyPosition(curX, curY);
        });

        let isDragging = false;
        let hasMoved = false;
        let startPointerX = 0, startPointerY = 0;
        let startElemX = 0, startElemY = 0;

        function onPointerDown(e) {
            if (e.button !== undefined && e.button !== 0) return;
            isDragging = true;
            hasMoved = false;
            startPointerX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            startPointerY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

            const rect = container.getBoundingClientRect();
            startElemX = rect.left;
            startElemY = rect.top;

            window.addEventListener('mousemove', onPointerMove, { passive: false });
            window.addEventListener('mouseup', onPointerUp);
            window.addEventListener('touchmove', onPointerMove, { passive: false });
            window.addEventListener('touchend', onPointerUp);
        }

        function onPointerMove(e) {
            if (!isDragging) return;
            const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

            const dx = clientX - startPointerX;
            const dy = clientY - startPointerY;

            if (!hasMoved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
                hasMoved = true;
            }

            if (hasMoved) {
                if (e.cancelable) e.preventDefault();
                applyPosition(startElemX + dx, startElemY + dy);
            }
        }

        function onPointerUp() {
            if (!isDragging) return;
            isDragging = false;

            window.removeEventListener('mousemove', onPointerMove);
            window.removeEventListener('mouseup', onPointerUp);
            window.removeEventListener('touchmove', onPointerMove);
            window.removeEventListener('touchend', onPointerUp);

            if (hasMoved) {
                const finalX = parseInt(container.style.left, 10);
                const finalY = parseInt(container.style.top, 10);
                try {
                    localStorage.setItem('zcode-rtl-widget-pos', JSON.stringify({ x: finalX, y: finalY }));
                } catch (err) {}
            }
        }

        trigger.addEventListener('mousedown', onPointerDown);
        trigger.addEventListener('touchstart', onPointerDown, { passive: true });

        trigger.onclick = (e) => {
            e.stopPropagation();
            if (hasMoved) return;
            panel.classList.toggle('open');
        };

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                panel.classList.remove('open');
            }
        });

        function createRow(labelText, element) {
            const row = document.createElement('div');
            row.className = 'zcode-rtl-row';
            const label = document.createElement('span');
            label.className = 'zcode-rtl-label';
            label.textContent = labelText;
            row.appendChild(label);
            row.appendChild(element);
            return row;
        }

        function createToggle(id, active) {
            const btn = document.createElement('button');
            btn.id = id;
            btn.className = 'zcode-rtl-toggle-btn-reset ' + (active ? 'active' : '');
            const knob = document.createElement('div');
            knob.className = 'zcode-rtl-toggle-knob';
            btn.appendChild(knob);
            return btn;
        }

        function createFontSelector(val, fontList) {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'flex-end';
            wrapper.style.gap = '6px';

            const select = document.createElement('select');
            select.className = 'zcode-rtl-theme-input';
            
            let found = false;
            fontList.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.value;
                opt.textContent = f.label;
                if (val === f.value) { opt.selected = true; found = true; }
                select.appendChild(opt);
            });

            const customOpt = document.createElement('option');
            customOpt.value = '__custom__';
            customOpt.textContent = 'Custom...';
            if (!found && val !== '') { customOpt.selected = true; found = true; }
            select.appendChild(customOpt);

            const customInput = document.createElement('input');
            customInput.type = 'text';
            customInput.className = 'zcode-rtl-theme-input';
            customInput.placeholder = 'e.g. B Yekan';
            customInput.style.display = (select.value === '__custom__') ? 'block' : 'none';
            customInput.value = (!found && val) ? val : '';

            select.onchange = () => {
                customInput.style.display = select.value === '__custom__' ? 'block' : 'none';
            };

            wrapper.appendChild(select);
            wrapper.appendChild(customInput);

            return {
                element: wrapper,
                getValue: () => select.value === '__custom__' ? customInput.value.trim() : select.value,
                onChange: (cb) => { select.addEventListener('change', cb); customInput.addEventListener('input', cb); }
            };
        }

        const faFonts = [
            { label: 'System Default (Vazirmatn)', value: '' },
            { label: 'Vazirmatn', value: 'Vazirmatn' },
            { label: 'IRANSans', value: 'IRANSans' },
            { label: 'IRANSansX', value: 'IRANSansX' },
            { label: 'Shabnam', value: 'Shabnam' },
            { label: 'B Yekan', value: 'B Yekan' },
            { label: 'B Nazanin', value: 'B Nazanin' },
            { label: 'Tahoma', value: 'Tahoma' },
            { label: 'Segoe UI', value: 'Segoe UI' }
        ];

        const enFonts = [
            { label: 'System Default (Sans)', value: '' },
            { label: 'Inter', value: 'Inter' },
            { label: 'Segoe UI', value: 'Segoe UI' },
            { label: 'Arial', value: 'Arial' },
            { label: 'Roboto', value: 'Roboto' },
            { label: 'Open Sans', value: 'Open Sans' },
            { label: 'Consolas', value: 'Consolas' },
            { label: 'Fira Code', value: 'Fira Code' }
        ];

        const toggleBtn = createToggle('zcode-rtl-toggle-btn', isRTL);
        const forceBtn = createToggle('zcode-rtl-force-btn', forceRTL);
        const atBtn = createToggle('zcode-rtl-at-btn', fixAtSign);
        
        const faFontSelector = createFontSelector(rtlConfig.faFont, faFonts);
        const enFontSelector = createFontSelector(rtlConfig.enFont, enFonts);
        
        const fsInput = document.createElement('input');
        fsInput.id = 'zcode-rtl-fs-input';
        fsInput.type = 'number';
        fsInput.min = '10'; fsInput.max = '30'; fsInput.step = '1';
        fsInput.value = rtlConfig.fs;
        fsInput.className = 'zcode-rtl-theme-input';

        const lhInput = document.createElement('input');
        lhInput.id = 'zcode-rtl-lh-input';
        lhInput.type = 'range';
        lhInput.min = '1.2'; lhInput.max = '2.5'; lhInput.step = '0.1';
        lhInput.value = rtlConfig.lh;
        lhInput.className = 'zcode-rtl-theme-input';

        panel.appendChild(createRow('Enable RTL', toggleBtn));
        panel.appendChild(createRow('Force RTL', forceBtn));
        panel.appendChild(createRow('Persian Font', faFontSelector.element));
        panel.appendChild(createRow('English Font', enFontSelector.element));
        panel.appendChild(createRow('Font Size (px)', fsInput));
        panel.appendChild(createRow('Line Height', lhInput));
        panel.appendChild(createRow('Fix @ Sign', atBtn));

        const footer = document.createElement('div');
        footer.style.cssText = 'margin-top:20px; text-align:center; font-size:12px; opacity:0.8; border-top:1px solid rgba(255, 255, 255, 0.1); padding-top:12px; font-family:sans-serif;';
        
        const footerText = document.createTextNode('Developed by ');
        const githubLink = document.createElement('a');
        githubLink.href = 'https://github.com/arian13es';
        githubLink.textContent = 'Arian';
        githubLink.style.cssText = 'color:#38bdf8 !important; text-decoration:none; font-weight:bold; cursor:pointer;';
        
        footer.appendChild(footerText);
        footer.appendChild(githubLink);
        panel.appendChild(footer);

        container.appendChild(panel);
        container.appendChild(trigger);
        document.body.appendChild(container);

        const saveConfig = () => {
            try {
                const conf = {
                    faFont: faFontSelector.getValue(),
                    enFont: enFontSelector.getValue(),
                    codeFont: '',
                    lh: lhInput.value,
                    fs: fsInput.value,
                    isRTL, forceRTL, fixAtSign
                };
                localStorage.setItem('zcode-rtl-config', JSON.stringify(conf));
                localStorage.setItem('smart-rtl-config', JSON.stringify(conf));
            } catch(e) {}
        };

        const onSettingsChange = () => {
            saveConfig();
            if (isRTL) {
                updateDynamicCSS(faFontSelector.getValue(), enFontSelector.getValue(), '', lhInput.value, fsInput.value);
                updateDir();
            }
        };

        toggleBtn.onclick = () => {
            isRTL = !isRTL;
            toggleBtn.className = 'zcode-rtl-toggle-btn-reset ' + (isRTL ? 'active' : '');
            saveConfig();
            if (isRTL) {
                onSettingsChange();
            } else {
                const s = document.getElementById('zcode-rtl-dynamic-style');
                if (s) s.remove();
                document.querySelectorAll('.zcode-rtl-text-node, table, [data-markdown-table-frame], ul, ol').forEach(el => {
                    el.removeAttribute('dir');
                    el.style.removeProperty('text-align');
                    el.style.removeProperty('direction');
                    el.style.removeProperty('unicode-bidi');
                });
            }
        };

        forceBtn.onclick = () => {
            forceRTL = !forceRTL;
            forceBtn.className = 'zcode-rtl-toggle-btn-reset ' + (forceRTL ? 'active' : '');
            saveConfig();
            updateDir();
        };

        atBtn.onclick = () => {
            fixAtSign = !fixAtSign;
            atBtn.className = 'zcode-rtl-toggle-btn-reset ' + (fixAtSign ? 'active' : '');
            saveConfig();
        };

        faFontSelector.onChange(onSettingsChange);
        enFontSelector.onChange(onSettingsChange);
        fsInput.oninput = onSettingsChange;
        lhInput.oninput = onSettingsChange;
    }
    
    if (document.body) createWidget();
    else window.addEventListener('DOMContentLoaded', createWidget);

    function getCleanText(el) {
        let str = '';
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_ACCEPT;
                const tag = parent.tagName;
                if (['CODE', 'PRE', 'KBD', 'SAMP', 'VAR', 'SCRIPT', 'STYLE'].includes(tag)) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (parent.closest('pre, code, .xterm, .terminal-xterm-shell, [class*="terminal"], .monaco-editor, .cm-editor, [data-code-block], .bg-markdown-inline-code, .katex')) {
                    return NodeFilter.FILTER_REJECT;
                }
                // Strictly exclude the prompt composer and Lexical editor from DOM text walker
                if (parent.closest('[data-lexical-editor], [contenteditable="true"], .chat-composer-region, .chat-composer-input-surface, [class*="composer"]')) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        while (walker.nextNode()) {
            str += ' ' + walker.currentNode.nodeValue;
        }
        return str.replace(/[\u200B-\u200F\uFEFF]/g, '').trim();
    }

    function determineDirection(cleanText) {
        if (forceRTL) return 'rtl';
        if (!cleanText) return 'ltr';

        const faMatches = cleanText.match(/[\u0600-\u06FF]/g) || [];
        const enMatches = cleanText.match(/[A-Za-z]/g) || [];
        const faCount = faMatches.length;
        const enCount = enMatches.length;

        if (faCount === 0) return 'ltr';
        if (enCount === 0) return 'rtl';

        // If Persian characters represent a substantial portion (>= 35%)
        if (faCount >= enCount * 0.35) {
            return 'rtl';
        }

        // Check the first letter of the text
        const firstLetter = cleanText.match(/[A-Za-z\u0600-\u06FF]/);
        return firstLetter && /[\u0600-\u06FF]/.test(firstLetter[0]) ? 'rtl' : 'ltr';
    }

    function updateDir() {
        if (!isRTL) return;
        
        // Target block-level elements in chat, streamdown markdown, and tables
        // CRITICAL: NEVER include the chat composer or Lexical editor in DOM mutation queries!
        const blockElements = document.querySelectorAll(`
            p, 
            h1, h2, h3, h4, h5, h6, 
            li, 
            blockquote, 
            table, 
            summary
        `);

        for (let i = 0; i < blockElements.length; i++) {
            const el = blockElements[i];

            // Ignore widget elements
            if (el.closest('.zcode-rtl-widget-container')) continue;

            // Strictly ignore the chat composer and any rich text editor
            if (el.closest('[data-lexical-editor], [contenteditable="true"], .chat-composer-region, .chat-composer-input-surface, [class*="composer"]')) continue;

            // Ignore code blocks, Monaco, terminals, math formulas
            if (el.closest('pre, code, .xterm, .terminal-xterm-shell, [class*="terminal"], .monaco-editor, .cm-editor, [data-code-block], .bg-markdown-inline-code, .katex')) continue;
            if (['PRE', 'CODE', 'INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(el.tagName)) continue;

            // Inside tables: don't individually flip <p> inside cells; table layout governs them uniformly
            if (el.tagName !== 'TABLE' && el.closest('table')) continue;

            // Special handling for tables
            if (el.tagName === 'TABLE') {
                const cleanText = getCleanText(el);
                if (!cleanText) continue;
                const dir = determineDirection(cleanText);
                if (el.getAttribute('dir') !== dir) {
                    el.setAttribute('dir', dir);
                    el.style.setProperty('direction', dir, 'important');
                }
                const frame = el.closest('[data-markdown-table-frame]');
                if (frame && frame.getAttribute('dir') !== dir) {
                    frame.setAttribute('dir', dir);
                    frame.style.setProperty('direction', dir, 'important');
                }
                continue;
            }

            // For text blocks (p, li, headings, blockquote, summary)
            const cleanText = getCleanText(el);
            if (!cleanText) continue;

            const dir = determineDirection(cleanText);

            if (!el.classList.contains('zcode-rtl-text-node')) {
                el.classList.add('zcode-rtl-text-node');
            }

            if (el.getAttribute('dir') !== dir) {
                el.setAttribute('dir', dir);
                el.style.setProperty('text-align', dir === 'rtl' ? 'right' : 'left', 'important');
                el.style.setProperty('direction', dir, 'important');
                el.style.setProperty('unicode-bidi', 'isolate', 'important');

                // If this is an RTL list item, also align its parent list container
                if (el.tagName === 'LI' && dir === 'rtl') {
                    const parentList = el.closest('ul, ol');
                    if (parentList && parentList.getAttribute('dir') !== 'rtl') {
                        parentList.setAttribute('dir', 'rtl');
                    }
                }
            }
        }
    }
    
    let updateDirRAF = null;
    const observer = new MutationObserver((mutations) => {
        if (!isRTL) return;
        let needsUpdate = false;
        for (let i = 0; i < mutations.length; i++) {
            const mut = mutations[i];
            // Skip mutations originating inside the chat composer to eliminate re-renders and composition state locks
            if (mut.target && mut.target.nodeType === Node.ELEMENT_NODE) {
                if (mut.target.closest('[data-lexical-editor], [contenteditable="true"], .chat-composer-region, .chat-composer-input-surface, [class*="composer"]')) {
                    continue;
                }
            }
            if (mut.addedNodes.length > 0 || mut.type === 'characterData') {
                needsUpdate = true;
                break;
            }
        }
        if (needsUpdate) {
            if (updateDirRAF) cancelAnimationFrame(updateDirRAF);
            updateDirRAF = requestAnimationFrame(() => {
                updateDir();
            });
        }
    });
    
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        });
    }

    setInterval(() => {
        if (isRTL) updateDir();
    }, 2000);

    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.code === 'KeyR') { 
            const toggle = document.getElementById('zcode-rtl-toggle-btn');
            if (toggle) toggle.click();
        }
        if (fixAtSign && e.code === 'Digit2' && e.shiftKey) {
            if (e.key === '٬' || e.key === '،') {
                e.preventDefault();
                document.execCommand('insertText', false, '@');
            }
        }
    });

})();
