# 🧩 React + Vite + Material UI Projekt

Dieses Projekt ist ein modernes React-Setup auf Basis von **Vite** mit **React Compiler**, **Material UI (MUI)**.  
Es dient als Grundlage für die Entwicklung interaktiver, performanter Webanwendungen.

---

## 🚀 Voraussetzungen

Stelle sicher, dass folgende Tools installiert sind:

- Node.js (LTS-Version, z. B. ≥ 18)
- npm oder yarn

---

## ⚙️ Installation & Start

```bash
npm install
npm run dev
```

Der Entwicklungsserver läuft standardmäßig unter:

```
http://localhost:5173
```

---

## 🧱 Projektstruktur

Eine typische Ordnerstruktur für ein Vite + React-Projekt sieht so aus:

```
├── public/                 # Statische Dateien (Icons, Manifest)
│
├── src/                    # Haupt-Quellcode
│   ├── assets/             # Bilder, Grafiken, Medien
│   ├── components/         # Wiederverwendbare UI-Komponenten
│   ├── hooks/              # Eigene React Hooks
│   ├── pages/              # Seiten-Komponenten
│   ├── layouts/            # Layout-/Wrapper-Komponenten
│   ├── theme/              # MUI Theme-Konfiguration
│   ├── utils/              # Helper / Utility-Funktionen
│   ├── App.jsx             # Haupt-App-Komponente
│   ├── main.jsx            # Einstiegspunkt für ReactDOM
│   └── index.css           # Globale Styles (inkl. Roboto)
│
├── index.html              # Vite HTML Entry
├── package.json
├── vite.config.js          # Vite-Konfiguration
└── README.md
```

---

## 🧩 Nützliche Scripts

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Startet Dev-Server |
| `npm run build` | Produktionsbuild |
| `npm run preview` | Vorschau des Builds |
| `npm run lint` | Linter ausführen (falls vorhanden) |

---

## 📚 Weiterführende Links

- React: https://react.dev/
- Vite: https://vitejs.dev/guide/
- Material UI: https://mui.com/material-ui/getting-started/overview/
