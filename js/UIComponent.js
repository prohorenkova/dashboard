/**
 * Базовый (абстрактный) класс для всех UI-виджетов.
 * ООП: инкапсуляция, наследование, полиморфизм.
 */
export class UIComponent {
  /**
   * @param {Object} config
   * @param {string} config.id
   * @param {string} config.title
   */
  constructor(config = {}) {
    if (new.target === UIComponent) {
      throw new Error('UIComponent — абстрактный класс, нельзя создавать напрямую');
    }

    this.id = config.id || `widget-${Date.now()}`;
    this.title = config.title || 'Виджет';
    this.element = null;
    this.isMinimized = false;
    this.isLoading = false;
    this._listeners = [];
    this._abortController = null;
  }

  /**
   * Создаёт обёртку виджета и возвращает DOM-элемент.
   * @returns {HTMLElement}
   */
  render() {
    this.element = document.createElement('article');
    this.element.className = 'widget';
    this.element.id = this.id;
    this.element.dataset.widgetId = this.id;
    this.element.draggable = false;

    this.element.innerHTML = `
      <header class="widget__header" title="Тяни за шапку, чтобы переместить">
        <span class="widget__drag-hint">⋮⋮</span>
        <h2 class="widget__title">${this.escapeHtml(this.title)}</h2>
        <div class="widget__actions">
          <button type="button" class="widget__btn widget__btn--refresh" title="Обновить" aria-label="Обновить">↻</button>
          <button type="button" class="widget__btn widget__btn--minimize" title="Свернуть" aria-label="Свернуть">_</button>
          <button type="button" class="widget__btn widget__btn--close" title="Закрыть" aria-label="Закрыть">×</button>
        </div>
      </header>
      <div class="widget__body">
        <div class="widget__content"></div>
        <div class="widget__loader hidden">Загрузка...</div>
      </div>
    `;

    this._bindHeaderButtons();
    this._bindDragHandle();
    return this.element;
  }

  _bindHeaderButtons() {
    const refreshBtn = this.element.querySelector('.widget__btn--refresh');
    const minimizeBtn = this.element.querySelector('.widget__btn--minimize');
    const closeBtn = this.element.querySelector('.widget__btn--close');

    this._addListener(refreshBtn, 'click', () => this.refresh());
    this._addListener(minimizeBtn, 'click', () => this.minimize());
    this._addListener(closeBtn, 'click', () => this.close());
  }

  _bindDragHandle() {
    const header = this.element.querySelector('.widget__header');

    this._addListener(header, 'mousedown', (e) => {
      if (e.target.closest('.widget__btn')) {
        this.element.draggable = false;
        return;
      }
      this.element.draggable = true;
    });

    this._addListener(this.element, 'dragend', () => {
      this.element.draggable = false;
      this.element.classList.remove('widget--dragging');
    });

    this._addListener(window, 'mouseup', () => {
      if (this.element && !this.element.classList.contains('widget--dragging')) {
        this.element.draggable = false;
      }
    });
  }

  _bindResize() {
    const handle = this.element.querySelector('.widget__resize');
    if (!handle) return;

    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;

    const onMove = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const w = Math.max(260, startW + dx);
      const h = Math.max(140, startH + dy);
      this.element.style.width = `${w}px`;
      this.element.style.height = `${h}px`;
      this.element.style.maxWidth = '100%';
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      this.element.classList.remove('widget--resizing');
    };

    this._addListener(handle, 'mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.element.draggable = false;
      this.element.classList.add('widget--resizing');
      const rect = this.element.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startW = rect.width;
      startH = rect.height;
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  _addListener(el, event, handler, options) {
    if (!el) return;
    const bound = handler.bind(this);
    el.addEventListener(event, bound, options);
    this._listeners.push({ el, event, handler: bound, options });
  }

  minimize() {
    this.isMinimized = !this.isMinimized;
    this.element?.classList.toggle('widget--minimized', this.isMinimized);
    const btn = this.element?.querySelector('.widget__btn--minimize');
    if (btn) btn.textContent = this.isMinimized ? '□' : '_';
  }

  close() {
    this.element?.dispatchEvent(
      new CustomEvent('widget-close', {
        bubbles: true,
        detail: { id: this.id }
      })
    );
  }

  setLoading(state) {
    this.isLoading = state;
    const loader = this.element?.querySelector('.widget__loader');
    const content = this.element?.querySelector('.widget__content');
    if (loader) loader.classList.toggle('hidden', !state);
    if (content) content.classList.toggle('hidden', state);
  }

  getContentElement() {
    return this.element?.querySelector('.widget__content');
  }

  /**
   * Создаёт новый AbortController для запроса.
   * Предыдущий запрос отменяется.
   */
  createAbortController() {
    if (this._abortController) {
      this._abortController.abort();
    }
    this._abortController = new AbortController();
    return this._abortController;
  }

  async refresh() {}

  destroy() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this._listeners.forEach(({ el, event, handler, options }) => {
      el.removeEventListener(event, handler, options);
    });
    this._listeners = [];
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
    return div.innerHTML;
  }
}
