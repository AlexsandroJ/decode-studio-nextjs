
📊 CAN Studio - Documentação Completa do Frontend

  

CAN Studio é uma plataforma web moderna para análise, decodificação e visualização em tempo real de dados CAN Bus e sensores IoT, construída com Next.js 16, TypeScript, Tailwind CSS e MQTT.

  

## Sumário

---

- [1. Visão Geral](#1-visão-geral)

- [2. Stack Tecnológica](#2-stack-tecnológica)

- [3. Estrutura de Pastas](#4-estrutura-de-pastas)

- [4. Contextos Globais](#4-contextos-globais)

- [5. Componentes Principais](#5-componentes-principais)

- [6. Hooks Customizados](#6-hooks-customizados)

- [7. Tipos TypeScript](#7-tipos-typescript)

- [8. API e Endpoints](#8-api-e-endpoints)

- [9. Exemplos de Payloads JSON](#9-exemplos-de-payloads-json)

- [10. Simuladores](#10-simuladores)

- [11. Dashboard de Visualização](#11-dashboard-de-visualização)

- [12. Guia de Uso](#12-guia-de-uso)

- [13. Variáveis de Ambiente](#13-variáveis-de-ambiente)

- [14. Comandos Úteis](#14-comandos-úteis)

  

---

  

### 1. Visão Geral

O CAN Studio é dividido em dois módulos principais:

| Decoder Studio | Editor de frames CAN, criação de regras de decodificação, byte analyzer e envio via HTTP/MQTT |

| Move Viewer | Dashboard dinâmico com widgets configuráveis para visualização em tempo real de sinais CAN e sensores |

  

Funcionalidades Principais

  

✅ Editor visual de bits (matriz 8x8 = 64 bits)

✅ Criação e edição de regras de decodificação CAN

✅ Byte Analyzer com detecção automática de frequência

✅ Painel de sensores com agrupamento por sensorId

✅ Dados unificados (CAN + Sensores)

✅ Dashboard com widgets dinâmicos

✅ Field Explorer para objetos complexos

✅ Atualização em tempo real via polling HTTP

✅ Ingestão de dados via MQTT

✅ Persistência local (localStorage)

✅ Log completo de requisições

  

### 2. Stack Tecnológica

```json

{

"framework": "Next.js 16.3.4 (Turbopack)",
"language": "TypeScript (Strict Mode)",
"styling": "Tailwind CSS v4",
"state": "React Context API + Hooks",
"realtime": "MQTT (via mqtt.js) + HTTP Polling",
"charts": "SVG nativo (Sparklines)",
"icons": "Lucide React / Emojis nativos",
"build": "npm run build (prerendered static)",
"packageManager": "npm"
}
```
  

Dependências Principais

```json

{
    "dependencies": {
    "next": "16.3.4",
    "react": "^19",
    "react-dom": "^19",
    "mqtt": "^5.x",
    "uuid": "^9.x"
    },

    "devDependencies": {
    "typescript": "^5.x",
    "tailwindcss": "^4.x",
    "@types/node": "^20.x",
    "@types/react": "^19",
    "@types/uuid": "^9.x"
    }
}
```
### 3. Estrutura de Pastas

```
src/
├── app/
│   ├── globals.css              # Estilos globais + tema dark
│   ├── layout.tsx               # Root layout com Providers
│   ├── page.tsx                 # Página principal (Decoder Studio)
│   ├── not-found.tsx            # Página 404 customizada
│   └── components/
│       ├── TabsPanel.tsx        # Navegação entre abas
│       ├── SignalEditor.tsx     # Editor de regras de decodificação
│       ├── FrameEditor.tsx      # Matriz de bits (64 bits)
│       ├── Toast.tsx            # Sistema de notificações
│       ├── ByteAnalyzer/        # Análise de bytes CAN
│       │   ├── index.tsx
│       │   └── useAnalyzerData.ts
│       ├── SensorsPanel.tsx     # Painel de sensores
│       ├── UnifiedPanel.tsx     # Dados unificados
│       ├── LogPanel.tsx         # Log de requisições
│       └── Viewer/              # Módulo Move Viewer
│           ├── ViewPanel.tsx    # Dashboard principal
│           ├── ConfigModal.tsx  # Modal de configuração
│           ├── WidgetCard.tsx   # Cartão de widget
│           ├── FieldExplorer.tsx # Explorador de campos
│           └── WidgetRenderers.tsx # Renderizadores visuais
│
├── context/
│   ├── CANStudioContext.tsx     # Estado global do Decoder
│   ── ViewerContext.tsx        # Estado global do Viewer
│
├── hooks/
│   ├── useCANActions.ts         # Ações do Decoder Studio
│   └── useViewerLive.ts         # Polling em tempo real
│
└── lib/
    └── utils.ts                 # Helpers (hexToBytes, bytesToHex, etc.)
  ```
  
### 4. Contextos Globais

  

### 4.1 CANStudioContext

  
```
Gerencia todo o estado do Decoder Studio:

typescript

interface CANStudioContextType {

// Config

baseUrl: string;

setBaseUrl: (url: string) => void;

  

// Frame Editor

canId: string;

setCanId: (id: string) => void;

bytes: number[];

setBytes: (bytes: number[]) => void;

selectedBits: Set;

setSelectedBits: (bits: Set) => void;

lastClickedBit: number | null;

setLastClickedBit: (bit: number | null) => void;

  

// Rules

rules: Rule[];

setRules: (rules: Rule[]) => void;

editingRuleId: string | null;

setEditingRuleId: (id: string | null) => void;

  

// Analyzer

analyzer: AnalyzerState;

setAnalyzer: React.Dispatch>;

  

// Log & Toast

requestLog: LogEntry[];

addLog: (log: LogEntry) => void;

clearLog: () => void;

toast: ToastState;

showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;

  

// API Methods

api: {

health: () => Promise;

getFrames: (limit?: number) => Promise;

postFrame: (frame: any) => Promise;

getRules: () => Promise;

postRules: (rules: any[]) => Promise;

updateRule: (id: string, rule: any) => Promise;

deleteRule: (id: string) => Promise;

getSensors: (limit?: number) => Promise;

postSensor: (sensor: any) => Promise;

deleteSensors: () => Promise;

getUnified: (params?: any) => Promise;

mergeUnified: (windowMs: number) => Promise;

deleteUnified: () => Promise;

};

}
```
  

### 4.2 ViewerContext

  
```
Gerencia o estado do Move Viewer (Dashboard):

typescript

interface ViewerContextType {

baseUrl: string;

setBaseUrl: (url: string) => void;

isLive: boolean;

setIsLive: (live: boolean) => void;

refreshInterval: number;

setRefreshInterval: (ms: number) => void;

lastUpdate: number | null;

setLastUpdate: (ts: number | null) => void;

widgets: Widget[];

addWidget: (widget: Omit) => void;

addWidgets: (widgets: Omit[]) => void;

updateWidget: (id: string, rawData: any) => void;

updateWidgetConfig: (id: string, updates: Partial) => void;

removeWidget: (id: string) => void;

clearWidgets: () => void;

sensorSamples: SensorDataSample[];

loadSensorSamples: () => Promise;

getSensorFields: (sensorId: string) => FieldInfo[];

availableRules: IDecodingRule[];

availableSensors: ISensorReading[];

availableUnified: IUnifiedRecord[];

loadData: () => Promise;

savedConfigs: any[];

saveConfig: (name: string) => void;

loadConfig: (name: string) => void;

deleteConfig: (name: string) => void;

}
```
  

### 5. Componentes Principais

  

### 5.1 SignalEditor.tsx

  

Editor de regras de decodificação CAN com:

Detecção automática de mudanças (hasChanges)

Snapshot de estado original para comparação

Salvamento inteligente (POST para criar, PUT para editar)

Preview em tempo real (Raw Value hex/decimal + Physical Value)

Extração de valor usando BigInt para precisão

  

Fluxo de trabalho:

Selecionar bits na matriz

Preencher propriedades do sinal

Visualizar valor calculado

Salvar (cria ou atualiza)

  

### 5.2 WidgetCard.tsx

  

Cartão de widget com auto-detecção de renderizador:

typescript
```
    function getBestRenderer(w: Widget) {
    if (w.displayType === 'gauge') return GaugeWidget;
    if (w.displayType === 'table') return TableWidget;
    if (Array.isArray(w.currentValue)) {
    return typeof w.currentValue[0] === 'object' ? TableWidget : ArrayWidget;
    }
    if (typeof w.currentValue === 'number') return NumberWidget;
    if (typeof w.currentValue === 'boolean') return LedWidget;
    if (typeof w.currentValue === 'object') return JsonWidget;
    return TextWidget;
    }
```
  

### 5.3 FieldExplorer.tsx

  
Explorador hierárquico de campos de sensores complexos:
- Suporta objetos aninhados e arrays
- Busca em tempo real
- Seleção múltipla
- Indicadores visuais de tipo (number, string, boolean, array)
- Botões "Expandir tudo" / "Recolher tudo"

  

### 5.4 ConfigModal.tsx

  

Modal de configuração do Dashboard com 3 abas:
- 📡 Sinais CAN: Lista regras de decodificação
️- Sensores: Agrupados por sensorId único
- Unified: Dados unificados

  

### 5.5 ViewPanel.tsx

  

Dashboard principal com:

- Barra de controle (Live/Pause, Refresh, Intervalo)
- Grid responsivo de widgets
- Indicador de status de conexão
- URL da API editável


### 6 Hooks Customizados


### 6.1 useCANActions

  

Hook que encapsula todas as ações do Decoder Studio:

typescript
```
const {
    handleLoadExample,
    handleRandomize,
    handleCheckHealth,
    handleSendFrameWithRules,
    handleSendFrameOnly,
    handleLoadRulesFromApi,
    handleClearRules,
    handleSyncRules,
    handleLoadRule,
    handleDeleteRule
} = useCANActions();
```
  

### 6.2 useViewerLive

  
Hook de polling em tempo real:

- Configuração de intervalo (100ms a 60s)
- Prevenção de chamadas sobrepostas (isFetchingRef)
- Atualização automática de widgets baseada em sensorId
- Suporte a fetch manual



### 7. Tipos TypeScript

  

### 7.1 Rule (Regra de Decodificação)

typescript
```
interface Rule {
	id: string;
	canId: string;
	signalName: string;
	startBit: number; // 0-63
	bitLength: number; // 1-64
	byteOrder: 'big' | 'little';
	signed: boolean;
	factor: number; // Ex: 0.25
	offset: number; // Ex: -40
	unit: string; // Ex: "°C", "rpm"
	minValue?: number;
	maxValue?: number;
}
```
  

### 7.2 Widget

typescript
```
interface Widget {
	id: string;
	type: 'can-signal' | 'sensor' | 'unified';
	sourceId: string;
	field: WidgetField;
	displayType: DisplayType;
	customLabel?: string;
	color: string;
	minValue: number;
	maxValue: number;
	warningThreshold: number;
	dangerThreshold: number;
	decimals: number;
	currentValue?: any;
	history: number[];
	lastUpdated?: number;
	canId?: string;
	sensorType?: string;
}
type DisplayType = | 'number' | 'gauge' | 'bar' | 'sparkline' | 'led' | 'text' | 'json' | 'array' | 'table' | 'status';
```
 
## 7.3 WidgetField

typescript
```
interface WidgetField {
    path: string; // Ex: "value.temperature.current"
    label: string; // Ex: "Temperature Current"
    dataType: 'number' | 'string' | 'boolean' | 'object' | 'array' | 'unknown';
    unit?: string;
    example?: any;
}
```
  

### 7.4 IDecodingRule (Backend Schema)

typescript
```
interface IDecodingRule {
    id: string;
    canId: string;
    signalName: string;
    startBit: number;
    bitLength: number;
    byteOrder: 'big' | 'little';
    signed: boolean;
    factor: number;
    offset: number;
    unit: string;
    minValue?: number;
    maxValue?: number;
}
```

### 7.5 ISensorReading

typescript
```
interface ISensorReading {
    id: string;
    sensorId: string;
    sensorType: string;
    value: any; // Schema.Types.Mixed
    unit: string;
    timestamp: number;
    metadata?: any;
}
```
  

### 7.6 IUnifiedRecord

typescript
```
interface IUnifiedRecord {
    id: string;
    timestamp: number;
    source: 'can' | 'sensor' | 'merged' | 'custom';
    canSignals: IDecodedSignal[];
    sensorReadings: ISensorReading[];
    customData?: any;
    tags: string[];
}
```
  

### 8. API e Endpoints

  

Base URL
```
http://localhost:3001/api
  
```
  

Endpoints Disponíveis

  
```
| Método | Endpoint | Descrição |

|--------|----------|-----------|

| GET | /health | Health check da API |

| GET | /can/frames?limit=100 | Lista frames CAN |

| POST | /can/frames | Envia novo frame |

| DELETE | /can/frames | Limpa todos os frames |

| GET | /decoding/rules | Lista regras de decodificação |

| POST | /decoding/rules | Cria/atualiza regras (upsert) |

| PUT | /decoding/rules/:id | Atualiza regra específica |

| DELETE | /decoding/rules/:id | Remove regra |

| GET | /sensors?limit=100 | Lista sensores |

| POST | /sensors | Envia dado de sensor |

| DELETE | /sensors | Limpa sensores |

| GET | /unified?limit=100 | Dados unificados |

| POST | /unified/merge | Merge de dados |

| DELETE | /unified | Limpa unificados |

  ```

#### Formato de Resposta

  

Todas as respostas seguem o padrão:

typescript
```
interface IApiResponse {
    success: boolean;
    data: T;
    status: number;
    error?: string;
    count?: number;
}
```

Exemplos de Payloads JSON

  

#### 9.1 CAN Frame

json
```
{
"canId": "0x1A3",
"dlc": 8,
"data": "E8035A0000000000",
"timestamp": 1699900000000,
"interface": "http"
}
```
  

### 10.2 Decoding Rule

json
```
{

"id": "rule_rpm",

"canId": "0x1A3",

"signalName": "EngineRPM",

"startBit": 0,

"bitLength": 16,

"byteOrder": "little",

"signed": false,

"factor": 0.25,

"offset": 0,

"unit": "rpm",

"minValue": 0,

"maxValue": 8000

}
```
  

### 10.3 Sensor Data (Simples)

json
```
{

"sensorId": "temp-outdoor",

"sensorType": "temperature",

"value": 23.5,

"unit": "°C",

"timestamp": 1699900000000,

"metadata": { "location": "outdoor", "zone": "A" }

}
```
  

#### 10.4 Sensor Data (Complexo - Objeto)

json
```
{
    "sensorId": "engine-monitor",
    "sensorType": "multi-parameter",
    "value": {
        "temperature": {
            "current": 85.5,
            "max": 130,
            "min": 60,
            "unit": "°C",
            "status": "normal"
    },
    "pressure": {
    "value": 2.3,
    "unit": "bar",
    "trend": "rising"
    },
    "rpm": 3500,
    "load": 76.5
    },
    "unit": "mixed",
    "timestamp": 1699900000000,
    "metadata": {
    "ecu": "ECU-01",
    "vin": "1HGBH41JXMN109186"
    }
}
```
  

### 10.5 Sensor Data (Array de Objetos)

json
```
{

    "sensorId": "battery-pack",
    "sensorType": "battery",
    "value": {
    "voltage": 14.62,
    "current": 131.50,
    "charge": 87.3,
    "health": 94.7,
    "cells": [
        { "id": 1, "voltage": 3.65, "temp": 32.1, "status": "ok" },
        { "id": 2, "voltage": 3.68, "temp": 33.4, "status": "ok" },
        { "id": 3, "voltage": 3.62, "temp": 31.8, "status": "warning" },
        { "id": 4, "voltage": 3.67, "temp": 32.9, "status": "ok" }
    ]
    },
    "unit": "mixed",
    "timestamp": 1699900000000,
    "metadata": { "packId": "PACK-001", "chemistry": "LiFePO4" }
}
```
  

### 10.6 Unified Record

json
```
{

"id": "unified_1699900000",

"timestamp": 1699900000000,

"source": "merged",

"canSignals": [

{

"ruleId": "rule_rpm",

"signalName": "EngineRPM",

"value": 1293.25,

"unit": "rpm",

"rawHex": "0A2B",

"timestamp": 1699900000000

}

],

"sensorReadings": [

{

"id": "sensor_001",

"sensorId": "temp-outdoor",

"sensorType": "temperature",

"value": 23.5,

"unit": "°C",

"timestamp": 1699900000000

}

],

"tags": ["engine", "live", "simulated"]

}
```
  

### 10.7 MQTT Payload (Array Misto)

json

[

{

"canId": "0x1A3",

"data": "E8035A0000000000",

"dlc": 8,

"timestamp": 1699900000000,

"interface": "mqtt"

},

{

"sensorId": "temp-outdoor",

"sensorType": "temperature",

"value": 23.5,

"unit": "°C",

"timestamp": 1699900000000

},

{

"sensorId": "battery-pack",

"sensorType": "battery",

"value": {

"voltage": 14.62,

"cells": [

{ "id": 1, "voltage": 3.65, "temp": 32.1 }

]

},

"timestamp": 1699900000000

}

]

  

### Simuladores

  

### 11.1 Simulador HTTP (simulator.js)

bash
```
# Instalação

npm install

# Execução

node simulator.js # Loop contínuo (1s)
node simulator.js loop 500 # Loop a cada 500ms
node simulator.js once # Envia uma vez
node simulator.js clear # Limpa todos os dados

  ```

### 11.2 Simulador MQTT (simulator-mqtt.js)

bash
```
# Instalação

npm install mqtt
```
  

Execução com variáveis de ambiente
```
MQTT_USER=modcs \

MQTT_PASSWORD=12345678 \

MQTT_BROKER=mqtts://eaa7d5aa.ala.eu-central-1.emqxsl.com:8883 \

node simulator-mqtt.js
```
  

Payloads MQTT suportados:

  
```
| Tipo | Identificador | Processador |

|------|---------------|-------------|

| CAN Frame | canId + data | processCanFrames() |

| Sensor | sensorId + value | processSensorData() |

| Custom | source | processCustomData() |
```
  

### 11.3 Dados Gerados pelo Simulador

  

O simulador gera dados para os seguintes sensores:

  
```
| Sensor ID | Tipo | Estrutura |

|-----------|------|-----------|

| temp-outdoor | temperature | Número simples |

| engine-monitor | multi-parameter | Objeto complexo |

| gps-tracker | location | Coordenadas + histórico |

| door-status | binary | Booleano |

| battery-pack | battery | Objeto com array de células |

| error-log | diagnostic | Objeto com código OBD |

| humidity | environment | Número simples |

| pressure | environment | Número simples |

| ignition | binary | Booleano |

| alarm-active | binary | Booleano |

| vehicle-mode | status | String (Drive/Park/Neutral) |

| gear-position | transmission | String (P/R/N/D/S) |

| error-code | diagnostic | String (P0123) |

| cylinder-temps | engine | Array de números |

| tire-pressure | chassis | Array de números |

| fuel-trim | engine | Array de números |

| throttle-position | engine | Número 0-100 |

| engine-load | engine | Número 0-100 |

| active-dtc-list | diagnostic | Array de objetos |
```
  

### Dashboard de Visualização

  

### 12.1 Tipos de Widgets

  
```
| Tipo | Uso | Exemplo |

|------|-----|---------|

| Number | Valores numéricos simples | 1293.25 rpm |

| Gauge | Barras de progresso 0-100% | Throttle position |

| Bar | Histórico em barras verticais | Fuel level history |

| Sparkline | Gráfico de linha SVG | Temperature trend |

| LED | Indicador booleano | Door open/closed |

| Text | Strings simples | Gear position: "D" |

| JSON | Objetos complexos formatados | Engine monitor full |

| Array | Lista de primitivos | Cylinder temps: [72, 74, 71, 73] |

| Table | Array de objetos em tabela | Battery cells |
```
  

### 12.2 Estados Visuais

  
```
| Estado | Cor | Condição |

|--------|-----|----------|

| Normal | Verde | value = warningThreshold |

| Danger | Vermelho | value >= dangerThreshold |

| Custom | Cor definida pelo usuário | color !== 'auto' |
```
  

### 12.3 Configuração de Widget

  

Cada widget possui:

- Field Path: Caminho no objeto (ex: value.temperature.current)
- Display Type: Tipo de visualização
- Min/Max: Escala para gauge/bar
- Warning/Danger Thresholds: Limites de alerta
- Decimals: Casas decimais
- Color: auto ou cor customizada (hex)

  

### 12.4 Persistência

  

Widgets são salvos automaticamente no localStorage
Configurações salvas podem ser nomeadas e reutilizadas
URL da API e intervalo de refresh também são persistidos

  

### Guia de Uso

  

### 13.1 Criando uma Regra de Decodificação

  

Abra o Decoder Studio

Clique nos bits na matriz (ex: bits 0-15)

Preencha: Nome, Factor, Offset, Unit

Clique em 💾 Salvar Regra

Clique em 🚀 Enviar Frame + Regras

  

### 13.2 Configurando o Dashboard

  

Abra a aba 📊 Dashboard

Clique em ⚙️ Configurar

Escolha a aba:

- 📡 Sinais CAN: Para regras de decodificação

- 🌡️ Sensores: Para dados de sensores (agrupados por sensorId)

- 🔗 Unified: Para dados unificados

Selecione os campos desejados

Clique em ➕ Adicionar X Campo(s)

Clique em ▶️ Iniciar Live para atualizações em tempo real

  

### 13.3 Explorando Campos de Sensores Complexos

  

Para sensores com estrutura aninhada como:json
```
{

"value": {

"temperature": { "current": 85.5, "unit": "°C" },

"cells": [

{ "id": 1, "voltage": 3.65 }

]

}

}
```
  

O FieldExplorer permite selecionar:

value.temperature.current → Number Widget

value.temperature.unit → Text Widget

value.cells → Table Widget (array de objetos)

  

### 13.4 Editando uma Regra Existente

  

Clique em uma regra na lista lateral

O formulário é preenchido automaticamente

Modifique os campos desejados

O botão 💾 Salvar Regra aparece automaticamente

Clique para salvar (usa PUT para atualizar)

  

### 13.5 Removendo uma Regra

  

Clique no botão 🗑️ ao lado da regra

Confirme a exclusão

A regra é removida localmente e da API

  

### Comandos Úteis

  

Desenvolvimento

bash
```
# Iniciar servidor de desenvolvimento

npm run dev
```
  
```
# Build de produção

npm run build
```
  
```
# Iniciar servidor de produção

npm start
```
  
```
# Verificar tipos TypeScript

npx tsc --noEmit
```
  
```
# Lint

npm run lint
```
  

Simuladores

bash
```
# Simulador HTTP

node simulator.js

node simulator.js once

node simulator.js clear
```
  
```
#Simulador MQTT

node simulator-mqtt.js
```
  

## 📝 Notas Finais

- Persistência: Widgets e configurações são salvos no localStorage
- Performance: useMemo e useCallback são usados extensivamente para evitar re-renders
- Type Safety: Projeto 100% tipado com TypeScript strict mode
- Build: npm run build gera páginas estáticas prerenderizadas
- MQTT: Suporta TLS/SSL via mqtts:// com certificados EMQX Cloud
- BigInt: Usado para extração precisa de valores de bits CAN
- Upsert: Backend usa findOneAndUpdate com upsert: true para evitar duplicatas

  
Versão: 1.0.0
Última atualização: Setembro 2026
Licença: MIT
Autor: CAN Studio Team

