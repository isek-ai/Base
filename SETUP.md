# Настройка нового устройства

Инструкция для подключения ещё одного компьютера к рабочему окружению: репозиторий `Base`, плагин ECC и плагин Ponytail.

## 1. Что должно быть установлено

- **Git** (проверка: `git --version`)
- **Node.js 18 или новее** с сайта nodejs.org (проверка: `node --version`)
- **Claude Code** по официальной инструкции Anthropic (проверка: `claude --version`, версия 2.1 или новее)

Все команды ниже выполняются в PowerShell.

Если Claude Code установлен только как десктопное приложение, команда `claude` может быть не в PATH, и установка ECC остановится с ошибкой. Тогда добавьте в PATH папку с `claude.exe` (она лежит в `%APPDATA%\Claude\claude-code\<версия>\...`; номер версии меняется после обновления приложения). Для разовой установки хватит `$env:Path = "<папка>;" + $env:Path` в текущем окне PowerShell.

## 2. Клонировать репозиторий

```bash
git clone https://github.com/isek-ai/Base.git
```

При первом push или pull войдите в GitHub тем же аккаунтом.

## 3. Установить плагин ECC

```bash
npx ecc-universal@2.2.3 setup --mode claude-plugin --scope user --hooks standard --yes
```

## 4. Установить плагин Ponytail

Выполните две команды по очереди:

```bash
claude plugin marketplace add DietrichGebert/ponytail
```

```bash
claude plugin install ponytail@ponytail --scope user
```

## 5. Проверить установку

```bash
claude plugin list
```

В списке должны быть `ecc@ecc` и `ponytail@ponytail` со статусом `enabled`.

Если чего-то нет, пришлите вывод команды и текст ошибки.

## 6. Открыть проект

1. Запустите Claude Code в папке `Base`.
2. Если Claude Code предложит установить плагины из `.claude/settings.json`, подтвердите.
3. Выполните `/reload-plugins` или перезапустите Claude Code.

## 7. Ежедневный порядок работы

**Перед началом работы:**
```bash
git pull
```

**Новая задача:** создайте папку в `tasks/`, скопируйте туда `_templates/STATUS.md` как `STATUS.md` и заполните.

**В конце работы:** обновите `STATUS.md` задачи, затем:
```bash
git add .
git commit -m "Краткое описание изменений"
git push
```

Перед коммитом проверьте, что в файлах нет паролей и ключей. Для них используйте `.env`, он уже в `.gitignore`.

## 8. Что важно помнить

- **Плагины ставятся на каждое устройство отдельно.** Репозиторий `Base` синхронизирует файлы и настройки проекта, но не сами плагины. Поэтому шаги 3 и 4 нужно выполнить на каждом компьютере.
- **История чатов не синхронизируется между устройствами.** Файлы задач и заметки `STATUS.md` переносятся через GitHub, а сами диалоги остаются на том компьютере, где велись. Для работы с любого устройства используйте облачные сессии на claude.ai/code. Они не привязаны к одной машине.
- **Remote Control** позволяет управлять сессией с другого устройства, но компьютер с этой сессией должен быть включён и приложение запущено.
- **Хук GateGuard из ECC** может останавливать некоторые Bash-команды и просить объяснить их. Это штатное поведение, выполните то, что он просит, и повторите команду.
- **Ponytail** меняет стиль кода агента: предпочитает короткие решения и стандартную библиотеку. Если нужно сложнее, прямо скажите об этом в запросе.
- **Правила ECC** (`rules/common` и языковые) не входят в плагин. Если нужны, их копируют отдельно по инструкции из README ECC.
- **Предупреждение при установке ECC.** `claude plugin list` может написать, что пакеты плагина не установлены из-за `overrides` в его `package.json`. Плагин при этом работает (статус `enabled`).

## 9. Что установлено: плагины и скиллы

Состояние на 12.10.2026 (после `/reload-plugins`: 6 плагинов, 457 скиллов, 77 агентов, 31 хук). Актуальный список плагинов: `claude plugin list`.

### Плагины, которые ставятся вручную (шаги 3 и 4)

| Плагин | Что даёт |
|---|---|
| **ecc@ecc** (2.2.3) | Большой набор скиллов, команд, агентов и хуков. См. ниже. |
| **ponytail@ponytail** (5.1.0) | Стиль «короткие решения»: `/ponytail`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`, `ponytail-review`. |

Установлен, но отключён: `claude-mem@thedotmack` (статус `disabled`). Включать не нужно.

### Что входит в ECC

- **Агенты** (около 70): ревьюеры по языкам и фреймворкам (Python, TypeScript, Go, Rust, Java, Kotlin, C++, C#, Swift, PHP, Ruby, Django, FastAPI, React, Vue, Flutter), резолверы ошибок сборки, `planner`, `architect`, `code-reviewer`, `security-reviewer`, `tdd-guide`, `e2e-runner`, `doc-updater`, `refactor-cleaner`, `performance-optimizer`, `database-reviewer`.
- **Команды** (вызываются как `/ecc:<имя>`): `plan`, `prp-plan`, `prp-implement`, `prp-pr`, `feature-dev`, `build-fix`, `code-review`, `review-pr`, `quality-gate`, `security-scan`, `test-coverage`, `refactor-clean`, `update-docs`, `update-codemaps`, `save-session`, `resume-session`, `checkpoint`, `learn`, `hookify`, `loop-start`, `harness-audit`, `cost-report`, `ecc-guide` и другие.
- **Скиллы** (около 300): паттерны и тесты по языкам, безопасность, TDD, API и базы данных, DevOps (Docker, Kubernetes), `deep-research`, `search-first`, `verification-loop`, `strategic-compact`, `context-budget`, `gateguard`, `continuous-learning-v2`, а также прикладные области (маркетинг, e2e, сети, healthcare, дизайн). Навигация: `/ecc:ecc-guide`.
- **Хуки** в режиме `standard`, среди них GateGuard (см. раздел 8).
- **MCP-инструменты Chrome DevTools** (`chrome-devtools`) для отладки страниц.

### Скиллы, которые подключаются сами

Эти скиллы лежат в `~/.claude/skills` или приходят вместе с приложением Claude и отдельной установки по этой инструкции не требуют. Если на новом устройстве их нет, перенесите папки из `~/.claude/skills` вручную.

- **Личные (`~/.claude/skills`)**: `graphify` (граф знаний по коду и документам, команда `/graphify`), `task-observer` (наблюдение за задачами и улучшение скиллов), `karpathy-guidelines`, `find-skills`, `web-design-guidelines`, `writing-guidelines`, `deploy-to-vercel`, `vercel-cli-with-tokens`, `vercel-optimize`, `vercel-composition-patterns`, `vercel-react-best-practices`, `vercel-react-native-skills`, `vercel-react-view-transitions`.
- **Superpowers**: `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `using-git-worktrees`, `subagent-driven-development`, `dispatching-parallel-agents`, `finishing-a-development-branch`, `writing-skills`.
- **Anthropic skills**: работа с файлами (`docx`, `pptx`, `xlsx`, `pdf`), `docs`, `google-workspace`, `deep-research`, `schedule`, `skill-creator`, браузеры (`built-in-browser`, `chrome-browser`), `computer-use`, `consolidate-memory`, `import-memory`, `morning`.
- **Cowork-плагины**: `create-cowork-plugin`, `cowork-plugin-customizer`.
- **Встроенные команды Claude Code**: `code-review`, `simplify`, `security-review`, `init`, `loop`, `schedule`, `run`, `update-config`, `keybindings-help`, `fewer-permission-prompts`, `claude-api`.

### Какой инструмент выбрать

- Новая функция или изменение поведения: `superpowers:brainstorming`, затем `writing-plans`.
- Реализация по плану: `executing-plans` или `subagent-driven-development`, код через `test-driven-development`.
- Ошибка или падающий тест: `systematic-debugging`.
- Перед тем как сказать «готово»: `verification-before-completion`, при необходимости `/ecc:quality-gate`.
- Ревью: `/code-review`, `/ecc:review-pr`, `/security-review`.
- Исследование темы: `deep-research`.
- Понять незнакомый проект: `/graphify`.
- Документы Office и PDF: `docx`, `pptx`, `xlsx`, `pdf`.
