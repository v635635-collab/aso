'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, AppWindow, KeyRound, Layers, Search,
  Rocket, LineChart, AlertTriangle, Brain, TrendingUp,
  Settings, Activity, Users, BookOpen, Type, MessageSquare,
  Globe, ChevronRight
} from 'lucide-react';

interface DocSection {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

const sections: DocSection[] = [
  {
    id: 'overview',
    icon: LayoutDashboard,
    title: 'Dashboard',
    subtitle: 'Главный экран системы',
    content: (
      <div className="space-y-4">
        <p>Главная панель показывает ключевые метрики вашего портфеля приложений:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Total Apps</strong> — сколько приложений добавлено в систему</li>
          <li><strong>Total Keywords</strong> — общее количество отслеживаемых ключевых слов</li>
          <li><strong>Active Campaigns</strong> — сколько push-кампаний сейчас активны</li>
          <li><strong>Alerts</strong> — количество непрочитанных уведомлений (пессимизации, завершения кампаний и т.д.)</li>
        </ul>
        <p>Также на дашборде:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Position Changes</strong> — топ-5 самых значимых изменений позиций за сегодня</li>
          <li><strong>Active Campaign Progress</strong> — прогресс текущих кампаний</li>
          <li><strong>Trending Opportunities</strong> — горячие тренды из Google Trends</li>
          <li><strong>Quick Actions</strong> — быстрые кнопки для частых действий</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'apps',
    icon: AppWindow,
    title: 'Applications',
    subtitle: 'Управление приложениями',
    content: (
      <div className="space-y-4">
        <p>Раздел для управления вашими iOS-приложениями в App Store.</p>
        <h4 className="font-semibold text-base mt-4">Как добавить приложение</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Нажмите <strong>"Add App"</strong></li>
          <li>Введите <strong>Name</strong> — название приложения</li>
          <li>Введите <strong>Apple ID</strong> — числовой ID из App Store Connect</li>
          <li>Введите <strong>Bundle ID</strong> — например, <code>com.company.app</code></li>
          <li>Выберите <strong>Account</strong> — аккаунт разработчика</li>
          <li>Нажмите <strong>Create</strong></li>
        </ol>
        <h4 className="font-semibold text-base mt-4">Статусы приложений</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>DRAFT</strong> — только добавлено, не отслеживается</li>
          <li><strong>LIVE</strong> — активно, позиции и метрики обновляются автоматически</li>
          <li><strong>SUSPENDED</strong> — приостановлено</li>
          <li><strong>REMOVED</strong> — удалено из стора</li>
        </ul>
        <h4 className="font-semibold text-base mt-4">Вкладки приложения</h4>
        <p>Кликните на приложение, чтобы увидеть:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Keywords</strong> — привязанные ключевые слова и их позиции</li>
          <li><strong>Positions</strong> — история позиций в поиске</li>
          <li><strong>Campaigns</strong> — push-кампании для этого приложения</li>
          <li><strong>Localizations</strong> — локализации названий для разных стран</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'accounts',
    icon: Users,
    title: 'Accounts',
    subtitle: 'Аккаунты разработчиков Apple',
    content: (
      <div className="space-y-4">
        <p>Здесь хранятся аккаунты Apple Developer, к которым привязаны приложения.</p>
        <h4 className="font-semibold text-base mt-4">Зачем нужны аккаунты</h4>
        <p>
          Каждое приложение привязано к аккаунту разработчика. Это нужно для группировки приложений
          и понимания, какие приложения на каком аккаунте опубликованы.
        </p>
        <h4 className="font-semibold text-base mt-4">Как создать</h4>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Нажмите <strong>"Add Account"</strong></li>
          <li>Введите <strong>Email</strong> аккаунта</li>
          <li>Введите <strong>Team Name</strong> — название команды</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'keywords',
    icon: KeyRound,
    title: 'Keywords',
    subtitle: 'База ключевых слов',
    content: (
      <div className="space-y-4">
        <p>Централизованная база всех ключевых слов. Метрики подтягиваются из ASOMobile API.</p>
        <h4 className="font-semibold text-base mt-4">Метрики ключевого слова</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Traffic</strong> — оценка поискового трафика (чем выше — тем больше людей ищут)</li>
          <li><strong>SAP (Search Ads Popularity)</strong> — конкурентность в рекламе</li>
          <li><strong>Competition</strong> — количество конкурентов по ключу</li>
          <li><strong>Difficulty</strong> — расчётная сложность попадания в топ</li>
        </ul>
        <h4 className="font-semibold text-base mt-4">Как использовать</h4>
        <p>
          Ключевые слова добавляются автоматически через <strong>Research</strong> или вручную.
          Привяжите ключ к приложению, чтобы отслеживать позицию.
        </p>
      </div>
    ),
  },
  {
    id: 'niches',
    icon: Layers,
    title: 'Niches',
    subtitle: 'Группировка по нишам',
    content: (
      <div className="space-y-4">
        <p>Ниши — это тематические группы для ваших ключевых слов и приложений.</p>
        <h4 className="font-semibold text-base mt-4">Примеры ниш</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Gambling</strong> — казино, слоты, покер</li>
          <li><strong>VPN</strong> — VPN-сервисы</li>
          <li><strong>Crypto</strong> — криптовалюты, трейдинг</li>
          <li><strong>Education</strong> — образовательные приложения</li>
        </ul>
        <h4 className="font-semibold text-base mt-4">Зачем нужны</h4>
        <p>
          Ниши помогают группировать ключи, анализировать конкуренцию в конкретном сегменте
          и планировать стратегию продвижения.
        </p>
      </div>
    ),
  },
  {
    id: 'research',
    icon: Search,
    title: 'Research',
    subtitle: 'Автоматический поиск ключевых слов',
    content: (
      <div className="space-y-4">
        <p>Research автоматически находит релевантные ключевые слова через ASOMobile API.</p>
        <h4 className="font-semibold text-base mt-4">Как запустить исследование</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Нажмите <strong>"New Research"</strong></li>
          <li>Введите <strong>Name</strong> — название исследования</li>
          <li>Добавьте <strong>Seed Keywords</strong> — начальные ключи (например: "casino", "slots")</li>
          <li>Выберите <strong>Country</strong> и <strong>Locale</strong></li>
          <li>Настройте <strong>Max Keywords</strong> и <strong>Min Traffic</strong></li>
          <li>Нажмите <strong>Start</strong></li>
        </ol>
        <h4 className="font-semibold text-base mt-4">Как это работает</h4>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Система отправляет каждый seed-ключ в ASOMobile Keyword Suggest</li>
          <li>Получает список похожих ключей с трафиком</li>
          <li>Берёт топ-3 найденных ключа и ищет по ним дальше (глубина до 2)</li>
          <li>Фильтрует по минимальному трафику</li>
          <li>Сохраняет найденные ключи в базу</li>
        </ol>
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 mt-4">
          <p className="text-sm"><strong>Важно:</strong> Убедитесь, что API ключ ASOMobile корректен и баланс не исчерпан. Каждый запрос расходует квоту API.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'titles',
    icon: Type,
    title: 'Titles',
    subtitle: 'Оптимизация названий приложений',
    content: (
      <div className="space-y-4">
        <p>
          Генератор оптимальных названий для App Store. Использует до <strong>200 символов</strong> названия,
          чтобы упаковать максимум высокотрафиковых ключевых слов.
        </p>
        <h4 className="font-semibold text-base mt-4">Как работает</h4>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Нажмите <strong>"Generate Titles"</strong></li>
          <li>Выберите приложение</li>
          <li>Выберите стратегию:
            <ul className="list-disc pl-6 mt-1">
              <li><strong>Traffic First</strong> — максимум трафика, читаемость вторична</li>
              <li><strong>Balanced</strong> — баланс трафика и читаемости</li>
              <li><strong>Readability First</strong> — красивое название, трафик вторичен</li>
            </ul>
          </li>
          <li>AI сгенерирует 3 варианта с оценкой coverage и traffic score</li>
          <li>Сравните варианты и нажмите <strong>"Apply"</strong> на лучшем</li>
        </ol>
        <h4 className="font-semibold text-base mt-4">Метрики названия</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Char Count</strong> — использовано символов из 200</li>
          <li><strong>Keywords Covered</strong> — сколько ключей вошло в название</li>
          <li><strong>Traffic Score</strong> — суммарный трафик покрытых ключей</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'campaigns',
    icon: Rocket,
    title: 'Campaigns',
    subtitle: 'Push-кампании для продвижения',
    content: (
      <div className="space-y-4">
        <p>
          Кампании — это планы по продвижению приложений в топ с помощью мотивированного трафика.
          AI анализирует конкуренцию и составляет оптимальный план закупок.
        </p>
        <h4 className="font-semibold text-base mt-4">Жизненный цикл кампании</h4>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="px-2 py-1 rounded bg-muted">DRAFT</span>
          <ChevronRight className="h-4 w-4" />
          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400">REVIEW</span>
          <ChevronRight className="h-4 w-4" />
          <span className="px-2 py-1 rounded bg-green-500/20 text-green-400">APPROVED</span>
          <ChevronRight className="h-4 w-4" />
          <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">ACTIVE</span>
          <ChevronRight className="h-4 w-4" />
          <span className="px-2 py-1 rounded bg-muted">COMPLETED</span>
        </div>
        <h4 className="font-semibold text-base mt-4">Как создать кампанию</h4>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Нажмите <strong>"New Campaign"</strong></li>
          <li>Выберите приложение и целевые ключевые слова</li>
          <li>Выберите стратегию (GRADUAL / AGGRESSIVE / CONSERVATIVE)</li>
          <li>Укажите бюджет и длительность</li>
          <li>Нажмите <strong>"Generate Plan"</strong> — AI создаст дневной план установок</li>
          <li>Отправьте на проверку (Review → Approve → Start)</li>
        </ol>
        <h4 className="font-semibold text-base mt-4">Экспорт плана</h4>
        <p>
          Дневной план можно экспортировать в <strong>Text</strong>, <strong>CSV</strong> или <strong>JSON</strong>
          для передачи исполнителю (мотивированный трафик).
        </p>
      </div>
    ),
  },
  {
    id: 'learning',
    icon: Brain,
    title: 'Learning',
    subtitle: 'AI обучение на результатах',
    content: (
      <div className="space-y-4">
        <p>
          Learning Engine анализирует результаты завершённых кампаний и учится делать будущие планы лучше.
        </p>
        <h4 className="font-semibold text-base mt-4">Что отслеживается</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Records</strong> — данные каждой завершённой кампании (расход, установки, позиции)</li>
          <li><strong>Insights</strong> — выводы AI (что сработало, что нет)</li>
          <li><strong>Risk Model</strong> — модель рисков пессимизации на основе опыта</li>
        </ul>
        <p>Чем больше кампаний завершено, тем точнее AI планирует следующие.</p>
      </div>
    ),
  },
  {
    id: 'positions',
    icon: LineChart,
    title: 'Positions',
    subtitle: 'Мониторинг позиций в поиске',
    content: (
      <div className="space-y-4">
        <p>Отслеживание позиций ваших приложений по ключевым словам в App Store.</p>
        <h4 className="font-semibold text-base mt-4">Как читать данные</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Position</strong> — текущая позиция в поисковой выдаче (1 = топ)</li>
          <li><strong>Previous</strong> — предыдущая позиция</li>
          <li><strong>Change</strong> — изменение (зелёный = рост, красный = падение)</li>
        </ul>
        <h4 className="font-semibold text-base mt-4">Автоматическое обновление</h4>
        <p>
          Позиции обновляются каждые 6 часов для всех приложений со статусом <strong>LIVE</strong>.
          Также можно запустить ручную проверку со страницы приложения.
        </p>
      </div>
    ),
  },
  {
    id: 'pessimizations',
    icon: AlertTriangle,
    title: 'Pessimizations',
    subtitle: 'Обнаружение пессимизации',
    content: (
      <div className="space-y-4">
        <p>
          Система автоматически обнаруживает пессимизацию — резкое падение позиций,
          вызванное слишком агрессивным продвижением.
        </p>
        <h4 className="font-semibold text-base mt-4">Уровни серьёзности</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>MINOR</strong> — падение на 5-15 позиций</li>
          <li><strong>MODERATE</strong> — падение на 15-30 позиций</li>
          <li><strong>SEVERE</strong> — падение на 30+ позиций</li>
        </ul>
        <h4 className="font-semibold text-base mt-4">Что делать при пессимизации</h4>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Система автоматически ставит кампанию на паузу</li>
          <li>AI анализирует причину и предлагает рекомендации</li>
          <li>Данные используются для обучения Risk Model</li>
          <li>Следующие кампании будут менее агрессивными</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'trends',
    icon: TrendingUp,
    title: 'Trends',
    subtitle: 'Google Trends для поиска ниш',
    content: (
      <div className="space-y-4">
        <p>Интеграция с Google Trends для обнаружения растущих трендов и новых ниш.</p>
        <h4 className="font-semibold text-base mt-4">Две вкладки</h4>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Snapshots</strong> — снимки трендов: какие запросы растут,
            какие помечены как "breakout" (взрывной рост)
          </li>
          <li>
            <strong>Opportunities</strong> — AI-анализ: какие тренды можно превратить в приложение.
            Показывает AppStoreGap (насколько пуста ниша в App Store), предложенные ключи
          </li>
        </ul>
        <h4 className="font-semibold text-base mt-4">Кнопки</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Collect Now</strong> — запустить сбор трендов вручную</li>
          <li><strong>Analyze Now</strong> — запустить AI-анализ собранных данных</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'analytics',
    icon: Activity,
    title: 'Analytics',
    subtitle: 'Аналитика и ROI',
    content: (
      <div className="space-y-4">
        <p>Обзор финансовых метрик и эффективности кампаний.</p>
        <h4 className="font-semibold text-base mt-4">Что показывает</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Total Spend</strong> — общие расходы на кампании</li>
          <li><strong>Total Installs</strong> — общее количество установок</li>
          <li><strong>Avg CPI</strong> — средняя стоимость установки</li>
          <li><strong>Spend Over Time</strong> — график расходов по месяцам</li>
          <li><strong>ROI by Campaign</strong> — таблица ROI по каждой кампании</li>
          <li><strong>Top Keywords</strong> — топ ключей по трафику</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'chat',
    icon: MessageSquare,
    title: 'AI Assistant',
    subtitle: 'Чат с AI помощником',
    content: (
      <div className="space-y-4">
        <p>
          Кнопка AI-ассистента находится в правом нижнем углу экрана.
          Помощник имеет доступ ко всем данным системы.
        </p>
        <h4 className="font-semibold text-base mt-4">Что можно спросить</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>"Какие приложения у нас есть?"</li>
          <li>"Покажи топ ключевые слова по трафику"</li>
          <li>"Какие кампании сейчас активны?"</li>
          <li>"Были ли пессимизации за последнюю неделю?"</li>
          <li>"Предложи стратегию продвижения для приложения X"</li>
        </ul>
        <p>AI использует инструменты для поиска в базе данных и даёт ответы на основе реальных данных.</p>
      </div>
    ),
  },
  {
    id: 'localization',
    icon: Globe,
    title: 'Localization',
    subtitle: 'Локализация названий',
    content: (
      <div className="space-y-4">
        <p>
          Генерация названий и ключевых слов для разных стран App Store с помощью AI.
          Доступна на странице каждого приложения.
        </p>
        <h4 className="font-semibold text-base mt-4">Как использовать</h4>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Откройте приложение</li>
          <li>Перейдите на вкладку <strong>Localizations</strong></li>
          <li>Нажмите <strong>"Generate"</strong></li>
          <li>Выберите целевые языки (ru, de, fr, ja, ko, zh-Hans и др.)</li>
          <li>AI переведёт и адаптирует название, подзаголовок и ключевые слова</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings',
    subtitle: 'Настройки системы',
    content: (
      <div className="space-y-4">
        <p>Конфигурация всех параметров системы, сгруппированная по категориям.</p>
        <h4 className="font-semibold text-base mt-4">Основные категории</h4>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>AI / GPT</strong> — модель AI, температура, лимит токенов</li>
          <li><strong>Push Campaigns</strong> — стратегия по умолчанию, макс. установок в день</li>
          <li><strong>Monitoring</strong> — интервал проверки позиций, порог пессимизации</li>
          <li><strong>Telegram</strong> — токен бота и ID чата для уведомлений</li>
          <li><strong>Data Sources</strong> — ретенция данных, хранение raw API ответов</li>
          <li><strong>Trends</strong> — seed-запросы для Google Trends, целевые гео</li>
        </ul>
      </div>
    ),
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const active = sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)]">
      {/* Sidebar */}
      <nav className="w-64 shrink-0 overflow-y-auto border-r pr-4 space-y-1">
        <h2 className="text-lg font-bold mb-4 px-3">Документация</h2>
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                activeSection === section.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <div className="truncate">{section.title}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <active.icon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{active.title}</h1>
          </div>
          <p className="text-muted-foreground mb-6">{active.subtitle}</p>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {active.content}
          </div>
        </div>
      </div>
    </div>
  );
}
