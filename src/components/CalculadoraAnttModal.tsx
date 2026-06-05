import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calculator, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TipoCarga = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type Eixos = 2 | 3 | 4 | 5 | 6 | 7 | 9;

interface Coeficientes {
  ccd: number;
  cc: number;
}

// ---------------------------------------------------------------------------
// Lookup tables  (ANTT Res. 5.867/2020 – updated by Port. SUROC nº 4/2026)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SUROC 4/2026 Tables (Port. SUROC nº 4, de 20/03/2026 – DOU Ed. Extra 1B)
// ---------------------------------------------------------------------------

/** Table B – Veículo automotor de cargas */
const TABLE_B: Record<TipoCarga, Partial<Record<Eixos, Coeficientes>>> = {
  1: { 4: { ccd: 5.2729, cc: 515.17 }, 5: { ccd: 5.9994, cc: 574.29 }, 6: { ccd: 6.6896, cc: 588.17 }, 7: { ccd: 7.1066, cc: 695.68 }, 9: { ccd: 7.9200, cc: 746.78 } },
  2: { 4: { ccd: 5.3358, cc: 515.17 }, 5: { ccd: 6.0623, cc: 574.29 }, 6: { ccd: 6.7525, cc: 588.17 }, 7: { ccd: 7.1695, cc: 695.68 }, 9: { ccd: 7.9829, cc: 746.78 } },
  3: { 4: { ccd: 6.2111, cc: 564.07 }, 5: { ccd: 7.0457, cc: 623.20 }, 6: { ccd: 7.8586, cc: 637.07 }, 7: { ccd: 8.2933, cc: 749.43 }, 9: { ccd: 9.2644, cc: 802.65 } },
  4: { 4: { ccd: 5.2729, cc: 515.17 }, 5: { ccd: 5.9994, cc: 574.29 }, 6: { ccd: 6.6896, cc: 588.17 }, 7: { ccd: 7.1066, cc: 695.68 }, 9: { ccd: 7.9200, cc: 746.78 } },
  5: { 4: { ccd: 5.2729, cc: 515.17 }, 5: { ccd: 5.9994, cc: 574.29 }, 6: { ccd: 6.6896, cc: 588.17 }, 7: { ccd: 7.1066, cc: 695.68 }, 9: { ccd: 7.9200, cc: 746.78 } },
  6: { 4: { ccd: 5.2729, cc: 515.17 }, 5: { ccd: 5.9994, cc: 574.29 }, 6: { ccd: 6.6896, cc: 588.17 }, 7: { ccd: 7.1066, cc: 695.68 }, 9: { ccd: 7.9200, cc: 746.78 } },
  7: { 4: { ccd: 6.0617, cc: 665.87 }, 5: { ccd: 6.7882, cc: 724.99 }, 6: { ccd: 7.4784, cc: 738.86 }, 7: { ccd: 7.9130, cc: 851.22 }, 9: { ccd: 8.7341, cc: 904.44 } },
  8: { 4: { ccd: 6.1053, cc: 677.85 }, 5: { ccd: 6.8318, cc: 736.97 }, 6: { ccd: 7.5220, cc: 750.84 }, 7: { ccd: 7.9566, cc: 863.20 }, 9: { ccd: 8.7777, cc: 916.42 } },
  9: { 4: { ccd: 6.8267, cc: 680.93 }, 5: { ccd: 7.6612, cc: 740.05 }, 6: { ccd: 8.4742, cc: 753.93 }, 7: { ccd: 8.9317, cc: 872.59 }, 9: { ccd: 9.9128, cc: 928.56 } },
  10: { 4: { ccd: 5.6796, cc: 617.35 }, 5: { ccd: 6.4062, cc: 676.48 }, 6: { ccd: 7.0963, cc: 690.35 }, 7: { ccd: 7.5310, cc: 802.71 }, 9: { ccd: 8.3521, cc: 855.93 } },
  11: { 4: { ccd: 5.6796, cc: 617.35 }, 5: { ccd: 6.4062, cc: 676.48 }, 6: { ccd: 7.0963, cc: 690.35 }, 7: { ccd: 7.5310, cc: 802.71 }, 9: { ccd: 8.3521, cc: 855.93 } },
  12: { 5: { ccd: 5.9994, cc: 574.29 }, 6: { ccd: 6.6896, cc: 588.17 }, 9: { ccd: 7.9200, cc: 746.78 } },
};

/** Table A – Composição veicular (veículo + implemento) */
const TABLE_A: Record<TipoCarga, Partial<Record<Eixos, Coeficientes>>> = {
  1: { 2: { ccd: 4.0338, cc: 444.84 }, 3: { ccd: 5.1660, cc: 533.36 }, 4: { ccd: 5.8464, cc: 576.59 }, 5: { ccd: 6.7381, cc: 642.10 }, 6: { ccd: 7.4408, cc: 656.76 }, 7: { ccd: 8.0855, cc: 792.30 }, 9: { ccd: 9.2662, cc: 877.83 } },
  2: { 2: { ccd: 4.1052, cc: 455.84 }, 3: { ccd: 5.2583, cc: 550.10 }, 4: { ccd: 5.9955, cc: 600.27 }, 5: { ccd: 6.9002, cc: 669.38 }, 6: { ccd: 7.6080, cc: 685.45 }, 7: { ccd: 8.2192, cc: 811.76 }, 9: { ccd: 9.4199, cc: 902.80 } },
  3: { 2: { ccd: 4.7442, cc: 502.29 }, 3: { ccd: 6.0679, cc: 601.96 }, 4: { ccd: 6.9216, cc: 663.16 }, 5: { ccd: 7.9337, cc: 732.07 }, 6: { ccd: 8.7563, cc: 745.94 }, 7: { ccd: 9.6471, cc: 949.16 }, 9: { ccd: 10.9629, cc: 1_030.58 } },
  4: { 3: { ccd: 5.1397, cc: 526.13 }, 4: { ccd: 5.7767, cc: 557.42 }, 5: { ccd: 6.6765, cc: 625.16 }, 6: { ccd: 7.3776, cc: 639.38 }, 7: { ccd: 8.0832, cc: 791.67 }, 9: { ccd: 9.1859, cc: 855.76 } },
  5: { 2: { ccd: 4.0031, cc: 436.39 }, 3: { ccd: 5.1295, cc: 523.33 }, 4: { ccd: 5.8178, cc: 568.72 }, 5: { ccd: 6.7126, cc: 635.08 }, 6: { ccd: 7.4124, cc: 648.95 }, 7: { ccd: 8.1252, cc: 803.22 }, 9: { ccd: 9.2466, cc: 872.44 } },
  6: { 2: { ccd: 3.6028, cc: 436.39 }, 3: { ccd: 5.1281, cc: 522.93 }, 4: { ccd: 5.8441, cc: 575.96 }, 5: { ccd: 6.7126, cc: 635.08 }, 6: { ccd: 7.4124, cc: 648.95 }, 7: { ccd: 8.1252, cc: 803.22 }, 9: { ccd: 9.2466, cc: 872.44 } },
  7: { 2: { ccd: 4.7775, cc: 587.98 }, 3: { ccd: 5.9193, cc: 679.12 }, 4: { ccd: 6.6352, cc: 727.28 }, 5: { ccd: 7.5269, cc: 792.80 }, 6: { ccd: 8.2296, cc: 807.45 }, 7: { ccd: 8.8919, cc: 947.84 }, 9: { ccd: 10.0803, cc: 1_035.49 } },
  8: { 2: { ccd: 4.8611, cc: 610.96 }, 3: { ccd: 6.0237, cc: 707.85 }, 4: { ccd: 6.7649, cc: 762.95 }, 5: { ccd: 7.6697, cc: 832.06 }, 6: { ccd: 8.3775, cc: 848.13 }, 7: { ccd: 9.0063, cc: 979.29 }, 9: { ccd: 10.2147, cc: 1_072.44 } },
  9: { 2: { ccd: 5.3315, cc: 609.31 }, 3: { ccd: 6.6676, cc: 712.41 }, 4: { ccd: 7.5371, cc: 780.02 }, 5: { ccd: 8.5492, cc: 848.93 }, 6: { ccd: 9.3718, cc: 862.80 }, 7: { ccd: 10.2855, cc: 1_072.32 }, 9: { ccd: 11.6113, cc: 1_156.49 } },
  10: { 3: { ccd: 5.5109, cc: 623.38 }, 4: { ccd: 6.1835, cc: 659.60 }, 5: { ccd: 7.0832, cc: 727.35 }, 6: { ccd: 7.7843, cc: 741.56 }, 7: { ccd: 8.5076, cc: 898.70 }, 9: { ccd: 9.6180, cc: 964.90 } },
  11: { 2: { ccd: 4.3647, cc: 531.01 }, 3: { ccd: 5.5008, cc: 620.58 }, 4: { ccd: 6.2246, cc: 670.91 }, 5: { ccd: 7.1193, cc: 737.27 }, 6: { ccd: 7.8191, cc: 751.14 }, 7: { ccd: 8.5496, cc: 910.26 }, 9: { ccd: 9.6787, cc: 981.58 } },
  12: { 5: { ccd: 7.0646, cc: 731.90 }, 6: { ccd: 7.8089, cc: 757.99 }, 9: { ccd: 9.7697, cc: 1_016.29 } },
};

/** Table C – Alto Desempenho (composição veicular) */
const TABLE_C: Record<TipoCarga, Partial<Record<Eixos, Coeficientes>>> = {
  1: { 2: { ccd: 3.4369, cc: 168.42 }, 3: { ccd: 4.3858, cc: 191.28 }, 4: { ccd: 5.0084, cc: 207.68 }, 5: { ccd: 5.7474, cc: 221.79 }, 6: { ccd: 6.4159, cc: 224.95 }, 7: { ccd: 6.7870, cc: 261.12 }, 9: { ccd: 7.7868, cc: 282.59 } },
  2: { 2: { ccd: 3.4827, cc: 170.79 }, 3: { ccd: 4.4391, cc: 194.88 }, 4: { ccd: 5.1022, cc: 212.78 }, 5: { ccd: 5.8459, cc: 227.67 }, 6: { ccd: 6.5163, cc: 231.13 }, 7: { ccd: 6.8753, cc: 265.31 }, 9: { ccd: 7.8823, cc: 287.97 } },
  3: { 2: { ccd: 4.1215, cc: 198.62 }, 3: { ccd: 5.2426, cc: 225.01 }, 4: { ccd: 6.0096, cc: 247.41 }, 5: { ccd: 6.8611, cc: 262.25 }, 6: { ccd: 7.6513, cc: 265.24 }, 7: { ccd: 8.1234, cc: 318.08 }, 9: { ccd: 9.2734, cc: 339.58 } },
  4: { 3: { ccd: 4.3763, cc: 189.72 }, 4: { ccd: 4.9834, cc: 203.55 }, 5: { ccd: 5.7253, cc: 218.14 }, 6: { ccd: 6.3932, cc: 221.21 }, 7: { ccd: 6.7861, cc: 260.98 }, 9: { ccd: 7.7579, cc: 277.83 } },
  5: { 2: { ccd: 3.4259, cc: 166.60 }, 3: { ccd: 4.3727, cc: 189.11 }, 4: { ccd: 4.9981, cc: 205.98 }, 5: { ccd: 5.7382, cc: 220.28 }, 6: { ccd: 6.4057, cc: 223.27 }, 7: { ccd: 6.8012, cc: 263.47 }, 9: { ccd: 7.7797, cc: 281.43 } },
  6: { 2: { ccd: 3.0257, cc: 166.60 }, 3: { ccd: 4.3722, cc: 189.03 }, 4: { ccd: 5.0076, cc: 207.54 }, 5: { ccd: 5.7382, cc: 220.28 }, 6: { ccd: 6.4057, cc: 223.27 }, 7: { ccd: 6.8012, cc: 263.47 }, 9: { ccd: 7.7797, cc: 281.43 } },
  7: { 2: { ccd: 3.9550, cc: 217.08 }, 3: { ccd: 4.9142, cc: 241.63 }, 4: { ccd: 5.5737, cc: 261.22 }, 5: { ccd: 6.3127, cc: 275.34 }, 6: { ccd: 6.9812, cc: 278.50 }, 7: { ccd: 7.3713, cc: 317.80 }, 9: { ccd: 8.3794, cc: 340.64 } },
  8: { 2: { ccd: 3.9850, cc: 222.03 }, 3: { ccd: 4.9517, cc: 247.82 }, 4: { ccd: 5.6203, cc: 268.91 }, 5: { ccd: 6.3640, cc: 283.80 }, 6: { ccd: 7.0343, cc: 287.26 }, 7: { ccd: 7.4123, cc: 324.57 }, 9: { ccd: 8.4276, cc: 348.60 } },
  9: { 2: { ccd: 4.5997, cc: 244.84 }, 3: { ccd: 5.7343, cc: 273.44 }, 4: { ccd: 6.5188, cc: 299.98 }, 5: { ccd: 7.3703, cc: 314.83 }, 6: { ccd: 8.1605, cc: 317.82 }, 7: { ccd: 8.6573, cc: 374.73 }, 9: { ccd: 9.8181, cc: 398.01 } },
  10: { 3: { ccd: 4.6358, cc: 229.62 }, 4: { ccd: 5.2797, cc: 246.64 }, 5: { ccd: 6.0216, cc: 261.24 }, 6: { ccd: 6.6895, cc: 264.30 }, 7: { ccd: 7.1014, cc: 307.21 }, 9: { ccd: 8.0815, cc: 325.43 } },
  11: { 2: { ccd: 3.6750, cc: 204.81 }, 3: { ccd: 4.6321, cc: 229.02 }, 4: { ccd: 5.2945, cc: 249.08 }, 5: { ccd: 6.0346, cc: 263.37 }, 6: { ccd: 6.7020, cc: 266.36 }, 7: { ccd: 7.1165, cc: 309.70 }, 9: { ccd: 8.1033, cc: 329.02 } },
  12: { 5: { ccd: 5.8647, cc: 241.14 }, 6: { ccd: 6.5481, cc: 246.76 }, 9: { ccd: 7.9676, cc: 312.42 } },
};

/** Table D – Alto Desempenho (veículo automotor) */
const TABLE_D: Record<TipoCarga, Partial<Record<Eixos, Coeficientes>>> = {
  1: { 4: { ccd: 4.5780, cc: 194.44 }, 5: { ccd: 5.1667, cc: 207.18 }, 6: { ccd: 5.8246, cc: 210.17 }, 7: { ccd: 6.0332, cc: 240.30 }, 9: { ccd: 6.7460, cc: 254.35 } },
  2: { 4: { ccd: 4.6409, cc: 194.44 }, 5: { ccd: 5.2296, cc: 207.18 }, 6: { ccd: 5.8875, cc: 210.17 }, 7: { ccd: 6.0961, cc: 240.30 }, 9: { ccd: 6.8089, cc: 254.35 } },
  3: { 4: { ccd: 5.5300, cc: 226.06 }, 5: { ccd: 6.2268, cc: 238.80 }, 6: { ccd: 7.0074, cc: 241.78 }, 7: { ccd: 7.2350, cc: 275.04 }, 9: { ccd: 8.1060, cc: 290.47 } },
  4: { 4: { ccd: 4.5780, cc: 194.44 }, 5: { ccd: 5.1667, cc: 207.18 }, 6: { ccd: 5.8246, cc: 210.17 }, 7: { ccd: 6.0332, cc: 240.30 }, 9: { ccd: 6.7460, cc: 254.35 } },
  5: { 4: { ccd: 4.5780, cc: 194.44 }, 5: { ccd: 5.1667, cc: 207.18 }, 6: { ccd: 5.8246, cc: 210.17 }, 7: { ccd: 6.0332, cc: 240.30 }, 9: { ccd: 6.7460, cc: 254.35 } },
  6: { 4: { ccd: 4.5780, cc: 194.44 }, 5: { ccd: 5.1667, cc: 207.18 }, 6: { ccd: 5.8246, cc: 210.17 }, 7: { ccd: 6.0332, cc: 240.30 }, 9: { ccd: 6.7460, cc: 254.35 } },
  7: { 4: { ccd: 5.1433, cc: 247.99 }, 5: { ccd: 5.7321, cc: 260.73 }, 6: { ccd: 6.3899, cc: 263.72 }, 7: { ccd: 6.6176, cc: 296.98 }, 9: { ccd: 7.3386, cc: 312.40 } },
  8: { 4: { ccd: 5.1590, cc: 250.57 }, 5: { ccd: 5.7477, cc: 263.31 }, 6: { ccd: 6.4056, cc: 266.30 }, 7: { ccd: 6.6332, cc: 299.56 }, 9: { ccd: 7.3542, cc: 314.98 } },
  9: { 4: { ccd: 6.0392, cc: 278.63 }, 5: { ccd: 6.7360, cc: 291.37 }, 6: { ccd: 7.5166, cc: 294.36 }, 7: { ccd: 7.7689, cc: 331.70 }, 9: { ccd: 8.6508, cc: 348.90 } },
  10: { 4: { ccd: 4.8743, cc: 237.54 }, 5: { ccd: 5.4631, cc: 250.28 }, 6: { ccd: 6.1209, cc: 253.27 }, 7: { ccd: 6.3486, cc: 286.53 }, 9: { ccd: 7.0696, cc: 301.95 } },
  11: { 4: { ccd: 4.8743, cc: 237.54 }, 5: { ccd: 5.4631, cc: 250.28 }, 6: { ccd: 6.1209, cc: 253.27 }, 7: { ccd: 6.3486, cc: 286.53 }, 9: { ccd: 7.0696, cc: 301.95 } },
  12: { 5: { ccd: 5.1667, cc: 207.18 }, 6: { ccd: 5.8246, cc: 210.17 }, 9: { ccd: 6.7460, cc: 254.35 } },
};

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------
const TIPOS_CARGA: { value: TipoCarga; label: string }[] = [
  { value: 1, label: "Granel sólido" },
  { value: 2, label: "Granel líquido" },
  { value: 3, label: "Frigorificada ou Aquecida" },
  { value: 4, label: "Conteinerizada" },
  { value: 5, label: "Carga Geral" },
  { value: 6, label: "Neogranel" },
  { value: 7, label: "Perigosa (granel sólido)" },
  { value: 8, label: "Perigosa (granel líquido)" },
  { value: 9, label: "Perigosa (frigorificada ou aquecida)" },
  { value: 10, label: "Perigosa (conteinerizada)" },
  { value: 11, label: "Perigosa (carga geral)" },
  { value: 12, label: "Carga Granel Pressurizada" },
];

const EIXOS_OPTIONS: Eixos[] = [2, 3, 4, 5, 6, 7, 9];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escolherTabela(
  composicaoVeicular: boolean,
  altoDesempenho: boolean,
): Record<TipoCarga, Partial<Record<Eixos, Coeficientes>>> {
  if (composicaoVeicular && altoDesempenho) return TABLE_C;
  if (!composicaoVeicular && altoDesempenho) return TABLE_D;
  if (composicaoVeicular && !altoDesempenho) return TABLE_A;
  return TABLE_B;
}

function getNomeTabela(composicaoVeicular: boolean, altoDesempenho: boolean): string {
  if (composicaoVeicular && altoDesempenho) return "Tabela C – Alto Desempenho (composição veicular)";
  if (!composicaoVeicular && altoDesempenho) return "Tabela D – Alto Desempenho (veículo automotor)";
  if (composicaoVeicular && !altoDesempenho) return "Tabela A – Composição veicular";
  return "Tabela B – Veículo automotor de cargas";
}

function formatMoney(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Props {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CalculadoraAnttModal({ open, onClose }: Props) {
  const [tipoCarga, setTipoCarga] = useState<TipoCarga | "">("");
  const [numeroEixos, setNumeroEixos] = useState<Eixos | "">("");
  const [distancia, setDistancia] = useState<string>("");
  const [composicaoVeicular, setComposicaoVeicular] = useState(false);
  const [altoDesempenho, setAltoDesempenho] = useState(false);
  const [retornoVazio, setRetornoVazio] = useState(false);
  const [resultado, setResultado] = useState<{
    tabela: string;
    ccd: number;
    cc: number;
    valorIda: number;
    valorRetorno: number;
    total: number;
    tipoOperacao: string;
  } | null>(null);
  const [erro, setErro] = useState("");

  function handleCalcular() {
    setErro("");
    setResultado(null);

    if (!tipoCarga) { setErro("Selecione o tipo de carga."); return; }
    if (!numeroEixos) { setErro("Selecione o número de eixos."); return; }
    const dist = Number(distancia);
    if (!dist || dist < 1 || dist > 99999) { setErro("Informe a distância (1 a 99999 km)."); return; }

    const tabela = escolherTabela(composicaoVeicular, altoDesempenho);
    const coef = tabela[tipoCarga][numeroEixos];

    if (!coef) {
      setErro("Combinação de tipo de carga e número de eixos não disponível nas tabelas da ANTT.");
      return;
    }

    const valorIda = dist * coef.ccd + coef.cc;
    const valorRetorno = retornoVazio ? 0.92 * dist * coef.ccd : 0;
    const total = valorIda + valorRetorno;

    const tipoOp = composicaoVeicular
      ? "Operação com contratação da composição veicular"
      : "Operação com contratação apenas do veículo automotor de cargas";

    setResultado({
      tabela: getNomeTabela(composicaoVeicular, altoDesempenho),
      ccd: coef.ccd,
      cc: coef.cc,
      valorIda,
      valorRetorno,
      total,
      tipoOperacao: tipoOp,
    });
  }

  function handleClose() {
    setResultado(null);
    setErro("");
    onClose();
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="antt-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            key="antt-modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="antt-modal-content mx-4 flex w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-2xl shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ---- Header ---- */}
            <div className="antt-modal-header flex shrink-0 items-center justify-between gap-3 border-b border-border p-5 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Calculator className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Calculadora ANTT</h2>
                  <p className="text-[10px] text-muted-foreground">
                    Piso Mínimo de Frete — Res. ANTT nº 5.867/2020
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ---- Body ---- */}
            <div className="antt-modal-body flex-1 space-y-5 overflow-y-auto p-5">
              {/* Linha 1: Tipo de Carga + Nº Eixos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Tipo de Carga
                  </label>
                  <select
                    value={tipoCarga}
                    onChange={(e) => { setTipoCarga(e.target.value ? (Number(e.target.value) as TipoCarga) : ""); setResultado(null); }}
                    className="mobile-select w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="">Selecione</option>
                    {TIPOS_CARGA.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Número de Eixos
                  </label>
                  <select
                    value={numeroEixos}
                    onChange={(e) => { setNumeroEixos(e.target.value ? (Number(e.target.value) as Eixos) : ""); setResultado(null); }}
                    className="mobile-select w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="">Selecione</option>
                    {EIXOS_OPTIONS.map((e) => (
                      <option key={e} value={e}>
                        {e} eixos
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linha 2: Distância */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Distância (km)
                </label>
                <input
                  type="number"
                  min={1}
                  max={99999}
                  value={distancia}
                  onChange={(e) => { setDistancia(e.target.value); setResultado(null); }}
                  placeholder="Ex.: 100"
                  className="mobile-input w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
              </div>

              {/* Botões Sim / Não */}
              <div className="space-y-4 rounded-lg border border-border/60 bg-muted/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Características da Operação
                </p>

                {/* Composição Veicular */}
                <div className="antt-toggle-row flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">É composição veicular?</p>
                    <p className="text-[10px] leading-tight text-muted-foreground">
                      (veículo automotor + implemento ou caminhão simples)
                    </p>
                  </div>
                  <div className="antt-toggle-buttons flex gap-1">
                    {(["Não", "Sim"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setComposicaoVeicular(opt === "Sim"); setResultado(null); }}
                        className={cn(
                          "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
                          (opt === "Sim") === composicaoVeicular
                            ? "bg-primary text-primary-foreground shadow-glow"
                            : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alto Desempenho */}
                <div className="antt-toggle-row flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">É Alto Desempenho?</p>
                  <div className="antt-toggle-buttons flex gap-1">
                    {(["Não", "Sim"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setAltoDesempenho(opt === "Sim"); setResultado(null); }}
                        className={cn(
                          "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
                          (opt === "Sim") === altoDesempenho
                            ? "bg-primary text-primary-foreground shadow-glow"
                            : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Retorno Vazio */}
                <div className="antt-toggle-row flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">Retorno Vazio?</p>
                  <div className="antt-toggle-buttons flex gap-1">
                    {(["Não", "Sim"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setRetornoVazio(opt === "Sim"); setResultado(null); }}
                        className={cn(
                          "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
                          (opt === "Sim") === retornoVazio
                            ? "bg-primary text-primary-foreground shadow-glow"
                            : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Erro */}
              {erro && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              {/* Botão Calcular */}
              <button
                type="button"
                onClick={handleCalcular}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-glow"
              >
                <Calculator className="h-4 w-4" />
                Calcular
              </button>

              {/* Resultado */}
              {resultado && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4"
                >
                  <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Resultado do Cálculo
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] text-muted-foreground">VALOR TABELA ANTT OFICIAL</span>
                    <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                      R$ {formatMoney(resultado.total)}
                    </p>
                  </div>

                  <div className="space-y-1 rounded-lg bg-background/50 p-3 text-xs text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Operação:</span>{" "}
                      {resultado.tipoOperacao}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Tabela utilizada:</span>{" "}
                      {resultado.tabela}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">CCD:</span>{" "}
                      {formatMoney(resultado.ccd)}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">CC:</span>{" "}
                      {formatMoney(resultado.cc)}
                    </p>
                    <p>
                      Valor de ida = (Distância × CCD) + CC:{" "}
                      <span className="font-medium text-foreground">
                        R$ {formatMoney(resultado.valorIda)}
                      </span>
                    </p>
                    {resultado.valorRetorno > 0 && (
                      <p>
                        Valor do retorno vazio = 0,92 × Distância × CCD:{" "}
                        <span className="font-medium text-foreground">
                          R$ {formatMoney(resultado.valorRetorno)}
                        </span>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Rodapé informativo */}
              <div className="rounded-lg bg-muted/30 px-3 py-2">
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Valores calculados conforme Resolução ANTT nº 5.867/2020. O valor do pedágio,
                  quando houver, deverá ser obrigatoriamente acrescido ao piso mínimo. Consulte o
                  site oficial da ANTT para a tabela mais atualizada.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
