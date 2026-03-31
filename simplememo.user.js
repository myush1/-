// ==UserScript==
// @name         심플 팝업 메모장
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  장기기억 추가 지원, 사진 삽입 가능
// @author       Assistant & Obsessive UI Designer
// @match        https://crack.wrtn.ai/*
// @license      MIT
// @require      https://cdn.jsdelivr.net/npm/dexie@4.2.1/dist/dexie.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==

(async function() {
    'use strict';

    const SYSTEM_FOLDER_ID = 'folder_long_term';

    if (!document.getElementById('simple-notepad-styles')) {
        const style = document.createElement('style');
        style.id = 'simple-notepad-styles';
        style.innerHTML = `
            :root {
                --sn-bg: #FFFFFF;
                --sn-sidebarBg: #F9F9F9;
                --sn-listItemBg: transparent;
                --sn-listItemSelectedBg: #EAEAEA;
                --sn-folderBg: transparent;
                --sn-searchWrapBg: #F9F9F9;
                --sn-border: #E5E5EA;
                --sn-textTitle: #1C1C1E;
                --sn-textMain: #3A3A3C;
                --sn-textDesc: #8E8E93;
                --sn-subText: #AEAEB2;
                --sn-accent: #FF4432;
                --sn-accentHover: rgba(255, 68, 50, 0.1);
                --sn-danger: #FF3B30;
                --sn-dangerHover: rgba(255, 59, 48, 0.08);
                --sn-shadow: 0 10px 40px -10px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1);
            }
            @media (prefers-color-scheme: dark) {
                :root {
                    --sn-bg: #1C1C1E;
                    --sn-sidebarBg: #2C2C2E;
                    --sn-listItemBg: transparent;
                    --sn-listItemSelectedBg: #3A3A3C;
                    --sn-folderBg: transparent;
                    --sn-searchWrapBg: #2C2C2E;
                    --sn-border: #38383A;
                    --sn-textTitle: #F2F2F7;
                    --sn-textMain: #EBEBF5;
                    --sn-textDesc: #8E8E93;
                    --sn-subText: #636366;
                    --sn-accent: #FF4432;
                    --sn-accentHover: rgba(255, 68, 50, 0.2);
                    --sn-danger: #FF453A;
                    --sn-dangerHover: rgba(255, 69, 58, 0.15);
                    --sn-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.1);
                }
            }
            body[data-theme="dark"] {
                --sn-bg: #1C1C1E !important; --sn-sidebarBg: #2C2C2E !important;
                --sn-listItemBg: transparent !important; --sn-listItemSelectedBg: #3A3A3C !important;
                --sn-folderBg: transparent !important; --sn-searchWrapBg: #2C2C2E !important;
                --sn-border: #38383A !important; --sn-textTitle: #F2F2F7 !important;
                --sn-textMain: #EBEBF5 !important; --sn-textDesc: #8E8E93 !important;
                --sn-subText: #636366 !important;
                --sn-accent: #FF4432 !important; --sn-accentHover: rgba(255, 68, 50, 0.2) !important;
                --sn-danger: #FF453A !important; --sn-dangerHover: rgba(255, 69, 58, 0.15) !important;
                --sn-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.1) !important;
            }
            body[data-theme="light"] {
                --sn-bg: #FFFFFF !important; --sn-sidebarBg: #F9F9F9 !important;
                --sn-listItemBg: transparent !important; --sn-listItemSelectedBg: #EAEAEA !important;
                --sn-folderBg: transparent !important; --sn-searchWrapBg: #F9F9F9 !important;
                --sn-border: #E5E5EA !important; --sn-textTitle: #1C1C1E !important;
                --sn-textMain: #3A3A3C !important; --sn-textDesc: #8E8E93 !important;
                --sn-subText: #AEAEB2 !important;
                --sn-accent: #FF4432 !important; --sn-accentHover: rgba(255, 68, 50, 0.1) !important;
                --sn-danger: #FF3B30 !important; --sn-dangerHover: rgba(255, 59, 48, 0.08) !important;
                --sn-shadow: 0 10px 40px -10px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1) !important;
            }

            #simple-notepad-popup * {
                box-sizing: border-box;
                font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                -webkit-font-smoothing: antialiased;
            }

            .simple-notepad-editor:empty:before { content: attr(placeholder); color: var(--sn-subText); pointer-events: none; display: block; white-space: pre-wrap; font-size: 15px; line-height: 1.6; }
            .simple-notepad-editor img { max-width: 100%; border-radius: 8px; margin: 12px 0; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .simple-notepad-editor:focus { outline: none; }

            #simple-notepad-popup ::-webkit-scrollbar { width: 4px; height: 4px; }
            #simple-notepad-popup ::-webkit-scrollbar-track { background: transparent; }
            #simple-notepad-popup ::-webkit-scrollbar-thumb { background: var(--sn-border); border-radius: 4px; transition: background 0.2s; }
            #simple-notepad-popup ::-webkit-scrollbar-thumb:hover { background: var(--sn-subText); }

            .sn-hoverable:active { background-color: var(--sn-listItemSelectedBg) !important; opacity: 0.8; }

            .sn-icon-btn { cursor:pointer; color:var(--sn-textTitle); padding:6px; border-radius:8px; display:flex; align-items:center; justify-content:center; transition: all 0.2s ease; }
            .sn-icon-btn:active { background-color: rgba(120, 120, 128, 0.12); transform: scale(0.95); }
        `;
        document.head.appendChild(style);
    }

    const Icons = {
        menu: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
        newNote: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
        close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        pin: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5l1.5 3.5h-9L9 10.5z"/></svg>`,
        pinOutline: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5l1.5 3.5h-9L9 10.5z"/></svg>`,
        trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
        chevronDown: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
        chevronRight: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
        plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
        photo: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
    };

    const API_BASE = 'https://crack-api.wrtn.ai/crack-gen/v3/chats';

    function getChatId() { const m = location.pathname.match(/\/episodes\/([a-f0-9]+)/); return m ? m[1] : null; }
    function getToken() { const m = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/); return m ? m[1] : null; }

    function apiCall(method, path, body) {
        const token = getToken(), chatId = getChatId();
        if (!token || !chatId) { alert('인증 정보 또는 채팅 ID를 찾을 수 없습니다.'); return Promise.resolve(null); }
        const opts = { method, headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        return fetch(API_BASE + '/' + chatId + path, opts)
            .then(r => r.ok ? r.text().then(t => t ? JSON.parse(t) : { result: 'SUCCESS' }) : null)
            .catch(e => { alert('네트워크 오류'); return null; });
    }

    const db = new Dexie("SimpleNotepadDB");
    db.version(1).stores({ notepadData: 'id' });

    let appData = { notes: [], folders: [] };
    let popupPos = { left: '50px', top: '100px', width: '600px', height: '600px' };
    let currentNoteId = null;
    let isSidebarOpen = true;
    let isFocusMode = false;
    let searchQuery = "";
    let isSelectMode = false;
    let selectedNoteIds = new Set();

    async function fetchKey(id, def) {
        try {
            let record = await db.notepadData.get(id);
            if (record) return record.data;
            let val = GM_getValue(id);
            if (val !== undefined && val !== null) {
                try { val = typeof val === 'string' ? JSON.parse(val) : val; } catch(e){}
                await db.notepadData.put({ id: id, data: val }); return val;
            }
            return def;
        } catch(e) { return def; }
    }

    function saveToDB(id, data) { db.notepadData.put({ id: id, data: data }).catch(e => {}); }
    function saveData() { saveToDB('my_notepad_data_v2', appData); }

    let rawDataV2 = await fetchKey('my_notepad_data_v2', null);
    if (rawDataV2) {
        appData = rawDataV2;
        if (appData.isRootOpen === undefined) appData.isRootOpen = true;
        appData.notes.forEach(n => { if (n.isTrashed === undefined) n.isTrashed = false; });
        appData.folders.forEach(f => { if (f.parentId === undefined) f.parentId = null; delete f.emoji; });
    }

    if (!appData.folders.find(f => f.id === SYSTEM_FOLDER_ID)) {
        appData.folders.unshift({ id: SYSTEM_FOLDER_ID, name: "장기 기억", isOpen: true, parentId: null, isSystem: true });
        saveData();
    }

    popupPos = await fetchKey('my_notepad_pos_v2', popupPos);

    const nonTrashedNotes = appData.notes.filter(n => !n.isTrashed);
    if (nonTrashedNotes.length > 0) {
        currentNoteId = nonTrashedNotes.sort((a,b) => b.updatedAt - a.updatedAt)[0].id;
    }

    function initNotepad() {
        if (document.getElementById('simple-notepad-popup')) return;

        const popup = document.createElement('div');
        popup.id = 'simple-notepad-popup';
        Object.assign(popup.style, {
            position: 'fixed', left: popupPos.left, top: popupPos.top,
            width: popupPos.width, height: popupPos.height,
            minWidth: '350px', minHeight: '350px',
            backgroundColor: 'var(--sn-bg)', color: 'var(--sn-textTitle)', borderRadius: '16px',
            boxShadow: 'var(--sn-shadow)', border: '1px solid rgba(128,128,128,0.1)',
            zIndex: '2147483645', display: 'none', flexDirection: 'column', overflow: 'hidden'
        });

        let isDragging = false, dragStartX, dragStartY, initialLeft, initialTop;
        const startDrag = (x, y, cursorElement) => {
            isDragging = true;
            if (cursorElement) cursorElement.style.cursor = 'grabbing';
            dragStartX = x; dragStartY = y;
            const rect = popup.getBoundingClientRect();
            initialLeft = rect.left; initialTop = rect.top;
        };
        const moveDrag = (x, y) => {
            if (!isDragging) return;
            popup.style.left = `${Math.max(0, Math.min(initialLeft + (x - dragStartX), window.innerWidth - popup.offsetWidth))}px`;
            popup.style.top = `${Math.max(0, Math.min(initialTop + (y - dragStartY), window.innerHeight - popup.offsetHeight))}px`;
        };
        const stopDrag = (cursorElement) => {
            if (isDragging) {
                isDragging = false;
                if (cursorElement) cursorElement.style.cursor = 'grab';
                popupPos.left = popup.style.left; popupPos.top = popup.style.top;
                saveToDB('my_notepad_pos_v2', popupPos);
            }
        };

        const header = document.createElement('div');
        header.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid var(--sn-border); cursor:grab; user-select:none; background:var(--sn-bg); touch-action:none;`;

        const headerLeft = document.createElement('div');
        headerLeft.style.cssText = "display:flex; align-items:center; gap:12px;";

        const menuBtn = document.createElement('div');
        menuBtn.className = 'sn-icon-btn';
        menuBtn.innerHTML = Icons.menu;
        menuBtn.onclick = (e) => { e.stopPropagation(); isSidebarOpen = !isSidebarOpen; renderBody(); };

        const headerTitle = document.createElement('div');
        headerTitle.innerText = "메모장";
        headerTitle.style.cssText = `font-weight:600; font-size:16px; color:var(--sn-textTitle); pointer-events:none; letter-spacing:-0.3px;`;

        headerLeft.append(menuBtn, headerTitle);

        const headerRight = document.createElement('div');
        headerRight.style.cssText = "display:flex; align-items:center; gap:6px;";

        const folderSelect = document.createElement('select');
        folderSelect.style.cssText = `
            appearance: none; -webkit-appearance: none; background: var(--sn-listItemSelectedBg);
            color: var(--sn-textTitle); border: none; border-radius: 8px;
            padding: 6px 28px 6px 28px; font-size: 13px; font-weight: 500; outline: none; cursor: pointer; max-width: 150px;
            text-align: center; text-align-last: center;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='gray' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat; background-position: right 8px center; margin-right: 4px;
        `;

        const newNoteBtn = document.createElement('div');
        newNoteBtn.className = 'sn-icon-btn';
        newNoteBtn.innerHTML = Icons.newNote;
        newNoteBtn.onclick = () => {
            const currentFolder = folderSelect.value === "root" ? null : folderSelect.value;
            const newNote = { id: 'note_' + Date.now(), title: "", content: "", folderId: currentFolder, updatedAt: Date.now(), isPinned: false, isTrashed: false };
            appData.notes.unshift(newNote);
            currentNoteId = newNote.id; isSelectMode = false; selectedNoteIds.clear();
            saveData(); renderBody();
        };

        const closeBtn = document.createElement('div');
        closeBtn.className = 'sn-icon-btn';
        closeBtn.innerHTML = Icons.close;
        closeBtn.onclick = () => popup.style.display = 'none';

        headerRight.append(folderSelect, newNoteBtn, closeBtn);
        header.append(headerLeft, headerRight);
        popup.appendChild(header);

        header.addEventListener('mousedown', (e) => { if (e.target.closest('select') || e.target.closest('.sn-icon-btn') || e.target.closest('label')) return; startDrag(e.clientX, e.clientY, header); });
        document.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY)); document.addEventListener('mouseup', () => stopDrag(header));
        header.addEventListener('touchstart', (e) => { if (e.target.closest('select') || e.target.closest('.sn-icon-btn') || e.target.closest('label')) return; startDrag(e.touches[0].clientX, e.touches[0].clientY, header); }, {passive: false});
        document.addEventListener('touchmove', (e) => { if(isDragging) { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); } }, {passive: false}); document.addEventListener('touchend', () => stopDrag(header));

        const bodyContainer = document.createElement('div');
        bodyContainer.style.cssText = "display:flex; flex:1; min-height:0; position:relative;";
        popup.appendChild(bodyContainer);

        const sidebar = document.createElement('div');
        // 변경점: max-width 65%, flex-shrink 0 추가
        sidebar.style.cssText = `width:260px; max-width:65%; flex-shrink:0; background:var(--sn-sidebarBg); border-right:1px solid var(--sn-border); display:none; flex-direction:column; overflow:hidden;`;

        const searchWrap = document.createElement('div');
        searchWrap.style.cssText = `display:flex; align-items:center; gap:8px; padding: 12px 14px; border-bottom: 1px solid var(--sn-border); background: var(--sn-searchWrapBg); flex-shrink:0;`;

        const searchInput = document.createElement('input');
        searchInput.placeholder = "검색";
        searchInput.style.cssText = `flex:1; padding: 8px 12px; background: rgba(120,120,128,0.12); border: none; border-radius: 10px; color: var(--sn-textTitle); font-size: 13px; outline: none; min-width:0; transition: background 0.2s;`;
        searchInput.addEventListener('focus', () => searchInput.style.background = 'rgba(120,120,128,0.2)');
        searchInput.addEventListener('blur', () => searchInput.style.background = 'rgba(120,120,128,0.12)');
        searchInput.oninput = (e) => { searchQuery = e.target.value.toLowerCase(); renderBody(); };

        const selectModeBtn = document.createElement('div');
        selectModeBtn.style.cssText = `cursor:pointer; font-size:13px; color:var(--sn-accent); font-weight:600; white-space:nowrap; padding:6px; transition: opacity 0.2s;`;
        selectModeBtn.onclick = () => { isSelectMode = !isSelectMode; selectedNoteIds.clear(); renderBody(); };

        searchWrap.append(searchInput, selectModeBtn);
        sidebar.appendChild(searchWrap);

        const listWrapper = document.createElement('div');
        listWrapper.style.cssText = "flex:1; overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; display:flex; flex-direction:column; background:transparent; padding: 6px 0;";
        sidebar.appendChild(listWrapper);

        const bottomWrapper = document.createElement('div');
        bottomWrapper.id = 'sn-bottom-wrapper';
        bottomWrapper.style.cssText = "display:flex; flex-direction:column; flex-shrink:0; width: 100%;";
        sidebar.appendChild(bottomWrapper);

        const editor = document.createElement('div');
        editor.style.cssText = `flex:1; display:flex; flex-direction:column; background:var(--sn-bg); padding:16px 16px; min-width:0; position:relative;`;

        bodyContainer.append(sidebar, editor);
        document.body.appendChild(popup);

        const resizer = document.createElement('div');
        resizer.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15l-6 6 M21 8l-13 13"></path></svg>`;
        resizer.style.cssText = `position:absolute; right:0; bottom:0; width:20px; height:20px; cursor:nwse-resize; color:var(--sn-subText); display:flex; justify-content:center; align-items:center; z-index:10; user-select:none; opacity:0.5; padding-right:4px; padding-bottom:4px;`;
        bodyContainer.appendChild(resizer);

        let isResizing = false, resizeStartX, resizeStartY, initialWidth, initialHeight;
        const startResize = (x, y) => { isResizing = true; resizeStartX = x; resizeStartY = y; initialWidth = popup.offsetWidth; initialHeight = popup.offsetHeight; };
        const moveResize = (x, y) => { if (!isResizing) return; popup.style.width = `${Math.max(350, initialWidth + (x - resizeStartX))}px`; popup.style.height = `${Math.max(350, initialHeight + (y - resizeStartY))}px`; };
        const stopResize = () => { if (isResizing) { isResizing = false; popupPos.width = popup.style.width; popupPos.height = popup.style.height; saveToDB('my_notepad_pos_v2', popupPos); } };

        resizer.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); startResize(e.clientX, e.clientY); });
        document.addEventListener('mousemove', (e) => moveResize(e.clientX, e.clientY)); document.addEventListener('mouseup', stopResize);
        resizer.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); startResize(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
        document.addEventListener('touchmove', (e) => { if(isResizing) { e.preventDefault(); moveResize(e.touches[0].clientX, e.touches[0].clientY); } }, {passive: false}); document.addEventListener('touchend', stopResize);

        let saveTimeout = null;

        const FOLDER_TITLE_STYLE = `font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; letter-spacing:-0.2px; line-height:1; display:flex; align-items:center;`;
        const FOLDER_COUNT_STYLE = `font-size:11px; color:var(--sn-subText); font-weight:500; flex-shrink:0; margin-left:6px; line-height:1; display:flex; align-items:center;`;

        const createDivider = () => {
            const divider = document.createElement('div');
            divider.style.cssText = "height:1px; background:var(--sn-border); margin: 6px 14px; opacity:0.5; flex-shrink:0;";
            return divider;
        };

        const renderNoteItem = (note, container, depth = 0, isTrashMode = false) => {
            const nItem = document.createElement('div');
            nItem.className = 'sn-hoverable';
            const isSelected = (note.id === currentNoteId);
            const paddingLeft = 14 + (depth * 14);

            nItem.style.cssText = `padding: 10px 14px 10px ${paddingLeft}px; cursor:pointer; background: ${isSelected && !isSelectMode ? 'var(--sn-listItemSelectedBg)' : 'transparent'}; display:flex; justify-content:space-between; align-items:center; gap:8px; border-radius: 6px; margin: 2px 8px; transition: background 0.15s ease;`;

            const titleWrap = document.createElement('div');
            titleWrap.style.cssText = "display:flex; align-items:center; gap:10px; overflow:hidden; flex:1;";

            if (isSelectMode) {
                const isChecked = selectedNoteIds.has(note.id);
                const checkBox = document.createElement('div');
                checkBox.style.cssText = `width:18px; height:18px; border-radius:50%; border:1.5px solid ${isChecked ? 'var(--sn-accent)' : 'var(--sn-subText)'}; background:${isChecked ? 'var(--sn-accent)' : 'transparent'}; display:flex; justify-content:center; align-items:center; flex-shrink:0; transition:all 0.1s;`;
                if (isChecked) checkBox.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                titleWrap.appendChild(checkBox);
            }

            const titleSpan = document.createElement('span');
            titleSpan.id = `sidebar-note-${note.id}`;
            const displayTitle = note.title && note.title.trim() !== '' ? note.title : '제목 없음';
            titleSpan.innerText = displayTitle;
            titleSpan.style.cssText = `font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:${note.isPinned ? '600' : '400'}; ${isTrashMode ? 'text-decoration: line-through; color:var(--sn-subText);' : 'color:var(--sn-textTitle);'} letter-spacing: -0.2px;`;

            titleWrap.appendChild(titleSpan);
            nItem.appendChild(titleWrap);

            if (!isSelectMode) {
                const actionSpan = document.createElement('span');
                actionSpan.style.cssText = "display:flex; gap:2px; align-items:center;";

                if (!isTrashMode) {
                    const pinBtn = document.createElement('div');
                    pinBtn.className = 'sn-icon-btn';

                    pinBtn.style.cssText = `padding: 4px; opacity: ${(isSelected || note.isPinned) ? '1' : '0'};`;
                    pinBtn.style.color = note.isPinned ? 'var(--sn-textTitle)' : 'var(--sn-subText)';
                    pinBtn.innerHTML = note.isPinned ? Icons.pin : Icons.pinOutline;

                    pinBtn.onclick = (e) => { e.stopPropagation(); note.isPinned = !note.isPinned; saveData(); renderBody(); };

                    const nDelBtn = document.createElement('div');
                    nDelBtn.className = 'sn-icon-btn';
                    nDelBtn.innerHTML = Icons.trash;
                    nDelBtn.style.cssText = `color:var(--sn-subText); padding:4px; display:${isSelected ? 'flex' : 'none'};`;
                    nDelBtn.onclick = (e) => { e.stopPropagation(); note.isTrashed = true; if(currentNoteId === note.id) currentNoteId = null; saveData(); renderBody(); };

                    actionSpan.append(pinBtn, nDelBtn);
                }
                nItem.appendChild(actionSpan);
                nItem.onclick = () => { currentNoteId = note.id; if (window.innerWidth < 768) isSidebarOpen = false; renderBody(); };
            } else {
                nItem.onclick = (e) => { e.stopPropagation(); if (selectedNoteIds.has(note.id)) selectedNoteIds.delete(note.id); else selectedNoteIds.add(note.id); renderBody(); };
            }
            container.appendChild(nItem);
        };

        const sortNotes = (arr) => arr.sort((a, b) => { if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1; return b.updatedAt - a.updatedAt; });
        const getDescendantFolderIds = (folderId) => { let ids = [folderId]; appData.folders.filter(f => f.parentId === folderId).forEach(child => { ids = ids.concat(getDescendantFolderIds(child.id)); }); return ids; };

        const renderBody = () => {
            selectModeBtn.innerText = isSelectMode ? "완료" : "선택";
            let activeNote = appData.notes.find(n => n.id === currentNoteId);

            header.style.display = isFocusMode ? 'none' : 'flex';
            sidebar.style.display = (isSidebarOpen && !isFocusMode) ? 'flex' : 'none';

            folderSelect.innerHTML = '';
            if (activeNote && !activeNote.isTrashed && !isSelectMode) {
                folderSelect.style.display = "block";
                const rootOpt = document.createElement('option'); rootOpt.value = "root"; rootOpt.innerText = "모든 메모"; folderSelect.appendChild(rootOpt);

                const buildFolderOptions = (parentId, depth) => {
                    const childFolders = appData.folders.filter(f => f.parentId === parentId);
                    childFolders.sort((a, b) => (b.id === SYSTEM_FOLDER_ID ? 1 : a.id === SYSTEM_FOLDER_ID ? -1 : 0));
                    childFolders.forEach(f => {
                        const opt = document.createElement('option'); opt.value = f.id;
                        opt.innerText = `${"\u00A0\u00A0".repeat(depth)}${depth > 0 ? '↳ ' : ''}${f.name}`;
                        folderSelect.appendChild(opt); buildFolderOptions(f.id, depth + 1);
                    });
                };
                buildFolderOptions(null, 0);

                folderSelect.value = activeNote.folderId || "root";
                folderSelect.onchange = (e) => { activeNote.folderId = (e.target.value === "root") ? null : e.target.value; saveData(); renderBody(); };
            } else { folderSelect.style.display = "none"; }

            listWrapper.innerHTML = '';

            const validNotes = appData.notes.filter(n => !n.isTrashed);
            const trashedNotes = appData.notes.filter(n => n.isTrashed);

            if (searchQuery.trim() !== "") {
                const searchResults = validNotes.filter(n => (n.title && n.title.toLowerCase().includes(searchQuery)) || (n.content && n.content.toLowerCase().includes(searchQuery)));
                const sHeader = document.createElement('div');
                sHeader.style.cssText = `padding: 10px 16px 4px; color:var(--sn-subText); font-weight:600; font-size:11px; flex-shrink:0; letter-spacing:0.5px;`;
                sHeader.innerHTML = `검색 결과 <span style="font-weight:normal;">(${searchResults.length})</span>`;
                listWrapper.appendChild(sHeader);
                sortNotes(searchResults).forEach(note => renderNoteItem(note, listWrapper, 0));
            }
            else {
                const renderSingleFolder = (folder, container, depth) => {
                    const folderNotes = sortNotes(validNotes.filter(n => n.folderId === folder.id));
                    const descendantIds = getDescendantFolderIds(folder.id);
                    const totalNotesCount = validNotes.filter(n => descendantIds.includes(n.folderId)).length;

                    const fHeader = document.createElement('div');
                    const isSystemFolder = folder.id === SYSTEM_FOLDER_ID;
                    fHeader.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding: 8px 14px 8px ${14 + (depth * 14)}px; cursor:pointer; background:transparent; flex-shrink:0; margin: 0 4px; border-radius: 6px;`;
                    fHeader.className = 'sn-hoverable';

                    const fTitleWrap = document.createElement('div');
                    fTitleWrap.style.cssText = "display:flex; align-items:center; overflow:hidden; white-space:nowrap; flex:1; gap:6px;";

                    const fToggle = document.createElement('div');
                    fToggle.innerHTML = folder.isOpen ? Icons.chevronDown : Icons.chevronRight;
                    fToggle.style.cssText = `color:var(--sn-subText); display:flex; align-items:center; justify-content:center; width:16px; height:16px; flex-shrink:0; opacity:0.7;`;

                    const fName = document.createElement('span');
                    fName.style.cssText = `${FOLDER_TITLE_STYLE} color:${isSystemFolder ? 'var(--sn-accent)' : 'var(--sn-textMain)'};`;
                    fName.innerText = folder.name;

                    if (!isSystemFolder && !isSelectMode) {
                        fName.onclick = (e) => {
                            e.stopPropagation();
                            const newName = prompt("폴더 이름을 수정하세요:", folder.name);
                            if (newName && newName.trim() !== '') { folder.name = newName.trim(); saveData(); renderBody(); }
                        };
                    }

                    const fCount = document.createElement('span');
                    fCount.style.cssText = FOLDER_COUNT_STYLE;
                    fCount.innerText = totalNotesCount > 0 ? totalNotesCount : '';

                    fTitleWrap.append(fToggle, fName, fCount);

                    const fControls = document.createElement('div');
                    fControls.style.cssText = "display:flex; align-items:center; gap:2px; flex-shrink:0; opacity:0.5;";

                    if (!isSystemFolder && !isSelectMode) {
                        const fAddSubBtn = document.createElement('div');
                        fAddSubBtn.innerHTML = Icons.plus; fAddSubBtn.className = 'sn-icon-btn'; fAddSubBtn.style.padding = '4px';
                        fAddSubBtn.onclick = (e) => { e.stopPropagation(); const name = prompt(`'${folder.name}' 안에 만들 새 폴더 이름:`, "새 하위 폴더"); if (name) { appData.folders.push({ id: 'folder_' + Date.now(), name: name, isOpen: true, parentId: folder.id }); folder.isOpen = true; saveData(); renderBody(); } };

                        const fDelBtn = document.createElement('div');
                        fDelBtn.innerHTML = Icons.trash; fDelBtn.className = 'sn-icon-btn'; fDelBtn.style.padding = '4px';
                        fDelBtn.onclick = (e) => { e.stopPropagation(); if(confirm(`'${folder.name}' 폴더를 삭제할까요?\n(하위 폴더는 상위로 이동하며, 메모는 휴지통으로 이동합니다)`)) { appData.notes.forEach(n => { if(n.folderId === folder.id) n.isTrashed = true; }); appData.folders.forEach(f => { if(f.parentId === folder.id) f.parentId = folder.parentId; }); appData.folders = appData.folders.filter(f => f.id !== folder.id); saveData(); renderBody(); } };
                        fControls.append(fAddSubBtn, fDelBtn);
                    }

                    fHeader.append(fTitleWrap, fControls);
                    fHeader.onclick = () => { folder.isOpen = !folder.isOpen; saveData(); renderBody(); };
                    container.appendChild(fHeader);

                    if (folder.isOpen) {
                        const childFolders = appData.folders.filter(f => f.parentId === folder.id).sort((a, b) => (a.id === SYSTEM_FOLDER_ID ? -1 : b.id === SYSTEM_FOLDER_ID ? 1 : 0));
                        childFolders.forEach(child => renderSingleFolder(child, container, depth + 1));
                        folderNotes.forEach(note => renderNoteItem(note, container, depth + 1));
                    }
                };

                const ltFolder = appData.folders.find(f => f.id === SYSTEM_FOLDER_ID);
                let ltDescendantIds = [];
                if (ltFolder) {
                    ltDescendantIds = getDescendantFolderIds(ltFolder.id);
                    renderSingleFolder(ltFolder, listWrapper, 0);
                    listWrapper.appendChild(createDivider());
                }

                const rootNotes = sortNotes(validNotes.filter(n => !n.folderId));
                const allMemCount = validNotes.filter(n => !ltDescendantIds.includes(n.folderId)).length;

                const rootHeader = document.createElement('div');
                rootHeader.className = 'sn-hoverable';
                rootHeader.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding: 8px 14px; cursor:pointer; background:transparent; flex-shrink:0; margin: 0 4px; border-radius: 6px;`;

                const rTitleWrap = document.createElement('div');
                rTitleWrap.style.cssText = "display:flex; align-items:center; gap:6px;";

                const rToggle = document.createElement('div');
                rToggle.innerHTML = appData.isRootOpen ? Icons.chevronDown : Icons.chevronRight;
                rToggle.style.cssText = `color:var(--sn-subText); display:flex; align-items:center; justify-content:center; width:16px; height:16px; opacity:0.7;`;

                rTitleWrap.innerHTML = `
                    ${rToggle.outerHTML}
                    <span style="${FOLDER_TITLE_STYLE} color:var(--sn-textMain);">모든 메모</span>
                    <span style="${FOLDER_COUNT_STYLE}">${allMemCount > 0 ? allMemCount : ''}</span>
                `;

                rootHeader.append(rTitleWrap);
                rootHeader.onclick = () => { appData.isRootOpen = !appData.isRootOpen; saveData(); renderBody(); };
                listWrapper.appendChild(rootHeader);

                if (appData.isRootOpen) rootNotes.forEach(note => renderNoteItem(note, listWrapper, 1));

                const rootFolders = appData.folders.filter(f => f.parentId === null && f.id !== SYSTEM_FOLDER_ID);
                if (rootFolders.length > 0) {
                    listWrapper.appendChild(createDivider());
                }

                rootFolders.forEach(folder => renderSingleFolder(folder, listWrapper, 0));
            }

            bottomWrapper.innerHTML = '';

            const bottomBar = document.createElement('div');
            bottomBar.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding: 12px 16px; border-top: 1px solid var(--sn-border); background: var(--sn-searchWrapBg); flex-shrink:0;`;

            if (isSelectMode) {
                const countText = document.createElement('span');
                countText.innerText = `${selectedNoteIds.size}개 선택됨`;
                countText.style.cssText = `font-size:13px; color:var(--sn-textTitle); font-weight:600;`;

                const delBtn = document.createElement('span');
                delBtn.innerText = "삭제";
                const canDelete = selectedNoteIds.size > 0;
                delBtn.style.cssText = `font-size:14px; color:${canDelete ? 'var(--sn-danger)' : 'var(--sn-subText)'}; font-weight:600; cursor:${canDelete ? 'pointer' : 'default'}; transition: opacity 0.2s;`;

                delBtn.onclick = () => {
                    if (!canDelete) return;
                    if (confirm(`선택한 ${selectedNoteIds.size}개의 메모를 삭제하시겠습니까?`)) {
                        appData.notes.forEach(n => {
                            if (selectedNoteIds.has(n.id)) {
                                if(n.isTrashed) appData.notes = appData.notes.filter(an => an.id !== n.id);
                                else n.isTrashed = true;
                                if(currentNoteId === n.id) currentNoteId = null;
                            }
                        });
                        isSelectMode = false; selectedNoteIds.clear(); saveData(); renderBody();
                    }
                };
                bottomBar.append(countText, delBtn);
                bottomWrapper.appendChild(bottomBar);

            } else {
                if (appData.isTrashOpen && trashedNotes.length > 0) {
                    const trashListWrap = document.createElement('div');
                    trashListWrap.style.cssText = `background: var(--sn-sidebarBg); border-top:1px solid var(--sn-border); flex-shrink:0; max-height: 150px; overflow-y:auto; padding: 6px 0; border-bottom: 1px solid var(--sn-border);`;

                    const emptyTrashBtn = document.createElement('div');
                    emptyTrashBtn.innerText = "휴지통 비우기";
                    emptyTrashBtn.style.cssText = `font-size:11px; padding:6px; margin: 0 14px 6px; text-align:center; color: var(--sn-danger); background: var(--sn-dangerHover); border-radius:6px; cursor:pointer; font-weight:600;`;
                    emptyTrashBtn.onclick = (e) => {
                        e.stopPropagation();
                        if(confirm(`휴지통에 있는 ${trashedNotes.length}개의 메모를 모두 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
                            appData.notes = appData.notes.filter(n => !n.isTrashed);
                            if (activeNote && activeNote.isTrashed) currentNoteId = null;
                            saveData(); renderBody();
                        }
                    };
                    trashListWrap.appendChild(emptyTrashBtn);
                    sortNotes(trashedNotes).forEach(note => renderNoteItem(note, trashListWrap, 0, true));
                    bottomWrapper.appendChild(trashListWrap);
                }

                const addFolderWrap = document.createElement('div');
                addFolderWrap.style.cssText = "display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--sn-textMain); opacity:0.8; transition: opacity 0.2s;";
                addFolderWrap.innerHTML = `${Icons.plus} <span style="font-size:13px; font-weight:500;">새 폴더</span>`;
                addFolderWrap.onclick = () => { const name = prompt("새 폴더 이름을 입력하세요", "새 폴더"); if (name) { appData.folders.push({ id: 'folder_' + Date.now(), name: name, isOpen: true, parentId: null }); saveData(); renderBody(); } };

                const trashWrap = document.createElement('div');
                trashWrap.style.cssText = `display:flex; align-items:center; gap:6px; cursor:pointer; color:${appData.isTrashOpen ? 'var(--sn-danger)' : 'var(--sn-subText)'}; transition: color 0.2s;`;
                trashWrap.innerHTML = `${Icons.trash} <span style="font-size:13px; font-weight:500;">휴지통 ${trashedNotes.length > 0 ? `(${trashedNotes.length})` : ''}</span>`;
                trashWrap.onclick = () => { appData.isTrashOpen = !appData.isTrashOpen; renderBody(); };

                bottomBar.append(addFolderWrap, trashWrap);
                bottomWrapper.appendChild(bottomBar);
            }

            editor.innerHTML = '';

            if (isSelectMode) {
                const emptyState = document.createElement('div');
                emptyState.style.cssText = "flex:1; display:flex; justify-content:center; align-items:center; color:var(--sn-subText); font-size:15px; flex-direction:column; gap:12px; font-weight:500;";
                emptyState.innerHTML = `<div>메모 선택 중...</div>`;
                editor.appendChild(emptyState);
                return;
            }

            if (activeNote) {
                const isTrashed = activeNote.isTrashed;
                const isLongTermMode = (activeNote.folderId === SYSTEM_FOLDER_ID);

                const focusTopBar = document.createElement('div');
                focusTopBar.title = "드래그하여 이동, 클릭하여 복구";
                focusTopBar.style.cssText = `display:${isFocusMode ? 'flex' : 'none'}; justify-content:center; align-items:center; width:100%; height:24px; cursor:grab; flex-shrink:0; background:transparent; touch-action:none; margin-bottom:8px;`;

                const focusPill = document.createElement('div');
                focusPill.style.cssText = `width:36px; height:5px; background:var(--sn-border); border-radius:3px; transition:background 0.2s;`;
                focusTopBar.appendChild(focusPill);

                focusTopBar.onmouseenter = () => focusPill.style.background = 'var(--sn-subText)';
                focusTopBar.onmouseleave = () => focusPill.style.background = 'var(--sn-border)';

                let fStartY = 0, fStartX = 0, fIsDragging = false;
                const onFDown = (x, y) => { fStartX = x; fStartY = y; fIsDragging = false; startDrag(x, y, focusTopBar); };
                const onFMove = (x, y) => { if (!fStartY) return; if (Math.abs(y - fStartY) > 3 || Math.abs(x - fStartX) > 3) fIsDragging = true; };
                const onFUp = () => {
                    if (fStartY && !fIsDragging) { isFocusMode = false; renderBody(); }
                    fStartY = 0; fIsDragging = false; stopDrag(focusTopBar);
                };

                focusTopBar.addEventListener('touchstart', (e) => onFDown(e.touches[0].clientX, e.touches[0].clientY), {passive: true});
                focusTopBar.addEventListener('touchmove', (e) => onFMove(e.touches[0].clientX, e.touches[0].clientY), {passive: true});
                focusTopBar.addEventListener('touchend', onFUp);

                focusTopBar.addEventListener('mousedown', (e) => {
                    onFDown(e.clientX, e.clientY);
                    const moveHandler = (ev) => onFMove(ev.clientX, ev.clientY);
                    const upHandler = () => { onFUp(); document.removeEventListener('mousemove', moveHandler); document.removeEventListener('mouseup', upHandler); };
                    document.addEventListener('mousemove', moveHandler);
                    document.addEventListener('mouseup', upHandler);
                });


                const titleContainer = document.createElement('div');
                titleContainer.style.cssText = `position:relative; display:${isFocusMode ? 'none' : 'flex'}; align-items:center; gap:12px; border-bottom:1px solid var(--sn-border); margin-bottom:16px; padding-bottom:12px; opacity: ${isTrashed ? '0.6' : '1'};`;

                const titleInput = document.createElement('input');
                titleInput.value = activeNote.title;
                titleInput.placeholder = "제목 없음";
                titleInput.style.cssText = `flex:1; background:transparent; border:none; color:var(--sn-textTitle); font-size:22px; font-weight:700; outline:none; min-width:0; padding:0; letter-spacing:-0.5px; position:relative; z-index:2;`;
                titleInput.disabled = isTrashed;

                if (isLongTermMode) { titleInput.setAttribute('maxlength', '20'); titleInput.placeholder = "제목 없음 (최대 20자)"; } else { titleInput.removeAttribute('maxlength'); }

                const photoBtn = document.createElement('label');
                photoBtn.title = "사진 삽입";
                photoBtn.innerHTML = Icons.photo; photoBtn.className = 'sn-icon-btn';
                photoBtn.style.cssText = `margin-left:auto; display:${(isTrashed || isLongTermMode) ? 'none' : 'flex'}; position:relative; z-index:2;`;

                const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.style.display = 'none';
                photoBtn.appendChild(fileInput);

                const dividerHitBox = document.createElement('div');
                dividerHitBox.title = "클릭하거나 위로 스와이프하여 집중 모드";
                dividerHitBox.style.cssText = `position:absolute; bottom:-8px; left:0; width:100%; height:16px; cursor:ns-resize; z-index:10; background:transparent; touch-action:none;`;

                let dStartY = 0, dIsDragging = false;
                const onDDown = (y) => { dStartY = y; dIsDragging = false; };
                const onDMove = (y) => {
                    if (!dStartY) return;
                    const delta = y - dStartY;
                    if (Math.abs(delta) > 5) dIsDragging = true;
                    if (delta < -15) { isFocusMode = true; dStartY = 0; renderBody(); }
                };
                const onDUp = () => {
                    if (dStartY && !dIsDragging) { isFocusMode = true; renderBody(); }
                    dStartY = 0; dIsDragging = false;
                };

                dividerHitBox.addEventListener('touchstart', (e) => onDDown(e.touches[0].clientY), {passive: true});
                dividerHitBox.addEventListener('touchmove', (e) => onDMove(e.touches[0].clientY), {passive: true});
                dividerHitBox.addEventListener('touchend', onDUp);

                dividerHitBox.addEventListener('mousedown', (e) => {
                    onDDown(e.clientY);
                    const moveHandler = (ev) => onDMove(ev.clientY);
                    const upHandler = () => { onDUp(); document.removeEventListener('mousemove', moveHandler); document.removeEventListener('mouseup', upHandler); };
                    document.addEventListener('mousemove', moveHandler);
                    document.addEventListener('mouseup', upHandler);
                });

                titleContainer.append(titleInput, photoBtn, dividerHitBox);

                const editorDiv = document.createElement('div');
                editorDiv.className = 'simple-notepad-editor';
                editorDiv.contentEditable = !isTrashed;
                editorDiv.innerHTML = activeNote.content || "";
                editorDiv.setAttribute('placeholder', '내용을 입력하세요...');
                editorDiv.style.cssText = `flex:1; background:transparent; border:none; color:var(--sn-textTitle); font-size:15px; outline:none; overflow-y:auto; line-height:1.7; padding:4px 0 24px; width:100%; -webkit-overflow-scrolling:touch; opacity: ${isTrashed ? '0.6' : '1'}; word-break: break-word; letter-spacing:-0.2px;`;

                editorDiv.addEventListener('paste', (e) => {
                    e.preventDefault();
                    let text = (e.originalEvent || e).clipboardData.getData('text/plain');
                    text = text.replace(/(?:\r\n|\r|\n)/g, '<br>');
                    document.execCommand('insertHTML', false, text);
                    activeNote.content = editorDiv.innerHTML; updateCharCount(); triggerAutoSave();
                });

                const footer = document.createElement('div');
                footer.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding-top:16px; margin-top:12px; font-size:13px; color:var(--sn-textDesc);`;

                const getPlainText = () => editorDiv.innerText.trim() || "";

                fileInput.onchange = (e) => {
                    const file = e.target.files[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas'); let w = img.width; let h = img.height; const maxW = 600;
                            if (w > maxW) { h = Math.round(h * (maxW / w)); w = maxW; }
                            canvas.width = w; canvas.height = h; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
                            const base64 = canvas.toDataURL('image/jpeg', 0.8);

                            const imgNode = document.createElement('img');
                            imgNode.src = base64;
                            imgNode.alt = 'image';

                            editorDiv.appendChild(imgNode);
                            editorDiv.appendChild(document.createElement('br'));
                            editorDiv.appendChild(document.createElement('br'));

                            editorDiv.scrollTop = editorDiv.scrollHeight;

                            activeNote.content = editorDiv.innerHTML;
                            updateCharCount();
                            triggerAutoSave();
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file); fileInput.value = '';
                };

                if (isTrashed) {
                    const restoreBtn = document.createElement('button'); restoreBtn.innerText = "복구하기";
                    restoreBtn.style.cssText = `background: var(--sn-listItemSelectedBg); color: var(--sn-textTitle); border: none; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight:600; cursor: pointer; transition: background 0.2s;`;
                    restoreBtn.onclick = () => { activeNote.isTrashed = false; activeNote.folderId = null; saveData(); renderBody(); };

                    const deleteForeverBtn = document.createElement('button'); deleteForeverBtn.innerText = "영구 삭제";
                    deleteForeverBtn.style.cssText = `background: var(--sn-dangerHover); color: var(--sn-danger); border: none; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight:600; cursor: pointer; transition: opacity 0.2s;`;
                    deleteForeverBtn.onclick = () => { if(confirm("정말 이 메모를 완전히 삭제할까요? 복구할 수 없습니다.")) { appData.notes = appData.notes.filter(n => n.id !== activeNote.id); currentNoteId = null; saveData(); renderBody(); } };

                    const btnWrap = document.createElement('div'); btnWrap.style.cssText = "display:flex; gap:10px;"; btnWrap.append(restoreBtn, deleteForeverBtn);
                    const trashWarn = document.createElement('span'); trashWarn.innerText = "휴지통의 메모 (읽기 전용)";
                    footer.append(trashWarn, btnWrap);
                } else {
                    const leftFooter = document.createElement('div'); leftFooter.style.cssText = "display:flex; align-items:center; gap: 16px;";
                    const charCount = document.createElement('span'); charCount.id = 'simple-notepad-char-count';

                    const updateCharCount = () => {
                        const plainTextLen = getPlainText().length;
                        const dateStr = new Date(activeNote.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
                        charCount.innerText = `${dateStr} · ${plainTextLen}자`;
                        if (isLongTermMode && plainTextLen > 300) { charCount.style.color = 'var(--sn-danger)'; charCount.style.fontWeight = 'bold'; }
                        else { charCount.style.color = 'var(--sn-textDesc)'; charCount.style.fontWeight = 'normal'; }
                    };

                    updateCharCount(); leftFooter.appendChild(charCount);

                    if (isLongTermMode) {
                        const apiBtn = document.createElement('button'); apiBtn.innerText = "기억에 추가";
                        apiBtn.style.cssText = `background: var(--sn-accentHover); color: var(--sn-accent); border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;`;

                        apiBtn.onclick = async () => {
                            const pureText = getPlainText(); const finalTitle = activeNote.title.trim() === "" ? "제목 없음" : activeNote.title.trim();
                            if (finalTitle === "제목 없음") return alert("장기 기억 전송 시 제목을 작성해주세요.");
                            if (finalTitle.length > 20) return alert(`제목 글자 수 초과 (${finalTitle.length}/20자)\n제목은 공백 포함 20자 이내여야 합니다.`);
                            if (pureText.length > 300) return alert(`내용 텍스트 글자 수 초과 (${pureText.length}/300자)\n내용은 공백 포함 300자 이내여야 합니다.`);

                            apiBtn.innerText = "추가 중..."; apiBtn.style.opacity = '0.5'; apiBtn.disabled = true;
                            const res = await apiCall('POST', '/summaries', { type: 'shortTerm', title: finalTitle, summary: pureText });
                            apiBtn.disabled = false; apiBtn.style.opacity = '1'; apiBtn.innerText = "기억에 추가";

                            if (res) {
                                const toast = document.createElement('div'); toast.innerText = "성공적으로 장기 기억에 추가되었습니다.";
                                toast.style.cssText = `position:fixed; bottom:40px; left:50%; transform:translateX(-50%); background:rgba(28,28,30,0.9); color:#fff; padding:12px 24px; border-radius:30px; font-size:14px; font-weight:500; z-index:2147483647; box-shadow:0 8px 24px rgba(0,0,0,0.2); transition: opacity 0.3s; backdrop-filter: blur(10px);`;
                                document.body.appendChild(toast); setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2500);
                            }
                        };
                        leftFooter.appendChild(apiBtn);
                    }

                    const saveStatus = document.createElement('span'); saveStatus.style.cssText = "font-size: 12px; font-weight:500;";
                    footer.append(leftFooter, saveStatus);

                    titleInput.addEventListener('input', (e) => {
                        const inputVal = e.target.value.trim(); activeNote.title = inputVal;
                        const sbItem = document.getElementById(`sidebar-note-${activeNote.id}`);
                        if(sbItem) sbItem.innerText = inputVal === "" ? "제목 없음" : inputVal;
                        triggerAutoSave();
                    });

                    editorDiv.addEventListener('input', () => {
                        activeNote.content = editorDiv.innerHTML;
                        updateCharCount();
                        triggerAutoSave();
                    });

                    const triggerAutoSave = () => {
                        saveStatus.innerText = "저장 중..."; saveStatus.style.color = 'var(--sn-subText)';
                        clearTimeout(saveTimeout);
                        saveTimeout = setTimeout(() => { activeNote.updatedAt = Date.now(); saveData(); saveStatus.innerText = ""; }, 1200);
                    };
                }
                editor.append(focusTopBar, titleContainer, editorDiv, footer);
            } else {
                const emptyState = document.createElement('div');
                emptyState.style.cssText = "flex:1; display:flex; justify-content:center; align-items:center; color:var(--sn-subText); font-size:15px; flex-direction:column; gap:12px; font-weight:500;";
                emptyState.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.3; margin-bottom:8px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg><div>선택된 메모가 없습니다.</div>`;
                editor.appendChild(emptyState);
            }
        };
        renderBody();
    }

    function injectToolbarButton() {
        if (document.getElementById('simple-notepad-btn')) return;
        const btnContainer = document.querySelector('.flex.items-center.space-x-2');
        if (!btnContainer) return;

        const recommendBtn = Array.from(btnContainer.querySelectorAll('button')).find(b => b?.textContent?.includes('추천답변'));
        const baseBtn = btnContainer.querySelector('button');
        if (!baseBtn) return;

        const tbBtn = baseBtn.cloneNode(true);
        tbBtn.id = 'simple-notepad-btn'; tbBtn.textContent = ''; tbBtn.removeAttribute('title'); tbBtn.removeAttribute('disabled');
        tbBtn.style.marginLeft = '0.5rem'; tbBtn.style.display = 'flex'; tbBtn.style.alignItems = 'center'; tbBtn.style.justifyContent = 'center';

        tbBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;

        tbBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); const popup = document.getElementById('simple-notepad-popup'); if (popup) popup.style.display = popup.style.display === 'flex' ? 'none' : 'flex'; };

        if (recommendBtn && recommendBtn.nextSibling) btnContainer.insertBefore(tbBtn, recommendBtn.nextSibling);
        else btnContainer.appendChild(tbBtn);
    }

    setInterval(() => { initNotepad(); injectToolbarButton(); }, 1000);

})();
