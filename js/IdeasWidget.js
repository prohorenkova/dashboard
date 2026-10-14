import { UIComponent } from './UIComponent.js';

/**
 * Список идей (ToDo-стиль).
 * Данные хранятся в localStorage.
 */
export class IdeasWidget extends UIComponent {
  static defaultTitle = 'Список идей';

  constructor(config) {
    super(config);
    this.ideas = this.loadIdeas();
  }

  loadIdeas() {
    try {
      const data = localStorage.getItem('inspiration-ideas');
      return data
        ? JSON.parse(data)
        : [
            { id: 1, text: 'Сделать moodboard для проекта', done: false },
            { id: 2, text: 'Найти 5 референсов по цвету', done: true },
            { id: 3, text: 'Написать короткий креативный бриф', done: false }
          ];
    } catch {
      return [];
    }
  }

  saveIdeas() {
    localStorage.setItem('inspiration-ideas', JSON.stringify(this.ideas));
  }

  afterRender() {
    this._drawContent();
  }

  _drawContent() {
    const content = this.getContentElement();
    if (!content) return;

    content.innerHTML = `
      <form class="ideas-form">
        <input type="text" class="ideas-input" placeholder="Новая идея..." maxlength="100" required>
        <button type="submit" class="btn btn--small">+</button>
      </form>
      <ul class="ideas-list">
        ${this.ideas
          .map(
            (idea) => `
          <li class="ideas-item ${idea.done ? 'ideas-item--done' : ''}" data-id="${idea.id}">
            <label class="ideas-label">
              <input type="checkbox" ${idea.done ? 'checked' : ''}>
              <span class="ideas-text">${this.escapeHtml(idea.text)}</span>
            </label>
            <button type="button" class="ideas-delete" title="Удалить">×</button>
          </li>
        `
          )
          .join('')}
      </ul>
      <div class="ideas-stats">
        ${this.ideas.filter((i) => !i.done).length} активных · ${this.ideas.filter((i) => i.done).length} готово
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const form = this.element.querySelector('.ideas-form');
    const list = this.element.querySelector('.ideas-list');

    this._addListener(form, 'submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('.ideas-input');
      const text = input.value.trim();
      if (!text) return;
      this.ideas.unshift({ id: Date.now(), text, done: false });
      this.saveIdeas();
      input.value = '';
      this._drawContent();
    });

    this._addListener(list, 'change', (e) => {
      if (e.target.type !== 'checkbox') return;
      const li = e.target.closest('.ideas-item');
      const id = Number(li.dataset.id);
      const idea = this.ideas.find((i) => i.id === id);
      if (idea) {
        idea.done = e.target.checked;
        this.saveIdeas();
        this._drawContent();
      }
    });

    this._addListener(list, 'click', (e) => {
      if (!e.target.classList.contains('ideas-delete')) return;
      const li = e.target.closest('.ideas-item');
      const id = Number(li.dataset.id);
      this.ideas = this.ideas.filter((i) => i.id !== id);
      this.saveIdeas();
      this._drawContent();
    });
  }

  addIdea(text) {
    this.ideas.unshift({ id: Date.now(), text, done: false });
    this.saveIdeas();
    this._drawContent();
  }

  async refresh() {
    this.ideas = this.loadIdeas();
    this._drawContent();
  }
}
