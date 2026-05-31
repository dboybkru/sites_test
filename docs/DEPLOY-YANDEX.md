# Деплой на Yandex Object Storage (без VPN, работает в РФ)

Сборка даёт статику `showcase/dist` — её кладём в бакет с включённым «хостингом сайта».
Загрузку делает `scripts/deploy-yc.mjs` через S3-совместимый API (Node, без сторонних CLI).

## Один раз: настройка в консоли Yandex Cloud

1. **Аккаунт и платёжка.** Зайди в [console.yandex.cloud](https://console.yandex.cloud), создай облако/каталог, привяжи платёжный аккаунт (для статики расход — копейки).

2. **Бакет.** Object Storage → *Создать бакет*:
   - Имя: любое уникальное (если будет свой домен — назови бакет = домену, напр. `sites.example.ru`).
   - Доступ: **публичный на чтение объектов** (Read).
   - Создать.

3. **Хостинг сайта.** Открой бакет → вкладка *Веб-сайт* → *Хостинг*:
   - Главная страница: `index.html`
   - Страница ошибки: `index.html` (или своя 404)
   - Сохрани. Появится адрес вида `https://<бакет>.website.yandexcloud.net`.

4. **Сервисный аккаунт + ключ.** Сервисные аккаунты → *Создать* (роль `storage.editor`) →
   у созданного аккаунта *Создать новый ключ* → **Статический ключ доступа**.
   Сохрани `key_id` и `secret` — секрет показывается один раз.

## Один раз: локально

```powershell
copy .env.example .env
# впиши YC_ACCESS_KEY_ID, YC_SECRET_ACCESS_KEY, YC_BUCKET
npm install   # если ещё не ставил (нужен @aws-sdk/client-s3)
```

## Каждый деплой

```powershell
npm run build:all   # собрать витрину + все сайты в showcase/dist
npm run deploy:yc   # залить в бакет (с удалением устаревших файлов)
```

Открывается по `https://<бакет>.website.yandexcloud.net`, сайты — под `/s/<slug>/`.

## Свой домен (опционально)

- Назови бакет = домену (`sites.example.ru`).
- В DNS добавь CNAME `sites.example.ru → <бакет>.website.yandexcloud.net`.
- HTTPS на своём домене: через Yandex Cloud CDN + сертификат (или поставь Cloudflare-фронт —
  но учти, что Cloudflare в РФ тоже замедляют; для чистого РФ-доступа лучше Yandex CDN).

## CI (позже)

Тот же `deploy:yc` можно запускать из GitHub Actions: положи `YC_ACCESS_KEY_ID`/`YC_SECRET_ACCESS_KEY`/`YC_BUCKET`
в Secrets репозитория и вызывай `npm ci && npm run build:all && npm run deploy:yc`.
