# Astra Desktop v2.4

Десктоп-приложение Astra для оптимизации ПК. Привязано к сайту `https://astraboost.ru`.

## Быстрый старт

1. Запусти `1_install_dependencies.bat`
2. Запусти `2_run_desktop.bat`
3. Для сборки `.exe` запусти `3_build_windows_exe.bat`

## Архитектура

- **API**: `https://astraboost.ru` — авторизация, лицензии, устройства
- **Сборка**: Electron + electron-builder → NSIS installer
- **Данные**: electron-store (локальный JSON)

## Тарифы

| Тариф    | Функции                                                          |
|----------|------------------------------------------------------------------|
| Free     | Базовая оптимизация, очистка RAM, автозагрузка, мониторинг       |
| Pro      | + GPU приоритет, FPS Boost, твики реестра, службы, глубокая чистка|
| Lifetime | Всё из Pro навсегда + ранний доступ к beta                       |

## Публикация .exe

После сборки (`3_build_windows_exe.bat`):

1. Файл `AstraSetup.exe` появится в `apps/desktop/dist/`
2. Иди на https://github.com/qwertty111d-svg/astraapp/releases/new
3. Создай новый Release (tag: `v2.4.0`)
4. Загрузи `AstraSetup.exe` как asset
5. Кнопки на сайте автоматически будут скачивать последний релиз

## API Endpoints (сайт → приложение)

- `POST /api/desktop/login` — вход
- `GET  /api/desktop/session` — проверка сессии
- `GET  /api/desktop/license` — получение лицензии
- `POST /api/desktop/logout` — выход
- `POST /api/desktop/device/register` — регистрация устройства

## Требования

- Node.js 18+
- pnpm 10+
- Windows 10/11 (для сборки .exe)
