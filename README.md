<div align="center">
  <img src="assets/icon.svg" width="84" height="84" alt="WhatsApp Web Sidebar Toggle" />

  <h1>WhatsApp Web Sidebar Toggle</h1>

  <p>
    <strong>Extensão leve e instantânea para fechar e abrir a barra lateral de conversas no WhatsApp Web.</strong><br />
    Mais foco na conversa atual e mais privacidade ao compartilhar a tela — mantendo a barra fina de navegação sempre acessível.
  </p>

  <p>
    <img src="https://img.shields.io/badge/Manifest-V3-00A884?style=flat-square&logo=googlechrome&logoColor=white" alt="Manifest V3" />
    <img src="https://img.shields.io/badge/Navegadores-Chrome%20%7C%20Edge%20%7C%20Brave%20%7C%20Opera-202C33?style=flat-square" alt="Chromium Browsers" />
    <img src="https://img.shields.io/badge/Licença-MIT-blue?style=flat-square" alt="MIT License" />
    <img src="https://img.shields.io/badge/Privacidade-100%25%20Local-success?style=flat-square" alt="100% Local" />
  </p>
</div>

---

## Sobre o Projeto

Por padrão, o **WhatsApp Web** mantém a coluna da lista de conversas permanentemente aberta ocupando de 30% a 40% da tela. Isso reduz o espaço útil da conversa aberta e expõe nomes de contatos e prévias de mensagens durante chamadas de vídeo, gravações ou compartilhamentos de tela.

O **WhatsApp Web Sidebar Toggle** resolve isso de forma direta, enxuta e sem distrações:
- Recolhe **apenas a lista de conversas** de forma **instantânea (sem animações lentas)**;
- Mantém a **barra fina de ícones à esquerda visível** (Conversas, Status, Comunidades, Configurações, Perfil);
- Expande automaticamente o painel da conversa para ocupar **100% da largura disponível**.

---

## Funcionalidades

- **Botão Integrado à Interface**: Adiciona um botão com visual nativo do WhatsApp Web no topo da barra fina esquerda (e um botão rápido no cabeçalho da lista), adaptando-se automaticamente aos temas **Escuro** e **Claro**.
- **Atalho de Teclado `Alt + B`**: Alterne entre sidebar aberta ou fechada de qualquer lugar — inclusive enquanto digita mensagens no chat (compatível com teclados brasileiros ABNT2, sem conflito com `AltGr`).
- **Persistência Instantânea (Zero Flash)**: Lembra o último estado escolhido ao recarregar (`F5`) ou reabrir o WhatsApp Web, aplicando o layout em `document_start` antes da primeira pintura da página.
- **Popup Minimalista**: Controle rápido também pelo ícone da extensão na barra de ferramentas do navegador, sincronizado em tempo real entre abas.
- **Navegação Inteligente**: Com a sidebar recolhida, clicar em *Status*, *Comunidades*, *Configurações* ou *Perfil* na barra fina reabre automaticamente o painel lateral correspondente.
- **Zero Dependências & 100% Privado**: Código puro (Vanilla JS + CSS), sem rastreadores, sem servidores externos e exigindo apenas a permissão mínima `storage` em `https://web.whatsapp.com/*`.

---

## Instalação

Compatível com **Google Chrome**, **Microsoft Edge**, **Brave**, **Opera**, **Vivaldi** e demais navegadores baseados em Chromium.

### Opção 1 — Clonando o repositório (ou baixando o código)

1. Clone este repositório (ou extraia o arquivo [`dist/whatsapp-web-sidebar-toggle.zip`](dist/whatsapp-web-sidebar-toggle.zip)):
   ```bash
   git clone https://github.com/thiagocontelli/whatsapp-web-sidebar-extension.git
   ```
2. No navegador, acesse **`chrome://extensions`** (ou `edge://extensions` / `brave://extensions`).
3. Ative a chave **Modo do desenvolvedor** (*Developer mode*) no canto superior direito.
4. Clique em **Carregar sem compactação** (*Load unpacked*) e selecione a pasta **`extension`** dentro do projeto.
5. Abra ou recarregue o **[WhatsApp Web](https://web.whatsapp.com)**.

---

## Como Usar

| Ação | Como fazer |
|---|---|
| **Pela interface do WhatsApp** | Clique no ícone de painel no topo da barra fina de navegação à esquerda |
| **Pelo teclado** | Pressione **`Alt + B`** a qualquer momento (personalizável em `chrome://extensions/shortcuts`) |
| **Pela barra do navegador** | Clique no ícone da extensão e use o botão **Recolher / Mostrar conversas** |

---

## Estrutura do Repositório

```text
├── assets/
│   └── icon.svg                  # Ícone vetorial oficial do projeto
├── dist/
│   └── whatsapp-web-sidebar-toggle.zip  # Pacote pronto para distribuição / Chrome Web Store
├── extension/                    # Pasta pronta para "Carregar sem compactação"
│   ├── icons/                    # Ícones PNG (16, 32, 48, 128px)
│   ├── manifest.json             # Configuração Manifest V3
│   ├── background.js             # Service Worker (atalho global Alt+B e badge)
│   ├── content.css               # Regras de layout instantâneo e temas claro/escuro
│   ├── content.js                # Resolução resiliente de DOM e controles integrados
│   ├── popup.html                # Interface do popup da extensão
│   ├── popup.css                 # Estilos do popup
│   └── popup.js                  # Sincronização em tempo real do popup
├── scripts/
│   ├── generate_icons.py         # Script gerador dos ícones
│   └── package_extension.py      # Empacotador do arquivo .zip em dist/
└── LICENSE                       # Licença MIT
```

### Gerando um novo pacote `.zip`

Caso faça alterações na pasta `extension/`, basta rodar com Python 3:

```bash
python scripts/package_extension.py
```

---

## Privacidade e Segurança

Esta extensão opera **100% localmente** no seu navegador:
- **Não** lê, armazena nem transmite mensagens, contatos ou mídias;
- **Não** faz nenhuma requisição de rede externa (`fetch` / `XMLHttpRequest` / analytics);
- Armazena apenas um único booleano (`sidebarCollapsed`) no armazenamento local da extensão.

---

## Contribuindo

Contribuições, *issues* e *pull requests* são muito bem-vindos!

1. Faça um *fork* do projeto
2. Crie uma branch para sua feature ou correção (`git checkout -b feat/minha-melhoria`)
3. Faça o commit das suas alterações (`git commit -m 'feat: adiciona minha melhoria'`)
4. Envie para a sua branch (`git push origin feat/minha-melhoria`)
5. Abra um **Pull Request**

---

## Licença

Distribuído sob a licença **MIT**. Veja o arquivo [`LICENSE`](LICENSE) para mais informações.
