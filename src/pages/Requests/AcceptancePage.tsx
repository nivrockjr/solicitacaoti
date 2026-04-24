import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getRequestById, updateRequest } from '@/services/requestService';
import { ITRequest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SignatureCanvas } from '@/components/ui/signature-canvas';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, ShieldCheck, Info, FileText } from 'lucide-react';
import { tryFormatDateTime } from '@/lib/utils';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const CICLO_TYPE = 'employee_lifecycle' as const;
const TERM_VERSION = 'v2.0';
const TERM_EFFECTIVE_DATE = '31/03/2026';

const AcceptancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ITRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  /** Após assinar nesta sessão: tela curta primeiro; reabrir link depois mostra comprovante completo. */
  const [showCompactSuccess, setShowCompactSuccess] = useState(false);
  const [revealFullReceipt, setRevealFullReceipt] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [traineeName, setTraineeName] = useState('');
  const [traineeDepartment, setTraineeDepartment] = useState('');
  const { toast } = useToast();

  // Função para extrair o nome do colaborador do título (ex: "Onboarding - Wendell")
  const getCollaboratorName = () => {
    if (!request?.title) return request?.requestername || 'Colaborador';
    
    // Regex para capturar tudo o que vem após a ação (Onboarding, Offboarding ou Treinamento) e o separador " - "
    const regex = /(?:Onboarding|Offboarding|Treinamento)\s*-\s*(.+)$/i;
    const match = request.title.match(regex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Fallback: se não encontrar o padrão acima, tenta o hífen simples
    const parts = request.title.split(' - ');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
    
    return request.requestername || 'Colaborador';
  };

  const collaboratorName = getCollaboratorName();
  const titleLower = request?.title?.toLowerCase() || '';
  const isTraining = titleLower.includes('treinamento');
  const isOffboarding = titleLower.includes('offboarding');
  const isOnboarding = !isTraining && !isOffboarding;

  // Lógica master para detecção de perfil baseada nos recursos marcados
  // Buscamos tanto na descrição atual quanto nos comentários (caso o TI já tenha definido os itens)
  const originalComment = request?.comments?.find(c => c.text.includes('[SOLICITAÇÃO ORIGINAL]'))?.text || '';
  const fullContextText = `${request?.description || ''} ${originalComment}`;

  // Extrai o setor/função do colaborador da descrição original
  const colaboradorSetor = fullContextText.match(/Setor:\s*(.+?)(?:\n|$)/)?.[1]?.trim() || '';
  const fullContextLowerCase = fullContextText.toLowerCase();

  // Prioriza o dado estruturado salvo na nova arquitetura (JSONB)
  const isStructured = Array.isArray(request?.metadata?.form_data?.accessItems);
  const metadataAccessItems = request?.metadata?.form_data?.accessItems || [];

  const checkStructuredItem = (id: string, label: string) => {
    return metadataAccessItems.includes(id) || metadataAccessItems.includes(label);
  };

  const hasCorporateChannels = isStructured
    ? checkStructuredItem('conta_canais', 'Contas e Canais Corporativos')
    : (fullContextLowerCase.includes('contas e canais') ||
       fullContextLowerCase.includes('conta e canais') ||
       fullContextLowerCase.includes('e-mail corporativo') ||
       fullContextLowerCase.includes('conta_canais'));
    
  const hasSystems = isStructured
    ? checkStructuredItem('sistemas', 'Acesso aos sistemas e pastas')
    : (fullContextLowerCase.includes('sistemas e pastas') ||
       fullContextLowerCase.includes('sistemas'));
    
  const hasHardware = isStructured
    ? checkStructuredItem('equipamentos', 'Equipamentos')
    : fullContextLowerCase.includes('equipamentos');

  const hasDigitalIdentity = hasSystems || hasCorporateChannels;

  const getTermHeading = () => {
    if (isOffboarding) return 'TERMO DE DEVOLUÇÃO E ENCERRAMENTO DE ACESSOS';
    if (isTraining) return 'TERMO DE CIÊNCIA — TREINAMENTO';
    return 'TERMO DE RECEBIMENTO E ACEITE — ENTRADA DE COLABORADOR';
  };

  const getItemsLabel = () => {
    if (isTraining) return 'Módulos/Tópicos de Treinamento:';
    if (isOffboarding) return 'Itens a Devolver:';
    return 'Itens Recebidos:';
  };

  const getTrainingContent = () => {
    const raw = request?.description || '';
    const marker = 'Conteúdo do Treinamento:\n';
    const markerIndex = raw.indexOf(marker);
    if (markerIndex === -1) return raw;
    const afterMarker = raw.slice(markerIndex + marker.length);
    const observationsIndex = afterMarker.indexOf('\n\nObservações:');
    if (observationsIndex === -1) return afterMarker.trim();
    return afterMarker.slice(0, observationsIndex).trim();
  };

  // Extrai apenas os itens da lista da descrição, removendo cabeçalhos internos do sistema
  const getCleanItemsText = (): string => {
    // Caso 0: Prioridade para Metadados Estruturados (Auditoria Precisa)
    const metaItems = request?.metadata?.delivery_items;
    if (Array.isArray(metaItems)) {
      return metaItems
        .filter((it: any) => it.checked)
        .map((it: any) => `- ${it.text}${it.avaria ? ` (Obs TI: ${it.avaria})` : ''}`)
        .join('\n');
    }

    const raw = request?.description || '';

    // Caso 1: Admin usou "Definir Itens de Entrega" — tem marcador 'Itens a Entregar:' ou 'Itens a Devolver:'
    const markerMatch = raw.match(/Itens a (?:Entregar|Devolver):\n([\s\S]*)/);
    if (markerMatch && markerMatch[1]) {
      return markerMatch[1].trim();
    }

    // Caso 2: Descrição original (sem step de definição) — filtra campos internos do sistema
    // Remove linhas que começam com Ação:, Colaborador:, Prazo:, SLA:
    const filteredLines = raw
      .split('\n')
      .filter(line => {
        const lower = line.toLowerCase().trim();
        return (
          !lower.startsWith('ação:') &&
          !lower.startsWith('colaborador:') &&
          !lower.startsWith('prazo:') &&
          !lower.startsWith('sla:')
        );
      })
      .join('\n')
      .trim();

    return filteredLines;
  };

  // Função para gerar as seções do termo dinamicamente
  const renderTermSections = (isPrint = false) => {
    let sectionCount = 0;
    const getNextNum = () => {
      sectionCount++;
      return `${sectionCount}.`;
    };

    return (
      <div className={isPrint ? "space-y-4 print:space-y-1" : "space-y-4"}>
        {/* ONBOARDING */}
        {isOnboarding && (
          <>
            {/* 1. FINALIDADE — sempre presente */}
            <section>
              <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
                {getNextNum()} FINALIDADE
              </h4>
              <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
                Este termo registra a ciência sobre as políticas de uso vigentes na PQVIRK e, quando aplicável, formaliza o recebimento de recursos corporativos de TI.
              </p>
            </section>

            {/* AMBIENTE E REDE CONECTADA — sempre presente no Onboarding */}
            <section>
              <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
                {getNextNum()} AMBIENTE E REDE CONECTADA
              </h4>
              <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
                As dependências da PQVIRK são resguardadas por monitoramento de vídeo e áudio ambiental, restrito a propósitos de segurança e prevenção patrimonial. Complementarmente, a empresa dispõe de acesso Wi-Fi isolado para as operações. Em estrito cumprimento ao Marco Civil da Internet (Lei 12.965/14), o roteador de rede corporativa realiza a coleta e retenção de metadados de sessão (endereços IP visitados, tráfego de dados e carimbos de data/hora) para auditoria e controle de incidentes cibernéticos. O uso da rede para acesso, download ou compartilhamento de materiais ilícitos, pirataria ou pornografia é terminantemente proibido.
              </p>
            </section>

            {/* DISPOSITIVOS TECNOLÓGICOS — se marcou Equipamentos */}
            {hasHardware && (
              <section>
                <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
                  {getNextNum()} DISPOSITIVOS TECNOLÓGICOS
                </h4>
                <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
                  Os hardwares fornecidos (computadores, smartphones e periféricos) são ativos operacionais sob guarda temporária do colaborador e de uso exclusivo para as atividades da empresa. O setor de TI exerce a gestão de segurança centralizada desses ativos, o que inclui rotinas automáticas de gerenciamento remoto e possibilidade de bloqueio cautelar em caso de extravio. Durante a jornada de trabalho, a captura de dados de geolocalização dos dispositivos móveis está expressamente autorizada para as finalidades de apoio logístico, acompanhamento de rotas de frota e segurança do equipamento.
                </p>
              </section>
            )}

            {/* COMUNICAÇÃO CORPORATIVA E TELECOM — se marcou Contas e Canais */}
            {hasCorporateChannels && (
              <section>
                <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
                  {getNextNum()} COMUNICAÇÃO CORPORATIVA E TELECOM
                </h4>
                <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
                  O endereço de e-mail corporativo e a linha telefônica concedida (cartão SIM ou eSIM) compreendem ferramentas de comunicação empresarial. Todo fluxo de e-mail pertencente à empresa é passível de revisão e auditoria corporativa motivada por segurança da informação ou continuidade processual. A gestão de telefonia audita continuamente as faturas geradas pela operadora — analisando apenas volume de dados móveis utilizados, histórico de números discados e tempo de ligação. O conteúdo das audições telefônicas privadas não é gravado, monitorado ou interceptado pela infraestrutura técnica.
                </p>
              </section>
            )}

            {/* IDENTIDADE DIGITAL E SISTEMAS — se marcou Sistemas */}
            {hasSystems && (
              <section>
                <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
                  {getNextNum()} IDENTIDADE DIGITAL E SISTEMAS
                </h4>
                <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
                  As credenciais sistêmicas emitidas pelo setor de TI (usuário e senha) configuram a assinatura lógica do colaborador na empresa. Toda manipulação, exclusão ou criação de registros nos sistemas e pastas em rede corporativa são gravadas e mantidas em logs de auditoria (rastreabilidade estrutural). A identidade digital é pessoal e absolutamente intransferível, configurando infração de Segurança da Informação o fornecimento de senhas a terceiros ou outros colaboradores.
                </p>
              </section>
            )}

            {/* ACEITE — sempre presente */}
            <section>
              <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
                {getNextNum()} ACEITE
              </h4>
              <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
                Declaro que li e aceito formalmente as condições estabelecidas nos itens acima.
              </p>
            </section>
          </>
        )}

        {/* OFFBOARDING */}
        {isOffboarding && (
          <>
            <section>
              <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
                {getNextNum()} FINALIDADE
              </h4>
              <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
                Este termo registra o encerramento dos acessos de TI e, quando aplicável, a devolução de equipamentos.
              </p>
            </section>

            {hasDigitalIdentity && (
              <section>
                <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
                  {getNextNum()} ENCERRAMENTO DE ACESSOS
                </h4>
                <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
                  Todos os acessos digitais corporativos serão encerrados pelo TI. O uso de qualquer credencial da empresa após essa data não é permitido.
                </p>
              </section>
            )}

            {hasHardware && (
              <section>
                <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
                  {getNextNum()} DEVOLUÇÃO DE EQUIPAMENTOS
                </h4>
                <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
                  Os equipamentos corporativos devem ser devolvidos em boas condições de uso, considerando desgaste natural, conforme prazo orientado pelo RH.
                </p>
              </section>
            )}

            <section>
              <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
                {getNextNum()} SIGILO
              </h4>
              <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
                O dever de sigilo sobre informações da empresa permanece após o desligamento.
              </p>
            </section>

            <section>
              <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
                {getNextNum()} ACEITE
              </h4>
              <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
                O encerramento dos acessos digitais entra em vigor nesta data. Referente à estrutura física, o colaborador toma ciência do checklist de coletas acima, bem como das eventuais ressalvas lançadas em caráter técnico pelo departamento de TI na ocasião deste recebimento. O TI atua apenas como registrador das devoluções. Condições incomuns documentadas serão encaminhadas para o RH e Diretoria para análise. Declaro ciência dos termos acima.
              </p>
            </section>
          </>
        )}

        {/* TREINAMENTO */}
        {isTraining && (
          <>
            <section>
              <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
                {getNextNum()} FINALIDADE
              </h4>
              <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
                Este termo registra a participação e a ciência do colaborador sobre o treinamento de TI realizado.
              </p>
            </section>

            {hasHardware && (
              <section>
                <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
                  {getNextNum()} RECURSOS UTILIZADOS
                </h4>
                <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
                  Os recursos de TI disponibilizados para este treinamento são de uso exclusivo para essa finalidade.
                </p>
              </section>
            )}

            <section>
              <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
                {getNextNum()} CIÊNCIA
              </h4>
              <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
                Declaro que participei do treinamento listado e estou ciente do conteúdo apresentado.
              </p>
            </section>
          </>
        )}
        <section className="mt-4 pt-3 border-t border-border/50">
          <h4 className={`font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`}>
            DADOS, PRIVACIDADE E RETENÇÃO
          </h4>
          <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt]" : "text-[12px] text-foreground"}>
            Este registro digital será mantido pela PQVIRK pelo prazo mínimo de 5 (cinco) anos, para fins de controle de ativos, rastreabilidade e conformidade, conforme boas práticas de gestão de TI e legislação aplicável (LGPD Art. 9, §1).
          </p>
          <p className={isPrint ? "text-[12px] text-foreground print:text-black print:text-[8.5pt] mt-1" : "text-[12px] text-foreground mt-1"}>
            Os dados registrados neste sistema — nome, setor, assinatura digital e ativos de TI associados — são utilizados exclusivamente para fins de gestão de equipamentos e acessos corporativos. O titular pode solicitar acesso, correção ou exclusão desses registros diretamente ao responsável de TI da PQVIRK (LGPD Art. 18).
          </p>
        </section>
      </div>
    );
  };

  const handleOpenGuide = () => {
    window.open('https://bwzqbxyqnxygoukhrtxh.supabase.co/storage/v1/object/public/guideit/guideit.pdf', '_blank');
  };

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Busca pública (baseada na Policy do Supabase que permite leitura por ID)
        const data = await getRequestById(id);
        if (data) {
          setRequest(data);
          const done =
            data.status === 'resolved' ||
            data.status === 'closed';
          if (done) {
            setCompleted(true);
            setShowCompactSuccess(false);
            setRevealFullReceipt(true);
          }
        }
      } catch (error) {
        if (!import.meta.env.PROD) console.error('Erro ao buscar solicitação:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id]);

  const handleFinalize = async () => {
    if (!id || !signature || !request || !acceptedTerms) return;
    if (request.type !== CICLO_TYPE) return;
    if (isTraining) {
      if (!traineeName.trim() || !traineeDepartment.trim()) return;
    }

    try {
      setSubmitting(true);
      
      // 1. Prepara o anexo da assinatura
      const signatureAttachment = {
        id: crypto.randomUUID(),
        fileName: `assinatura_aceite_${id}.png`,
        fileType: 'image/png',
        uploadedAt: new Date().toISOString(),
        isSignature: true,
        signatureData: signature // Salvamos o base64 diretamente no JSON do chamado
      };

      // 2. Atualiza o chamado
      const trainingResolutionPrefix = `Treinamento confirmado por ${traineeName.trim()} (${traineeDepartment.trim()}). `;
      const updates: Partial<ITRequest> = {
        status: 'resolved',
        resolvedat: new Date().toISOString(),
        resolution: isTraining
          ? `${trainingResolutionPrefix}Termo de ciência e aceite assinado digitalmente.`
          : `Termo de aceite assinado digitalmente por ${collaboratorName}.`,
        attachments: [...(request.attachments || []), signatureAttachment]
      };

      const updated = await updateRequest(id, updates);
      setRequest(updated);
      setCompleted(true);
      setShowCompactSuccess(true);
      setRevealFullReceipt(false);
      toast({
        title: 'Sucesso!',
        description: 'Seu aceite foi registrado com sucesso.',
      });
    } catch (error) {
      if (!import.meta.env.PROD) console.error('Erro ao finalizar aceite:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o seu aceite. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Link Inválido</CardTitle>
            <CardDescription>Esta solicitação não foi encontrada ou o link expirou.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (request.type !== CICLO_TYPE) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Termo não disponível</CardTitle>
            <CardDescription className="text-left">
              Este endereço não corresponde a um termo de aceite do <strong>Ciclo de Vida</strong>. Use o link enviado pela equipe de TI ou pelo seu gestor para o processo correto.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (completed && showCompactSuccess && !revealFullReceipt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full shadow-lg border-t-4 border-t-green-500">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-14 w-14 text-green-500" />
            </div>
            <CardTitle className="text-xl">Aceite registrado</CardTitle>
            <CardDescription className="text-base pt-2">
              Seu aceite foi salvo com sucesso. Você pode fechar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <Button className="w-full" variant="outline" onClick={() => setRevealFullReceipt(true)}>
              Ver comprovante completo / imprimir
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              O registro permanece no sistema para auditoria e conferência pela TI.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    // Busca a assinatura nos anexos
    const signatureAttachment = request.attachments?.find(a => a.isSignature);
    const signatureData = signatureAttachment?.signatureData;

    return (
      <div className="min-h-screen bg-muted/30 p-4 md:p-8 flex justify-center items-start print:bg-white print:p-0 print:min-h-0">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            /* Esconde absolutamente TUDO no body */
            body * {
              visibility: hidden !important;
            }
            /* Mostra apenas o nosso termo e seus filhos */
            #printable-term, #printable-term * {
              visibility: visible !important;
            }
            /* Posiciona o termo no topo da página de impressão */
            #printable-term {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        ` }} />
        <Card className="max-w-2xl w-full shadow-lg border-t-4 border-t-green-500 print:shadow-none print:border-none print:max-w-none">
          <CardHeader className="text-center border-b bg-card py-4 print:hidden">
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="text-xl">Termo Digital de TI</CardTitle>
            <CardDescription>Aceite e comprovante do ciclo do colaborador</CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6 print:p-0">
            <div id="printable-term" className="bg-card text-card-foreground p-6 rounded-lg border border-border text-[13px] leading-relaxed max-h-[550px] overflow-y-auto custom-scrollbar print:bg-white print:text-black print:max-h-none print:overflow-visible print:border-none print:p-0 print:text-[11pt] text-justify">
              <p className="mb-4 font-bold text-center border-b border-border pb-2 uppercase tracking-wide text-sm text-foreground print:text-base print:border-black print:mb-2 print:text-black">
                {getTermHeading()}
              </p>
              
              <p className="mb-6 italic text-muted-foreground text-center text-[11px] border-b border-border pb-4 print:text-[9pt] print:border-black print:mb-4 print:pb-2 print:text-neutral-600">
                Documento eletrônico com registro de aceite, data/hora e evidências de auditoria no sistema interno.
              </p>

              <p className="mb-4 text-foreground print:text-black print:mb-2">
                Eu, <span className="underline font-semibold">{collaboratorName}</span>, colaborador(a) da <strong>PQVIRK</strong>{colaboradorSetor ? `, do setor de ${colaboradorSetor},` : ','} declaro para os devidos fins de controle de qualidade e gestão de ativos que:
              </p>

              {renderTermSections(true)}
              
              {isTraining ? (
                <div className="bg-muted/50 p-4 rounded-md border border-border my-6 print:bg-slate-50 print:border-black/10 print:my-4 print:p-2">
                  <p className="text-[11px] font-bold text-foreground mb-2 uppercase tracking-tighter print:mb-1 print:text-black">
                    Conteúdo do Treinamento:
                  </p>
                  <div className="whitespace-pre-wrap text-sm font-medium text-foreground print:text-[10pt] print:text-black">
                    {getTrainingContent() || "Nenhum conteúdo de treinamento informado."}
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 p-4 rounded-md border border-border my-6 print:bg-slate-50 print:border-black/10 print:my-4 print:p-2">
                  <p className="text-[11px] font-bold text-foreground mb-2 uppercase tracking-tighter print:mb-1 print:text-black">
                    {getItemsLabel()}
                  </p>
                  <div className="whitespace-pre-wrap text-sm font-medium text-foreground print:text-[10pt] print:text-black">
                    {getCleanItemsText() || "Nenhum detalhe registrado."}
                  </div>
                </div>
              )}

              <div className="flex justify-center mb-4 no-print">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5"
                  onClick={handleOpenGuide}
                >
                  <FileText className="h-4 w-4" />
                  Acessar Guia de Solicitação de TI
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-border flex flex-col items-center gap-4 print:mt-4 print:pt-4 print:gap-2 print:border-black/10">
                {signatureData ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={signatureData} 
                      alt="Assinatura do Colaborador" 
                      className="max-h-24 object-contain border-b border-border pb-1 print:max-h-20 print:border-black/20"
                    />
                    <p className="text-sm font-bold uppercase tracking-widest mt-2 text-foreground print:text-[10pt] print:mt-1 print:text-black">{collaboratorName}</p>
                    <p className="text-[10px] text-muted-foreground italic print:text-[8pt] print:text-neutral-600">Assinado em: {tryFormatDateTime(request.resolvedat, "dd/MM/yyyy 'às' HH:mm") ?? 'Data não registrada'}</p>
                  </div>
                ) : (
                  <div className="text-center p-4 border border-border rounded-md bg-yellow-500/10 text-yellow-800 dark:text-yellow-200 text-xs">
                    Assinatura não encontrada nos registros.
                  </div>
                )}
              </div>

              <div className="mt-8 text-[10px] text-muted-foreground border-t border-border pt-4 space-y-1 print:text-neutral-600 print:border-black/10">
                <p><strong className="text-foreground print:text-black">ID da Solicitação:</strong> {id}</p>
                <p><strong className="text-foreground print:text-black">Código de Rastreabilidade:</strong> {id?.split('-')[0].toUpperCase()}-{new Date(request.resolvedat || '').getTime()}</p>
                <p><strong className="text-foreground print:text-black">Versão do Termo:</strong> {TERM_VERSION}</p>
                <p><strong className="text-foreground print:text-black">Vigência:</strong> {TERM_EFFECTIVE_DATE}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 print:hidden">
              {showCompactSuccess && revealFullReceipt && (
                <Button variant="ghost" className="w-full text-sm" onClick={() => setRevealFullReceipt(false)}>
                  Voltar ao resumo
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.print()}
              >
                Imprimir / Salvar PDF
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Obrigado, {collaboratorName}. Você já pode fechar esta aba.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 flex justify-center items-start print:p-0 print:bg-white print:min-h-0">
      <Card className="max-w-2xl w-full shadow-lg border-t-4 border-t-primary print:border-none print:shadow-none print:max-w-none print:w-full">
        <CardHeader className="text-center border-b bg-card print:p-2 print:bg-white print:border-none">
          <div className="flex justify-center mb-2">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-xl">Termo Digital de TI</CardTitle>
          <CardDescription>Aceite e comprovante do ciclo do colaborador</CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6 print:p-0 print:space-y-2">
          {isTraining && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Conteúdo do treinamento</p>
              <div className="whitespace-pre-wrap text-sm bg-muted/30 border border-border rounded-md p-3 max-h-[220px] overflow-y-auto text-foreground">
                {getTrainingContent() || 'Conteúdo não informado.'}
              </div>
            </div>
          )}

          <div className="bg-card text-card-foreground p-6 rounded-lg border border-border text-[13px] leading-relaxed max-h-[550px] overflow-y-auto custom-scrollbar text-justify print:max-h-none print:overflow-visible print:border-none print:p-0 print:bg-white print:text-black">
            <p className="mb-4 font-bold text-center border-b border-border pb-2 uppercase tracking-wide text-sm text-foreground print:text-black print:mb-2 print:text-[12px] print:border-black/20">
              {getTermHeading()}
            </p>
            
            <p className="mb-4 text-foreground print:text-black print:text-[11px] print:mb-2">
              Eu, <span className="underline font-semibold">{collaboratorName}</span>, colaborador(a) da <strong>PQVIRK</strong>{colaboradorSetor ? `, do setor de ${colaboradorSetor},` : ','} declaro para os devidos fins de controle de qualidade e gestão de ativos que:
            </p>
            
            {renderTermSections()}
            
            {!isTraining && (
              <div className="bg-muted/50 p-4 rounded-md border border-border my-6 print:bg-transparent print:border-none print:p-0 print:my-2">
                <p className="text-[11px] font-bold text-foreground mb-2 uppercase tracking-tighter print:text-black print:mb-1">
                  {getItemsLabel()}
                </p>
                <div className="whitespace-pre-wrap text-sm font-medium text-foreground print:text-black print:text-[11px]">
                  {getCleanItemsText() || "Nenhum detalhe registrado."}
                </div>
              </div>
            )}

          </div>

          {/* Link do Guia fora da área formal do termo */}
          {(isTraining || isOnboarding) && (
            <div className="flex justify-center mt-3 print:hidden">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5"
                onClick={handleOpenGuide}
              >
                <FileText className="h-3.5 w-3.5" />
                Abrir Guia de TI para Leitura
              </Button>
            </div>
          )}

          <div className="space-y-4 print:space-y-1 print:mt-1">
            {isTraining && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                <div className="space-y-3">
                  <Label htmlFor="trainee-name">Nome do treinado</Label>
                  <Input
                    id="trainee-name"
                    value={traineeName}
                    onChange={(e) => setTraineeName(e.target.value)}
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="trainee-department">Setor do treinado</Label>
                  <Input
                    id="trainee-department"
                    value={traineeDepartment}
                    onChange={(e) => setTraineeDepartment(e.target.value)}
                    placeholder="Digite seu setor"
                  />
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3 p-3 rounded-md border bg-muted/20 print:border-none print:bg-transparent print:p-0 print:items-center">
              <Checkbox 
                id="accept-terms" 
                checked={acceptedTerms} 
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <Label 
                  htmlFor="accept-terms" 
                  className="text-sm font-medium leading-normal cursor-pointer print:text-black print:text-[10px]"
                >
                  {isTraining
                    ? 'Declaro que recebi o treinamento acima, compreendi o conteúdo e estou ciente dos termos.'
                    : 'Li e concordo expressamente com todas as condições acima estipuladas.'}
                </Label>
              </div>
            </div>

            <div className="space-y-3 print:space-y-1 print:pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary print:text-black print:text-[11px]">
                <Info className="h-4 w-4 print:hidden" />
                <span>
                  {isTraining ? "Assinatura do Treinando:" : "Assinatura do Colaborador:"}
                </span>
              </div>
              
              <SignatureCanvas onSave={(data) => setSignature(data)} onClear={() => setSignature(null)} />
            </div>
          </div>

          <div className="pt-4 print:pt-1">
            <Button 
              className="w-full h-12 text-lg font-bold print:hidden" 
              disabled={
                !signature ||
                !acceptedTerms ||
                submitting ||
                (isTraining && (!traineeName.trim() || !traineeDepartment.trim()))
              }
              onClick={handleFinalize}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registrando...
                </>
              ) : isTraining ? "Confirmar Treinamento" : "Confirmar Recebimento"}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-4 italic">
              Aceite eletrônico registrado com trilha de auditoria para fins de controle e rastreabilidade interna.
              A data e hora exatas serão geradas e vinculadas a este registro no momento da confirmação.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptancePage;
