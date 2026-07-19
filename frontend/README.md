# NextChapter frontend

Vue 3 + [frappe-ui](https://github.com/frappe/frappe-ui) SPA, served at `/next-chapter`.

Same hosting pattern as [Frappe CRM](https://github.com/frappe/crm/blob/develop/crm/www/crm.py):

- Source: this folder
- Boot controller: `../next_chapter/www/next_chapter.py` (hyphens → underscores)
- Built assets: `../next_chapter/public/frontend/`
- Built HTML: `../next_chapter/www/next-chapter.html` (defines URL `/next-chapter`)

```bash
yarn
yarn dev     # against a running bench site
yarn build   # commit the output under next_chapter/
```
