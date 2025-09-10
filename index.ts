import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { parse } from "csv-parse";

// qrcode-terminal é CommonJS → importar como default
import qr from "qrcode-terminal";

// whatsapp-web.js também é CommonJS → importar como default e extrair
import wweb from "whatsapp-web.js";
const { Client, LocalAuth } = wweb as any;

type ContactRow = Record<string, string | undefined>;

interface Contact {
  name: string;
  phone: string; // em formato internacional: +55XXXXXXXXXXX
  horario: string;
}

const SEND_DELAY_MS = Number(process.env.SEND_DELAY_MS || 2000);
const CSV_PATH = process.env.CSV_PATH || "contacts.csv";
const HEADLESS = (process.env.HEADLESS ?? "true").toLowerCase() !== "false";
const MESSAGE =
  process.env.MESSAGE ||
  "Mensagem padrão: configure a variável MESSAGE no .env";
const renderMessage = (name: string, horario: string): string =>
  MESSAGE.replace("{name}", name).replace("{horario}", horario);

// ===== utils =====
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  let s = String(raw).trim();

  // extrai de wa.me/XXXXXXXXX
  const mm = s.match(/wa\.me\/(\d+)/i);
  if (mm) s = mm[1];

  // remove tudo que não é dígito
  const digits = s.replace(/\D/g, "");
  if (!digits) return null;

  // Caso típico Brasil: 55 + DDD + 8 dígitos (12 dígitos no total)
  if (digits.length === 12 && digits.startsWith("55")) {
    const ddi = digits.slice(0, 2); // 55
    const ddd = digits.slice(2, 4); // DDD
    const rest = digits.slice(4); // número sem o 9
    return `+${ddi}${ddd}9${rest}`; // insere o 9 após o DDD
  }

  // Brasil já completo com 13 dígitos (55 + DDD + 9 dígitos)
  if (digits.startsWith("55")) return `+${digits}`;

  // Se tiver só DDD + número (10 ou 11 dígitos) → prefixa 55
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;

  // Internacional genérico (>=12 dígitos)
  if (digits.length >= 12) return `+${digits}`;

  // fallback
  return `+${digits}`;
}

async function loadContacts(csvPath: string): Promise<Contact[]> {
  const rows: ContactRow[] = await new Promise((resolve, reject) => {
    const abs = path.resolve(csvPath);
    if (!fs.existsSync(abs)) {
      reject(new Error(`CSV não encontrado: ${abs}`));
      return;
    }
    const data: ContactRow[] = [];
    fs.createReadStream(abs)
      .pipe(parse({ columns: true, trim: true }))
      .on("data", (row: ContactRow) => data.push(row))
      .on("end", () => resolve(data))
      .on("error", reject);
  });

  const contactsMap = new Map<string, Contact>();
  let ignoradosTelefone = 0;
  let ignoradosHorario = 0;

  for (const row of rows) {
    const name = row["name"] ?? "";
    const horario = row["horario"] ?? "";

    const whatsapp =
      row["Whatsapp"] ??
      row["WhatsApp"] ??
      row["whatsapp"] ??
      row["Phone"] ??
      row["number"] ??
      row["phone"] ??
      "";

    const phone = normalizePhone(whatsapp);

    if (!phone) {
      ignoradosTelefone++;
      console.warn(
        `⚠️  Ignorando sem telefone válido: ${name} | raw: ${whatsapp}`
      );
      continue;
    }
    if (!horario) {
      ignoradosHorario++;
      console.warn(
        `⚠️  Ignorando sem horário válido: ${name} | raw: ${horario}`
      );
      continue;
    }

    // Remove duplicados pelo número de telefone
    if (!contactsMap.has(phone)) {
      contactsMap.set(phone, {
        name: String(name || "").trim(),
        phone,
        horario: String(horario || "").trim(),
      });
    }
  }

  const contacts = Array.from(contactsMap.values());
  if (ignoradosTelefone > 0 || ignoradosHorario > 0) {
    console.log(
      `Contatos ignorados: ${ignoradosTelefone} sem telefone válido, ${ignoradosHorario} sem horário válido.`
    );
  }
  return contacts;
}
async function main() {
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: "zap-sender" }),
    puppeteer: {
      headless: HEADLESS,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", (qrText: string) => {
    console.log("📱 Escaneie o QR Code abaixo com o WhatsApp:");
    qr.generate(qrText, { small: true });
  });

  client.on("auth_failure", (m: any) =>
    console.error("❌ Falha de autenticação:", m)
  );
  client.on("disconnected", (r: any) => console.warn("🔌 Desconectado:", r));

  client.on("ready", async () => {
    console.log("✅ WhatsApp pronto. Lendo contatos...");
    const contacts = await loadContacts(CSV_PATH);
    console.log(
      `→ ${contacts.length} contato(s) válido(s). Iniciando envio...`
    );

    let sent = 0;
    let failed = 0;

    for (const contact of contacts) {
      const message = renderMessage(contact.name, contact.horario);
      const rawNumber = contact.phone.replace(/\D/g, "");
      const numberId = await client.getNumberId(rawNumber);

      if (!numberId) {
        console.warn(`⚠️ O número ${contact.phone} não está no WhatsApp`);
        continue;
      }

      try {
        await client.sendMessage(numberId._serialized, message);
        console.log(
          `✅ Enviado para ${contact.name} (${contact.phone}) - ${contact.horario}`
        );
        sent++;
      } catch (err: any) {
        console.error(`❌ Falha para ${contact.name}:`, err?.message ?? err);
        failed++;
      }

      await sleep(SEND_DELAY_MS);
    }

    console.log(`🏁 Concluído. Enviadas: ${sent} | Falhas: ${failed}`);
  });

  await client.initialize();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("Erro fatal:", e);
    process.exit(1);
  });
}

// Export para testes unitários
export { normalizePhone };
