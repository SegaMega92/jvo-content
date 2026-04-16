# Infographic Generation Service

Сервис генерации продуктовых инфографик для маркетплейсов (Wildberries, Ozon). Принимает фото товара, текст и название шаблона — возвращает готовую инфографику в формате PNG.

## Возможности

- **Удаление фона** — автоматическое вырезание товара из фона
- **Эффект "текст за моделью"** — z-index композитинг для профессионального вида
- **Извлечение цветовой палитры** — автоматический подбор акцентного цвета
- **3 шаблона**: fashion-model, product-features, minimal-clean
- **Полная поддержка кириллицы**

## Быстрый старт

### Docker (рекомендуется)

```bash
docker-compose up --build
```

Сервис будет доступен на `http://localhost:3000`.

### Локальный запуск

```bash
# 1. Установить зависимости
npm install

# 2. Установить Playwright Chromium
npx playwright install chromium

# 3. Скачать шрифты
bash scripts/download-fonts.sh

# 4. Запустить
npm run dev
```

## API

### `GET /health`
Проверка состояния сервиса.

### `GET /api/templates`
Список доступных шаблонов.

### `POST /api/generate`

Генерация инфографики. `Content-Type: multipart/form-data`.

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `image` | File | Да | Фото товара (JPEG/PNG/WebP) |
| `template` | string | Да | Название шаблона |
| `title` | string | Да | Заголовок |
| `subtitle` | string | Нет | Подзаголовок |
| `features` | JSON | Нет | Массив `[{icon, text}]` |
| `accentColor` | string | Нет | HEX цвет (авто из фото) |
| `outputWidth` | number | Нет | Ширина, по умолчанию 1080 |
| `outputHeight` | number | Нет | Высота, по умолчанию 1350 |

Ответ: `image/png`.

#### Пример с curl

```bash
curl -X POST http://localhost:3000/api/generate \
  -F "image=@product.jpg" \
  -F "template=fashion-model" \
  -F "title=БЕЛАЯ РУБАШКА" \
  -F "subtitle=Хлопок 100%" \
  -F 'features=[{"icon":"cotton","text":"Натуральный хлопок"},{"icon":"scissors","text":"Свободный крой"}]' \
  -o result.png
```

## Шаблоны

### fashion-model
Эффект «текст за моделью». Фон удаляется, текст размещается между фоном и вырезанным объектом. Подходит для одежды.

### product-features
Товар по центру на градиентном фоне, крупный заголовок сверху, карточки характеристик внизу. Универсальный шаблон.

### minimal-clean
Минималистичный стиль. Белый фон, элегантная типографика, акцентная полоса.

## Доступные иконки

`cotton`, `scissors`, `size`, `safety`, `wash`, `eco`, `star`, `delivery`

## Технологии

- Node.js 20 + TypeScript
- Express + Multer
- Playwright (Chromium) — рендеринг HTML → PNG
- Sharp — обработка изображений
- @imgly/background-removal-node — удаление фона
- Handlebars — шаблонизация
