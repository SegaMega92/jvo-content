# Промпт для распознавания layout карточки маркетплейса

Этот промпт нужно передать GPT-4o Vision / Claude вместе с изображением карточки товара.

---

## Промпт

```
Проанализируй это изображение карточки товара для маркетплейса.

Определи расположение всех визуальных блоков и верни JSON с координатами.

Размер карточки: 900×1200 пикселей. Все координаты — в пикселях от верхнего-левого угла.

Для каждого элемента укажи:
- type: "rect" (для текстовых блоков, бейджей, декоративных элементов) или "image" (для фото товара)
- x, y: координаты верхнего-левого угла
- width, height: размер блока
- label: семантическое название (например "title", "advantage-1", "feature-1", "product-photo", "accent-bar")
- color: цвет блока (hex или rgba). Для текстовых блоков укажи цвет фона/подложки, для декоративных — их цвет.

Типы блоков, которые нужно найти:
1. **title** — основной заголовок (крупный текст)
2. **advantage-1**, **advantage-2** — бейджи с преимуществами
3. **feature-1**, **feature-2**, ... — характеристики товара (мелкий текст)
4. **product-photo** — область с фотографией товара
5. **accent-bar** — декоративные полосы, линии, акцентные элементы
6. **background** — если есть отдельные фоновые зоны

Верни ТОЛЬКО валидный JSON в формате:

{
  "canvas": {
    "width": 900,
    "height": 1200,
    "background": "#f5eedb"
  },
  "elements": [
    {
      "type": "rect",
      "x": 60,
      "y": 100,
      "width": 520,
      "height": 200,
      "color": "#dcc7aa",
      "label": "title",
      "zIndex": 2
    },
    {
      "type": "image",
      "x": 300,
      "y": 80,
      "width": 580,
      "height": 1040,
      "label": "product-photo",
      "zIndex": 3
    }
  ]
}

Важно:
- Координаты должны быть точными — максимальная погрешность ±10px
- zIndex определяет порядок наложения: фон=1, текст=2, фото товара=3, бейджи=5
- Если элемент перекрывает другой, у верхнего zIndex выше
- Цвет background в canvas — основной цвет фона карточки
- Для фото товара используй type: "image", для всего остального type: "rect"
```

---

## Как использовать

### С Claude API:

```bash
# Закодировать картинку в base64
BASE64=$(base64 -i card-example.png)

curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "content-type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 4096,
    "messages": [{
      "role": "user",
      "content": [
        {
          "type": "image",
          "source": { "type": "base64", "media_type": "image/png", "data": "'$BASE64'" }
        },
        {
          "type": "text",
          "text": "<ПРОМПТ ВЫШЕ>"
        }
      ]
    }]
  }'
```

### С OpenAI API:

```bash
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{
      "role": "user",
      "content": [
        { "type": "image_url", "image_url": { "url": "data:image/png;base64,'$BASE64'" } },
        { "type": "text", "text": "<ПРОМПТ ВЫШЕ>" }
      ]
    }],
    "response_format": { "type": "json_object" }
  }'
```

### Результат → рендер

Полученный JSON сразу передаётся в наш сервис:

```bash
# Сохранить ответ AI в layout.json, затем:
curl -X POST http://89.23.99.66:8082/api/render-layout \
  -F "image=@product-photo.jpg" \
  -F "layout=@layout.json" \
  -o result.png
```

Или для превью (HTML без рендера):
```bash
curl -X POST http://89.23.99.66:8082/api/render-layout?mode=preview \
  -F "image=@product-photo.jpg" \
  -F "layout=@layout.json" \
  -o preview.html
```
