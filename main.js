import { Dashboard } from './js/Dashboard.js';
import { ColorPaletteWidget } from './js/ColorPaletteWidget.js';
import { GiphyWidget } from './js/GiphyWidget.js';
import { AdviceWidget } from './js/AdviceWidget.js';
import { DateTimeWidget } from './js/DateTimeWidget.js';
import { RandomNumberWidget } from './js/RandomNumberWidget.js';
import { IdeasWidget } from './js/IdeasWidget.js';
import { WorkingDaysWidget } from './js/WorkingDaysWidget.js';
import { GhibliWidget } from './js/GhibliWidget.js';

const widgetFactory = {
  palette: ColorPaletteWidget,
  giphy: GiphyWidget,
  advice: AdviceWidget,
  datetime: DateTimeWidget,
  random: RandomNumberWidget,
  ideas: IdeasWidget,
  workdays: WorkingDaysWidget,
  ghibli: GhibliWidget
};

document.addEventListener('DOMContentLoaded', () => {
  const dashboardContainer = document.getElementById('dashboard');
  const dashboard = new Dashboard(dashboardContainer, widgetFactory);

  dashboard.addWidget('palette', { id: 'palette', title: 'Цветовая палитра' });
  dashboard.addWidget('giphy', { id: 'giphy', title: 'GIF' });
  dashboard.addWidget('workdays', { id: 'workdays', title: 'Рабочие дни' });
  dashboard.addWidget('ghibli', { id: 'ghibli', title: 'Ghibli Film' });
  dashboard.addWidget('advice', { id: 'advice', title: 'Совет дня' });
  dashboard.addWidget('datetime', { id: 'datetime', title: 'Дата и время' });
  dashboard.addWidget('random', { id: 'random', title: 'Случайное число' });
  dashboard.addWidget('ideas', { id: 'ideas', title: 'Список идей' });

  document.getElementById('btn-add-palette')?.addEventListener('click', () => dashboard.addWidget('palette'));
  document.getElementById('btn-add-giphy')?.addEventListener('click', () => dashboard.addWidget('giphy'));
  document.getElementById('btn-add-workdays')?.addEventListener('click', () => dashboard.addWidget('workdays'));
  document.getElementById('btn-add-ghibli')?.addEventListener('click', () => dashboard.addWidget('ghibli'));
  document.getElementById('btn-add-advice')?.addEventListener('click', () => dashboard.addWidget('advice'));
  document.getElementById('btn-add-datetime')?.addEventListener('click', () => dashboard.addWidget('datetime'));
  document.getElementById('btn-add-random')?.addEventListener('click', () => dashboard.addWidget('random'));
  document.getElementById('btn-add-ideas')?.addEventListener('click', () => dashboard.addWidget('ideas'));
  document.getElementById('refresh-all-btn')?.addEventListener('click', () => dashboard.refreshAll());

  console.log(`Dashboard готов. Виджетов: ${dashboard.count}`);
  window.dashboard = dashboard;
});
