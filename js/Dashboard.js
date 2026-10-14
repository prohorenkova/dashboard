/**
 * Dashboard — коллекция виджетов, сетка, drag-and-drop.
 */
export class Dashboard {
  /**
   * @param {HTMLElement} container
   * @param {Object} widgetFactory
   */
  constructor(container, widgetFactory = {}) {
    this.container = container;
    this.widgetFactory = widgetFactory;
    this.widgets = new Map();
    this._dragId = null;

    this._onWidgetClose = this._onWidgetClose.bind(this);
    this._onDragStart = this._onDragStart.bind(this);
    this._onDragOver = this._onDragOver.bind(this);
    this._onDrop = this._onDrop.bind(this);
    this._onDragEnd = this._onDragEnd.bind(this);
    this._onHeaderMouseDown = this._onHeaderMouseDown.bind(this);

    this.container.addEventListener('widget-close', this._onWidgetClose);
    this.container.addEventListener('mousedown', this._onHeaderMouseDown);
    this.container.addEventListener('dragstart', this._onDragStart);
    this.container.addEventListener('dragover', this._onDragOver);
    this.container.addEventListener('drop', this._onDrop);
    this.container.addEventListener('dragend', this._onDragEnd);
  }

  addWidget(widgetType, extraConfig = {}) {
    const WidgetClass = this.widgetFactory[widgetType];
    if (!WidgetClass) {
      console.warn(`Неизвестный тип виджета: ${widgetType}`);
      return null;
    }

    const id = extraConfig.id || `${widgetType}-${Date.now()}`;
    if (this.widgets.has(id)) {
      console.warn(`Виджет с id "${id}" уже есть`);
      return this.widgets.get(id);
    }

    const config = {
      id,
      title: extraConfig.title || WidgetClass.defaultTitle || widgetType,
      ...extraConfig
    };

    const widget = new WidgetClass(config);
    const el = widget.render();
    el.draggable = false;
    this.container.appendChild(el);

    if (typeof widget.afterRender === 'function') {
      widget.afterRender();
    } else if (typeof widget.refresh === 'function') {
      widget.refresh();
    }

    this.widgets.set(id, widget);
    return widget;
  }

  removeWidget(widgetId) {
    const widget = this.widgets.get(widgetId);
    if (!widget) return;
    widget.destroy();
    this.widgets.delete(widgetId);
  }

  _onWidgetClose(e) {
    const id = e.detail?.id;
    if (id) this.removeWidget(id);
  }

  _onHeaderMouseDown(e) {
    const header = e.target.closest('.widget__header');
    if (!header) return;
    if (e.target.closest('.widget__btn')) return;

    const widget = header.closest('.widget');
    if (!widget) return;

    widget.draggable = true;
  }

  _onDragStart(e) {
    const widget = e.target.closest('.widget');
    if (!widget || !widget.draggable) {
      e.preventDefault();
      return;
    }

    if (!e.target.closest('.widget__header') && e.target !== widget) {
      const path = e.composedPath?.() || [];
      const fromHeader = path.some((n) => n?.classList?.contains?.('widget__header'));
      if (!fromHeader) {
        e.preventDefault();
        widget.draggable = false;
        return;
      }
    }

    this._dragId = widget.dataset.widgetId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this._dragId);
    widget.classList.add('widget--dragging');
  }

  _onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const over = e.target.closest('.widget');
    if (!over || over.dataset.widgetId === this._dragId) return;

    const dragging = this.container.querySelector('.widget--dragging');
    if (!dragging || dragging === over) return;

    const rect = over.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const midX = rect.left + rect.width / 2;

    const insertBefore =
      e.clientY < midY || (Math.abs(e.clientY - midY) < 20 && e.clientX < midX);

    if (insertBefore) {
      this.container.insertBefore(dragging, over);
    } else {
      this.container.insertBefore(dragging, over.nextSibling);
    }
  }

  _onDrop(e) {
    e.preventDefault();
  }

  _onDragEnd() {
    this.container.querySelectorAll('.widget').forEach((el) => {
      el.classList.remove('widget--dragging');
      el.draggable = false;
    });
    this._dragId = null;
  }

  async refreshAll() {
    const list = Array.from(this.widgets.values());
    await Promise.allSettled(list.map((w) => w.refresh?.()));
  }

  getWidget(id) {
    return this.widgets.get(id);
  }

  get count() {
    return this.widgets.size;
  }

  destroy() {
    this.container.removeEventListener('widget-close', this._onWidgetClose);
    this.container.removeEventListener('mousedown', this._onHeaderMouseDown);
    this.container.removeEventListener('dragstart', this._onDragStart);
    this.container.removeEventListener('dragover', this._onDragOver);
    this.container.removeEventListener('drop', this._onDrop);
    this.container.removeEventListener('dragend', this._onDragEnd);
    Array.from(this.widgets.keys()).forEach((id) => this.removeWidget(id));
  }
}
