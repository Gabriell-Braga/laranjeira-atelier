// Tipos e funções puras de imagem. Pode ser importado por componentes de cliente.

export type ImagemInfo = {
  base: string; // "/img/wix/ilustracao/saira-azul-8b1feae2"
  larguras: number[];
  largura: number;
  altura: number;
  cor: string;
  placeholder?: string; // ausente em imagens com transparência
  alt: string;
};

// Imagem de galeria: abre no lightbox e tem legenda.
export type ImagemGaleria = ImagemInfo & {
  slug: string; // usado em ?imagem=slug
  titulo?: string;
  cientifico?: string;
  tecnica?: string; // rótulo pronto, ex.: "Aquarela, Pastel"
  origem?: string;
  descricao?: string;
};

export const urlImagem = (img: Pick<ImagemInfo, "base">, largura: number) => `${img.base}-${largura}.webp`;

export const srcSet = (img: ImagemInfo) => img.larguras.map((l) => `${urlImagem(img, l)} ${l}w`).join(", ");

// Fallback para navegadores sem srcset: a versão de ~960px, ou a maior que existir.
export const srcPadrao = (img: ImagemInfo) =>
  urlImagem(img, img.larguras.find((l) => l >= 960) ?? img.larguras[img.larguras.length - 1]);

export const pendente = (texto: string | undefined) => !texto || texto.startsWith("[PREENCHER");
