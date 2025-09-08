# Zap Sender - Envio de Mensagens WhatsApp

Este projeto automatiza o envio de mensagens em massa via WhatsApp usando Node.js, TypeScript e a biblioteca whatsapp-web.js.

## Pré-requisitos

- Node.js 18+
- Yarn
- Google Chrome ou Chromium instalado
- (Linux) Dependências do Chromium: veja instruções no final

## Instalação

```bash
yarn install
```

## Configuração

1. Crie um arquivo `.env` (opcional) para sobrescrever variáveis:
   - `SEND_DELAY_MS=2000` (intervalo entre mensagens em ms)
   - `CSV_PATH=contacts.csv` (arquivo de contatos)
   - `HEADLESS=true` (roda sem abrir janela do navegador)
   - `MESSAGE="Sua mensagem única aqui"` (mensagem enviada para todos)
2. Prepare seu arquivo de contatos (exemplo: `contacts.csv`):

```
Nome,Whatsapp
Fulano,+5554999999999
Beltrano,+5521999999999
```

## Uso

Para enviar mensagens:

```bash
yarn start
```

Ou, para desenvolvimento:

```bash
yarn dev
```

Será exibido um QR Code no terminal. Escaneie com o WhatsApp Web do seu celular.

## Personalização da Mensagem

Basta definir a variável de ambiente `MESSAGE` no `.env` para alterar o texto enviado para todos.

## Testes

Para rodar os testes unitários de normalização de telefone:

```bash
yarn test
```

## Dicas para Linux (headless)

Se ocorrer erro relacionado ao Chromium, instale as dependências:

```bash
sudo apt-get install -y fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 xdg-utils
```

---

Projeto para fins educacionais. Use com responsabilidade.
# zap-sender
