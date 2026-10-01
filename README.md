# MammaMia! Studio

Алматыдағы ойдан шығарылған фотостудия және шығармашылық шеберханаға арналған толық жұмыс істейтін демо.

## Ашу

```sh
cd /Users/aruispan/demo
npm install
npm run dev -- --port 5173
```

Браузер: http://localhost:5173

Бір Wi-Fi желісіндегі телефоннан ашу үшін Vite терминалында көрсетілген `Network` сілтемесін қолданыңыз. Интернетке жарияланған сайт емес: жергілікті компьютер қосылып, сервер жұмыс істеп тұруы керек. Clipboard API браузерге байланысты HTTP желілік мекенжайда бұғатталуы мүмкін; демо мұндай жағдайда мәтінді қолмен көшіруге белгілейді. `localhost` және HTTPS нұсқасында кәдімгі көшіру жұмыс істейді.

Жеке беттер:

- http://localhost:5173/offers/light-room
- http://localhost:5173/offers/clay-date
- http://localhost:5173/offers/paint-evening

Әдепкі тіл — қазақша. KZ / RU таңдауы құрылғыда сақталады. Барлық негізгі мәтіндер, қателер, күн атаулары және сұраныс екі тілде жұмыс істейді.

## Өзгерту

- `src/config.ts`: қызметтер, бағалар, сипаттамалар, сыйымдылық, ұзақтық, кесте, байланыс, `studio.whatsappNumber`.
- `src/i18n.ts`: қазақша/орысша интерфейс мәтіндері.
- `src/styles.css`: негізгі responsive орналасу. `src/aegean-theme.css`: «Mamma Mia!» көңіл күйіндегі көк-ақ дизайн, Lora тақырыптары, жұмыр бұрышты батырмалар, грек өрнегі және сары/гүл түсті акценттер. Tailwind Vite плагині қосылған.
- `src/fonts.css` және `public/fonts/`: сайтпен бірге берілетін Lora және Manrope WOFF2 қаріптері; Latin, Cyrillic және Cyrillic Extended жиынтықтары. Лицензиялар сол бумада.
- `src/controls.css`: билет стиліндегі ашық сары батырмалар, көк жиек, ішкі сызық, мәтіндік сүзгілер және күн/уақыт таңдауының күйлері.
- `src/CreativePlayground.tsx` және `src/creative-playground.css`: бірінші экрандағы скроллмен өрнектеліп, гүлденетін құмыра және жазылу/WhatsApp сілтемесі. Бөлімнің екі тілдегі мәтіндері компонент ішіндегі `words` нысанында.
- `src/ScrollExperience.tsx` және `src/scroll-experience.css`: скролл прогресі, қозғалатын күлтелер, күн мен толқындар, фотоның ашылуы және бөлімдердің кезекпен пайда болуы. Қалыпты скролл сақталады; `prefers-reduced-motion` режимінде сәндік қозғалыс өшіріледі.
- `src/booking.ts`: кесте шектеулері, баға есебі, екі тілдегі сұраныс мәтіні.
- `src/requests.ts`: телефон форматын тексеру, демо-өтінішті автоматты қабылдау, қайталануды болдырмау және сақтау. Баптаулары: `studio.requests` (`src/config.ts`).
- `public/images/`: жергілікті оңтайландырылған WebP суреттері.

WhatsApp-ты қосу үшін `studio.whatsappNumber` ішіне әкімшінің нақты халықаралық нөмірін енгізіңіз. Нөмір бос немесе жарамсыз кезде батырма сөндірулі. Сайт тек алдын ала толтырылған WhatsApp терезесін ашады; хабарламаны автоматты жібермейді.

Кесте бүгіннен бастап 30 күнге арналған, Алматы уақытымен есептеледі. Өткен күндер/уақыттар, жабық уақыттар, сыйымдылықтан асатын топтар және жабық сағатты қамтитын жалға алу таңдалмайды. Фотозал: 12 000 ₸ × сағат (1–4). Сурет: 10 000 ₸ × адам. Қыш: екі адамға 24 000 ₸. Өтініштің қабылдануы нақты орын сақтамайды және броньді растамайды.

## Бірінші экрандағы интерактив

Басты бетті ашқанда мәтінмен қатар қыш құмыра көрінеді. Скролл жасағанда алғашқы экран уақытша орнында тұрады: құмыра боялады, өрнек салынады, жапырақтар мен гүлдер біртіндеп ашылады. Кері скролл анимацияны кері айналдырады. Түс пен пішін таңдағыштары және бөлек интерактив бөлімі алынып тасталған.

Бүкіл сурет — басылатын сілтеме. `studio.whatsappNumber` бос немесе жарамсыз болса, `/#booking` жазылу формасына апарады. Жарамды менеджер нөмірі бапталса, KZ/RU тіліндегі дайын мәтінмен WhatsApp чатын жаңа бетте ашады; хабарлама автоматты жіберілмейді.

Интерактив пернетақта және сенсорлық экранмен жұмыс істейді. `prefers-reduced-motion` кезінде толық композиция бірден көрінеді, ұзартылған скролл аймағы мен қозғалыс өшіріледі. Қысқа экрандарда алғашқы бөлім кәдімгі блокқа айналады. SVG кодпен салынған; сыртқы сервис қажет емес.

## Өтінішті автоматты қабылдау (демо)

1. Қызмет, күн, уақыт, қатысушы/сағат санын және телефон нөмірін енгізіңіз.
2. «Өтініш жіберу» батырмасы телефон форматын және кестені тексереді.
3. Өтініш сәтті сақталғаннан кейін «Өтінішіңіз қабылданды!» экраны, `MM-…` нөмірі және таңдау қорытындысы шығады. Сақтау қатесінде қабылданды деп көрсетілмейді.
4. Бетті жаңартқанда соңғы өтініш қайта көрсетіледі. Бірдей нөмір мен бірдей таңдауды қайта жіберу қайталама өтініш жасамайды.
5. «Осы демо-өтінішті өшіру» батырмасы өтініш пен оның телефон нөмірін осы браузерден өшіреді.

Өтініштер тек **осы браузердің localStorage қоймасында** сақталады, басқа құрылғыға немесе әкімшіге жіберілмейді. Ең көбі 50 жазба сақталады; 30 күннен асқан жазбалар сайт келесі оқығанда өшіріледі. Нөмірді SMS арқылы растау жоқ. Бұл — өтініш қабылдау сценарийінің демонстрациясы, нақты backend/CRM емес. Нақты жеткізу үшін әкімші арнасы және серверлік сақтау мен интеграция бөлек қосылуы керек. WhatsApp сілтемесі болса да, хабарлама өздігінен жіберілмейді.

Хабарламаның көшірмесі қабылдау экранындағы жиналмалы бөлімде. Нақты броньді әкімші растайды.

## Тексеру және жинау

```sh
npm test
npm run build
# Dev-сервер жұмыс істеп тұрғанда:
npm run test:browser
```

Браузер тесттері macOS-та орнатылған Google Chrome-ды қолданады. Басқа ортада `npx playwright install chromium` орнатыңыз. Тексерілетін өлшемдер: 1440×1000, 768×1024, 390×844, қосымша 320×740.

`npm run preview -- --port 4173` — production жинақты жергілікті қарау. Статикалық хостингке `dist/` бумасын жүктеңіз. `/offers/*` тікелей URL-дері үшін хостингте SPA fallback (`/* → /index.html`, HTTP 200) қосылуы қажет. Netlify/Cloudflare Pages үшін `public/_redirects` дайын.

Тест скриншоттары `artifacts/` ішінде. Екі тіл, сүзгілер, deep link + reload, галерея + Escape/focus, FAQ, мобильді мәзір, баға, бос емес уақыт, өткен күн, дайын сұраныс, clipboard, телефон валидациясы, автоматты қабылдау, reload-тан кейін сақтау, өшіру және сақтау қатесі тексеріледі.

## Суреттер

Үш негізгі сурет арнайы осы демо үшін built-in imagegen арқылы генерацияланған. Қазіргі нұсқа «Mamma Mia!» (2008) фильміндегі грек аралдарының атмосферасын береді: ақ қабырғалар, көк терезелер, бугенвиллея және жазғы жарық. Бұл — ойдан шығарылған визуалдық тұжырымдама. Басқа студияның логотиптері немесе жұмыстары көшірілмеген. Галереядағы `*-detail.webp` — сол суреттердің бөлшектері. Қазіргі файлдар мен промпттар: `ASSETS-AEGEAN.md`; бастапқы нұсқа: `ASSETS.md`.

Төлем, аккаунт ашу, жеке кабинет, backend, аналитика және сыртқа дерек жіберу жоқ. Телефон нөмірі демо-өтінішпен бірге осы браузерде ғана сақталады. Барлық байланыс деректері үлгі, `.example` поштасы нақты мекенжай емес.

## October 2026 usability update

The hero now explicitly names the Almaty photo studio, pottery and painting lessons in both languages. Navigation, captions, descriptions and booking labels use larger type. Service pages have a booking link beside the price. Photo frames share a uniform corner radius and fine border; route changes have a short entrance animation that respects reduced-motion preferences.

CLAY DATE now shows three separate existing demo images (session, interior and pottery process), with captions and an explicit generated-image disclosure. Actual instructor photos, finished products and verified customer reviews still need to be supplied by the studio; none are fabricated here.

To enable the prepared WhatsApp booking flow, enter the real administrator number in `studio.whatsappNumber` in `src/config.ts`. The form then prepares the service, date, time, party size, price and callback number for WhatsApp, without saving a demo receipt or claiming that the administrator received it. The visitor must open WhatsApp and send the message. This is a manual handoff, not automatic server delivery or a live availability system. Automatic delivery requires the owner's chosen CRM/backend integration.

`studio.contact.phone` enables a telephone link and `studio.contact.mapUrl` enables a map link. Replace the demo address, email, hours, prices, schedule and relevant demo labels with verified business details before launch. No real recipient or address is configured in this checkout.
# mammamia
