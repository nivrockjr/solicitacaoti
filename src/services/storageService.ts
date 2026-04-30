import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

/**
 * storageService
 * Centraliza todas as operações no Supabase Storage. Componentes e demais
 * services devem consumir este service em vez de chamar `supabase.storage`
 * diretamente (Diretiva 6 #8 do CLAUDE.md).
 */

/** Bucket privado dos anexos vinculados a solicitações. */
export const ATTACHMENTS_BUCKET = 'anexos-solicitacoes';

/** Bucket público que hospeda o guia do usuário (PDF). */
export const GUIDE_BUCKET = 'guideit';

/** Pasta de uma solicitação dentro do bucket de anexos. */
const requestFolder = (requestId: string) => `solicitacao_${requestId}`;

/** Sanitiza nomes de arquivo para uso seguro como path no Storage. */
const sanitizeFileName = (name: string): string =>
  name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();

/**
 * Faz upload de um arquivo. Se `requestId` for informado, agrupa o arquivo na
 * pasta `solicitacao_<id>`. Caso contrário, vai para a pasta `geral`.
 * Retorna o `filePath` final (string), igual ao comportamento histórico de
 * `requestService.uploadFile` antes da migração.
 */
export const uploadAttachment = async (file: File, requestId?: string): Promise<string> => {
  const folder = requestId ? requestFolder(requestId) : 'geral';
  const uniqueName = `${uuidv4()}_${sanitizeFileName(file.name)}`;
  const filePath = `${folder}/${uniqueName}`;

  const { error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(filePath, file);
  if (error) throw new Error('Erro ao enviar arquivo');

  return filePath;
};

/**
 * Remove a pasta de anexos de uma solicitação. Operação opcional — falha aqui
 * não deve bloquear a exclusão da linha em `solicitacoes` (mantém o
 * comportamento histórico de `requestService.deleteRequest`).
 */
export const deleteAttachmentFolder = async (requestId: string): Promise<void> => {
  await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .remove([requestFolder(requestId)]);
};

/**
 * Gera uma URL temporária assinada para um arquivo do bucket privado de
 * anexos. Padrão atual: 60 segundos de validade — suficiente para o usuário
 * abrir o arquivo numa nova aba.
 */
export const getAttachmentSignedUrl = async (
  filePath: string,
  expiresInSeconds: number = 60
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(filePath, expiresInSeconds);
  if (error || !data?.signedUrl) {
    throw error ?? new Error('Não foi possível gerar a URL do anexo.');
  }
  return data.signedUrl;
};

/**
 * Constrói a URL pública (sem assinatura) para um objeto em bucket público.
 * Usa `VITE_SUPABASE_URL` do .env como base para evitar hardcode do project ref.
 */
export const getPublicStorageUrl = (bucket: string, path: string): string => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
};

/** URL pública direta para o guia do usuário (PDF). */
export const getGuidePdfUrl = (): string => getPublicStorageUrl(GUIDE_BUCKET, 'guideit.pdf');
