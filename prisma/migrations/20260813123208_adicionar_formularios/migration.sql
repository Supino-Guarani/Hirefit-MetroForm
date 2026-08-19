-- CreateTable
CREATE TABLE "Formulario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "notaCorte" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Pergunta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "texto" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "obrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "formularioId" INTEGER NOT NULL,
    CONSTRAINT "Pergunta_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "Formulario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Opcao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "texto" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "ordem" INTEGER NOT NULL,
    "perguntaId" INTEGER NOT NULL,
    CONSTRAINT "Opcao_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES "Pergunta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Candidato" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formularioId" INTEGER NOT NULL,
    CONSTRAINT "Candidato_formularioId_fkey" FOREIGN KEY ("formularioId") REFERENCES "Formulario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Resposta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "candidatoId" INTEGER NOT NULL,
    "perguntaId" INTEGER NOT NULL,
    "opcaoId" INTEGER NOT NULL,
    CONSTRAINT "Resposta_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Resposta_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES "Pergunta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Resposta_opcaoId_fkey" FOREIGN KEY ("opcaoId") REFERENCES "Opcao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
