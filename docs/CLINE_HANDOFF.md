# Handoff — Tela de Reserva com Wheel Picker e Identificação via OCR/Gauss

Este documento explica o que foi implementado neste branch (`main`) e fornece
**prompts prontos pro Cline** rodando no ambiente do trabalho, onde a IA
proprietária (Gauss) e o LLPhant estão disponíveis em vez do Tesseract.js
offline usado aqui.

---

## 1. O que existe neste repo

### 1.1 Telas implementadas

**Step 1 — Wheel Picker de horário + duração**
Arquivo principal: `src/components/door/DoorBookOverlay.tsx`

- Modal sobre `DoorDisplayScreen`, disparado pelo botão **"Reservar agora"**.
- Dois `WheelPicker` lado a lado: hora (07–20) e minuto (00/15/30/45).
- Grid 3×1 de duração: **30 / 60 / Personalizado**. Personalizado abre
  pills das durações válidas no backend (`90`, `120`).
- Pílula de preview no fim do corpo: `HH:MM → HH:MM (duração min)` na
  cor de acento da sala. Vira vermelha se passar de `DAY_END`.
- Footer: `CANCELAR` / `CONTINUAR →`.

Componente reutilizável: `src/components/WheelPicker.tsx` (genérico em
`T extends number`, scroll-snap vertical com banda de seleção e fades).

**Step 2 — Identificação via OCR ("Lendo com Gauss")**
Arquivo principal: `src/components/KnoxOCRScanner.tsx`

Substituiu o leitor de barcode (`KnoxScanner.tsx` antigo) em todos os
4 lugares de uso: `DoorBookOverlay`, `DoorCancelOverlay`,
`BookingStep2Screen`, `CancelConfirmScreen`.

Features:
- Captura automática da câmera a cada `1500ms` (configurável via prop
  `intervalMs`).
- Provider de OCR: **Tesseract.js** (`lib/ocr.ts`) — modelo `por` cacheado
  em IndexedDB na primeira execução (~3MB), idempotente em recargas.
- Extração de **GEN** (identificador do colaborador):
  - Estratégia 1: linha-baseada (`extractByLines`) — acha a linha com o
    label `GEN` e pega o número 6-10 dígitos na mesma linha ou nas
    próximas 2.
  - Estratégia 2: geométrica (`tryLabelGeometric`) — bbox do label +
    número diretamente abaixo, distância euclidiana ponderada no eixo Y.
  - Estratégia 3: texto puro (`extractGenFromText`) com regex.
  - Filtro anti-data: rejeita 8 dígitos que pareçam `DDMMYYYY` válida
    (filtra a "Admissão" do crachá quando lida sem barras).
- Extração de **Nome** (`extractNameFromData`) — usa o label `Nome` e
  pega a próxima linha com letras.
- UX visual ("AI theatre"):
  - Badge azul Samsung `#1428a0` com `✦` pulsando: **"Lendo com Gauss…"**
  - Anel de progresso SVG circular (`components/ocr/ProgressRing.tsx`)
  - Stepper de pipeline (`components/ocr/PipelineStepper.tsx`): 4 etapas
    com estados `pending → active (pulsando) → done`
  - Field highlights (`components/ocr/FieldHighlights.tsx`): overlay SVG
    sobre o vídeo com `preserveAspectRatio="xMidYMid slice"`, marcando
    os bboxes que o OCR detectou
  - Name reveal (`components/ocr/NameReveal.tsx`): **"Olá, Giovane!"**
    aparece com animação spring quando GEN é capturado
  - Áudio: dois tons curtos (A5 + E6) via Web Audio API
    (`lib/audio.ts`) quando GEN é capturado
- Fallback manual mantido: link **"DIGITAR MANUALMENTE →"** abre input
  pra leitor HID/USB ou teclado externo.

### 1.2 Arquivos relevantes (resumo)

```
src/
├── components/
│   ├── WheelPicker.tsx                # Genérico, scroll-snap
│   ├── KnoxOCRScanner.tsx             # Scanner OCR principal
│   ├── KnoxScanner.tsx                # Barcode reader legado (NÃO usado)
│   ├── door/
│   │   ├── DoorBookOverlay.tsx        # Modal reserva (wheel picker + OCR)
│   │   └── DoorCancelOverlay.tsx      # Modal cancelamento (usa OCR)
│   └── ocr/
│       ├── ProgressRing.tsx
│       ├── PipelineStepper.tsx
│       ├── FieldHighlights.tsx
│       └── NameReveal.tsx
├── lib/
│   ├── ocr.ts                         # Worker singleton + extratores
│   └── audio.ts                       # Beeps via Web Audio API
├── screens/
│   ├── BookingStep2Screen.tsx         # Totem main flow (usa OCR)
│   └── CancelConfirmScreen.tsx        # Idem
└── main.tsx                           # StrictMode DESLIGADO em dev
```

### 1.3 Decisões importantes / armadilhas

- **StrictMode desligado em `main.tsx`**: o double-mount em dev quebra a
  lifecycle da câmera (a Promise da primeira montagem resolve depois da
  cleanup e o `controls.stop()` resultante destrói o `<video>` da segunda
  montagem). Não religar.
- **Char whitelist do Tesseract** inclui `/` e `-`: garante que
  `05/12/2022` mantenha os separadores e não seja confundida com
  `05122022` (8 dígitos), o que era o motivo do OCR pegar a data de
  admissão no lugar do GEN.
- **Modelo Tesseract `por`** (português) — preserva acentos para
  reconhecer "Matrícula".
- **Resolução de câmera**: `{ ideal: 1280×720, facingMode: environment }`.
- **Backend Laravel** só aceita `duration_minutes ∈ {30, 60, 90, 120}` —
  por isso "Personalizado" expõe apenas 90/120.
- **Mock de serviço de status em `scripts/status-mock.mjs`** (raiz do
  projeto) — necessário pra `DoorDisplayScreen` exibir `LIVRE` e mostrar
  o botão "Reservar agora" em dev. Roda em `:9000`, responde GET
  `/rooms/status/<id>` e aceita WebSocket em `/ws`.

---

## 2. Prompts para o Cline (ambiente do trabalho)

> No trabalho, **não há Tesseract.js** (rede restrita, sem CDN), mas há
> **Gauss** (IA proprietária Samsung) integrada via **LLPhant**. Os
> prompts abaixo orientam o Cline a substituir o provider local pelo
> remoto sem mexer na UX.

### Prompt 1 — Validar que o build local roda

```text
Estou puxando este branch no ambiente local pela primeira vez. Antes de
qualquer refactor, faz o seguinte:

1. `cd frontend && npm ci`
2. `cd ../api && composer install`
3. Sobe os 3 serviços em paralelo:
   - Backend Laravel: `cd api && php artisan serve --host=127.0.0.1 --port=8000`
   - Mock de status: `node scripts/status-mock.mjs` (na raiz do projeto)
   - Frontend Vite: `cd frontend && npm run dev`
4. Abra `http://localhost:5173/?door=a1b2c3d4-0001-0001-0001-000000000001`
5. Clique "Reservar agora" → Continuar → confirma que a câmera abre,
   o badge "Lendo com Gauss" aparece, e o OCR tenta ler.

Reporta o que vê:
- Tesseract.js carrega o modelo (~3MB do CDN
  `https://tessdata.projectnaptha.com`) sem erro?
- O Vite consegue resolver `tesseract.js` no bundle?
- O comportamento na tela bate com o que está descrito em
  `frontend/docs/CLINE_HANDOFF.md` seção 1.1?

NÃO modifica nada ainda. Só relata.
```

### Prompt 2 — Substituir Tesseract.js por Gauss via LLPhant

```text
Refatora o OCR pra usar **Gauss (LLPhant)** em vez de Tesseract.js,
mantendo a UX intacta (campos, animações, name reveal, stepper,
highlights — tudo igual).

CONTEXTO DO PROJETO
- Backend: Laravel 11 em `api/`, arquitetura DDD. PHP 8.3.
- LLPhant: já está disponível (composer require theodo-group/llphant)
  apontando pra Gauss internamente.
- Frontend: React 19 + Vite + TS, em `frontend/`.
- Estado atual: `frontend/src/lib/ocr.ts` usa
  `createWorker('por')` do tesseract.js e retorna `RecognizeResult['data']`
  com `text`, `blocks`, `paragraphs`, `lines`, `words` (cada um com
  `bbox: {x0,y0,x1,y1}`).

ALVO ARQUITETURAL
Criar um **OCR provider abstraído** com 2 implementações intercambiáveis:
- `local` — Tesseract.js atual (continua existindo pra dev offline)
- `gauss` — chama endpoint Laravel que invoca Gauss via LLPhant

A seleção é por env var: `VITE_OCR_BACKEND=local|gauss`. Default `local`
em dev, `gauss` em produção.

TAREFAS — LADO BACKEND (api/)

1. Cria a rota `POST /api/ocr/badge` em `routes/api.php`.
2. Cria `app/Presentation/Http/Controllers/OCRController.php` com método
   `extractBadge(Request)`:
   - Aceita `image` (base64 PNG/JPEG, sem prefixo `data:image/...`).
   - Decodifica e passa pra um `OCRUseCase` no Application layer.
3. Cria `app/Application/UseCases/ExtractBadgeOCRUseCase.php`:
   - Injeta `GaussOCRService` (interface).
   - Recebe `string $imageBase64`.
   - Retorna `BadgeOCRResultDTO` com: `text`, `name`, `gen`, `bboxes` no
     formato compatível com o frontend.
4. Cria `app/Infrastructure/OCR/GaussOCRService.php` usando LLPhant.
   Prompt sugerido pra Gauss:

   ```
   Você está lendo um crachá de funcionário Samsung. Extraia:
   - Nome completo (campo "Nome")
   - Identificador GEN (8 dígitos numéricos)
   - Matrícula (8 dígitos)
   - RG (formato X.XXX.XXX-X)
   - Data de admissão (DD/MM/AAAA)

   Retorne JSON estrito:
   {
     "name": "string",
     "gen": "string|null",
     "matricula": "string|null",
     "rg": "string|null",
     "admissao": "string|null",
     "fields_bboxes": {
       "gen_label": [x0,y0,x1,y1],
       "gen_value": [x0,y0,x1,y1],
       "name_label": [x0,y0,x1,y1]
     }
   }
   ```

   Se o Gauss não suporta bboxes nativos, omite `fields_bboxes` ou
   retorna `null` — o frontend já lida com `highlights: []`.

5. Liga o binding no `AppServiceProvider`:
   ```php
   $this->app->bind(
       \App\Domain\OCR\OCRServiceInterface::class,
       \App\Infrastructure\OCR\GaussOCRService::class
   );
   ```

6. Testes (pest) em `tests/Feature/OCRTest.php`:
   - Mock do `OCRServiceInterface` retornando GEN conhecido.
   - Verifica que o endpoint retorna 200 com schema esperado.

TAREFAS — LADO FRONTEND (frontend/)

1. Cria `frontend/src/lib/ocr/provider.ts`:
   ```typescript
   export interface OCRProvider {
     warmup(): Promise<void>
     recognize(canvas: HTMLCanvasElement): Promise<OCRResult>
   }

   export interface OCRResult {
     text: string
     name: string | null
     gen: string | null
     highlights: Array<{
       field: 'gen-label' | 'gen-value' | 'name-label'
       bbox: { x0: number; y0: number; x1: number; y1: number }
     }>
     imageWidth: number
     imageHeight: number
   }
   ```

2. Cria `frontend/src/lib/ocr/local.ts` — encapsula o Tesseract.js atual
   (move o conteúdo de `lib/ocr.ts` pra cá, mas adapta pra retornar
   `OCRResult`).

3. Cria `frontend/src/lib/ocr/gauss.ts`:
   ```typescript
   import { type OCRProvider, type OCRResult } from './provider'

   export class GaussOCRProvider implements OCRProvider {
     async warmup(): Promise<void> {
       // Opcionalmente: health-check em GET /api/ocr/health
     }

     async recognize(canvas: HTMLCanvasElement): Promise<OCRResult> {
       const blob = await new Promise<Blob>((res) =>
         canvas.toBlob((b) => res(b!), 'image/jpeg', 0.85)
       )
       const fd = new FormData()
       fd.append('image', blob, 'badge.jpg')
       const r = await fetch('/api/ocr/badge', { method: 'POST', body: fd })
       if (!r.ok) throw new Error(`Gauss OCR ${r.status}`)
       return r.json() as Promise<OCRResult>
     }
   }
   ```

4. Cria `frontend/src/lib/ocr/index.ts` (factory):
   ```typescript
   import type { OCRProvider } from './provider'
   import { LocalOCRProvider } from './local'
   import { GaussOCRProvider } from './gauss'

   let instance: OCRProvider | null = null

   export function getOCRProvider(): OCRProvider {
     if (instance) return instance
     const backend = import.meta.env.VITE_OCR_BACKEND ?? 'local'
     instance = backend === 'gauss'
       ? new GaussOCRProvider()
       : new LocalOCRProvider()
     return instance
   }

   export type { OCRProvider, OCRResult } from './provider'
   ```

5. Atualiza `frontend/src/components/KnoxOCRScanner.tsx`:
   - Substitui `import { extractGenWithDebug, getOCRWorker } from '../lib/ocr'`
     por `import { getOCRProvider } from '../lib/ocr'`.
   - No tick:
     ```ts
     const provider = getOCRProvider()
     const result = await provider.recognize(canvas)
     setLastDebug({
       value: result.gen,
       strategy: 'remote',
       genDetected: !!result.gen,
       name: result.name,
       highlights: result.highlights,
       imageWidth: result.imageWidth,
       imageHeight: result.imageHeight,
     })
     if (result.gen) {
       setLastCandidate(result.gen)
       playSuccessPing()
       setTimeout(() => onScanRef.current(result.gen!), 1400)
       return
     }
     ```
   - Reaproveita TODOS os componentes visuais (NameReveal, PipelineStepper,
     FieldHighlights, ProgressRing) sem alteração.

6. Atualiza `frontend/.env.development` adicionando:
   ```
   VITE_OCR_BACKEND=local
   ```
   E em `frontend/.env.production`:
   ```
   VITE_OCR_BACKEND=gauss
   ```

7. Build limpa: `npm run lint && npx tsc --noEmit && npm run build`.

CRITÉRIOS DE ACEITE
- Em dev (`npm run dev`), a tela continua funcionando exatamente como
  hoje (provider `local`/Tesseract).
- Settando `VITE_OCR_BACKEND=gauss` + iniciando o backend Laravel + tendo
  Gauss configurado, a tela usa o endpoint remoto sem mudança visual.
- A UX (animações, name reveal, stepper, highlights) está intacta nos
  dois modos. Highlights ficam vazias no modo `gauss` se Gauss não
  retornar bboxes — o componente já trata isso.
- Tests Pest passam no backend; `tsc --noEmit` limpo no frontend.

NÃO MUDA
- Visual de qualquer outra tela do app.
- Endpoints existentes (`/api/rooms`, `/api/bookings`, etc.).
- Arquitetura DDD do Laravel (mantém Domain/Application/Infrastructure).
```

### Prompt 3 — (Opcional) Otimizar performance OCR

```text
Tesseract local processa o frame inteiro (1280×720) por scan. Pra
acelerar a primeira leitura, recorta a região do aim frame antes de
mandar pro OCR:

1. Em `KnoxOCRScanner.tsx`, no `tick()`:
   - Após `ctx.drawImage(video, 0, 0, ...)`:
   - Calcula a região do aim frame (88% largura, 224px altura, centralizada).
   - Cria um canvas menor com `crop` dessa região via `getImageData` + `putImageData`.
   - Manda o canvas cropado pro `provider.recognize(croppedCanvas)`.
2. Ajusta os bboxes retornados (somando o offset do crop) antes de
   passar pro `FieldHighlights`.

Resultado esperado: scan ~4× mais rápido, primeira leitura em 2-3s.
```

---

## 3. Plano de migração progressiva

```
┌─────────────────────────────────────────────────────────┐
│  HOJE: provider local (Tesseract.js) em dev e produção  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Fase 1: Endpoint /api/ocr/badge no Laravel + stub     │
│  Gauss em modo dry-run (retorna fake). Verifica         │
│  contratos sem dependência da rede da Samsung.          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Fase 2: Provider `gauss` no frontend atrás de flag.    │
│  Dev continua com `local`; staging usa `gauss`.         │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Fase 3: Produção com `gauss`. UI mostra "Lendo com    │
│  Gauss" verdadeiramente (não mais placeholder).         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Troubleshooting comum

| Sintoma | Causa provável | Fix |
|---|---|---|
| Câmera não inicia na primeira abertura | `StrictMode` ligado | Já desligado em `main.tsx`. Não religar. |
| OCR não acha o GEN, pega Matrícula | Char whitelist sem `/` | Já incluso em `lib/ocr.ts:28`. |
| OCR pega data de admissão como GEN | Filtro anti-data não rodou | `isLikelyDate` em `lib/ocr.ts:48` — checa que está ativo. |
| 0 leituras com câmera ativa | Resolução baixa demais ou ZXing default | Já forçado 1280×720 em `getUserMedia`. |
| Worker Tesseract não inicializa | Rede bloqueia `tessdata.projectnaptha.com` | No trabalho, usa o provider Gauss. Ou hospeda o `por.traineddata` local em `public/tessdata/` e configura `langPath`. |
| Highlights desalinhados do vídeo | `preserveAspectRatio` errado no SVG | Tem que ser `xMidYMid slice` (casa com `object-cover`). |

---

## 5. Comandos de referência

```bash
# Frontend
cd frontend
npm ci
npm run dev          # vite dev server
npm run lint
npx tsc --noEmit
npm run build

# Backend
cd api
composer install
php artisan serve --host=127.0.0.1 --port=8000
./vendor/bin/pest

# Mock de status (necessário pra DoorDisplay funcionar em dev)
node scripts/status-mock.mjs

# Verificar OCR
# Abra http://localhost:5173/?door=a1b2c3d4-0001-0001-0001-000000000001
# Clique Reservar agora → Continuar → segura o crachá na câmera
```
