interface AcceptanceTermsContentProps {
  isPrint?: boolean;
  isOnboarding: boolean;
  isOffboarding: boolean;
  isTraining: boolean;
  hasHardware: boolean;
  hasCorporateChannels: boolean;
  hasSystems: boolean;
  hasDigitalIdentity: boolean;
}

export function AcceptanceTermsContent({
  isPrint = false,
  isOnboarding,
  isOffboarding,
  isTraining,
  hasHardware,
  hasCorporateChannels,
  hasSystems,
  hasDigitalIdentity,
}: AcceptanceTermsContentProps) {
  let sectionCount = 0;
  const getNextNum = () => {
    sectionCount++;
    return `${sectionCount}.`;
  };

  const titleClass = `font-bold uppercase text-foreground print:text-black ${isPrint ? 'text-[11px] mb-0.5 print:text-[9pt]' : 'text-xs mb-1'}`;
  const paraClass = isPrint ? 'text-[12px] text-foreground print:text-black print:text-[8.5pt]' : 'text-[12px] text-foreground';

  return (
    <div className={isPrint ? 'space-y-4 print:space-y-1' : 'space-y-4'}>
      {/* ONBOARDING */}
      {isOnboarding && (
        <>
          <section>
            <h4 className={titleClass}>{getNextNum()} FINALIDADE</h4>
            <p className={paraClass}>
              Este termo registra a ciência sobre as políticas de uso vigentes na PQVIRK e, quando aplicável, formaliza o recebimento de recursos corporativos de TI.
            </p>
          </section>

          <section>
            <h4 className={titleClass}>{getNextNum()} AMBIENTE E REDE CONECTADA</h4>
            <p className={paraClass}>
              As dependências da PQVIRK são resguardadas por monitoramento de vídeo e áudio ambiental, restrito a propósitos de segurança e prevenção patrimonial. Complementarmente, a empresa dispõe de acesso Wi-Fi isolado para as operações. Em estrito cumprimento ao Marco Civil da Internet (Lei 12.965/14), o roteador de rede corporativa realiza a coleta e retenção de metadados de sessão (endereços IP visitados, tráfego de dados e carimbos de data/hora) para auditoria e controle de incidentes cibernéticos. O uso da rede para acesso, download ou compartilhamento de materiais ilícitos, pirataria ou pornografia é terminantemente proibido.
            </p>
          </section>

          {hasHardware && (
            <section>
              <h4 className={titleClass}>{getNextNum()} DISPOSITIVOS TECNOLÓGICOS</h4>
              <p className={paraClass}>
                Os hardwares fornecidos (computadores, smartphones e periféricos) são ativos operacionais sob guarda temporária do colaborador e de uso exclusivo para as atividades da empresa. O setor de TI exerce a gestão de segurança centralizada desses ativos, o que inclui rotinas automáticas de gerenciamento remoto e possibilidade de bloqueio cautelar em caso de extravio. Durante a jornada de trabalho, a captura de dados de geolocalização dos dispositivos móveis está expressamente autorizada para as finalidades de apoio logístico, acompanhamento de rotas de frota e segurança do equipamento.
              </p>
            </section>
          )}

          {hasCorporateChannels && (
            <section>
              <h4 className={titleClass}>{getNextNum()} COMUNICAÇÃO CORPORATIVA E TELECOM</h4>
              <p className={paraClass}>
                O endereço de e-mail corporativo e a linha telefônica concedida (cartão SIM ou eSIM) compreendem ferramentas de comunicação empresarial. Todo fluxo de e-mail pertencente à empresa é passível de revisão e auditoria corporativa motivada por segurança da informação ou continuidade processual. A gestão de telefonia audita continuamente as faturas geradas pela operadora — analisando apenas volume de dados móveis utilizados, histórico de números discados e tempo de ligação. O conteúdo das audições telefônicas privadas não é gravado, monitorado ou interceptado pela infraestrutura técnica.
              </p>
            </section>
          )}

          {hasSystems && (
            <section>
              <h4 className={titleClass}>{getNextNum()} IDENTIDADE DIGITAL E SISTEMAS</h4>
              <p className={paraClass}>
                As credenciais sistêmicas emitidas pelo setor de TI (usuário e senha) configuram a assinatura lógica do colaborador na empresa. Toda manipulação, exclusão ou criação de registros nos sistemas e pastas em rede corporativa são gravadas e mantidas em logs de auditoria (rastreabilidade estrutural). A identidade digital é pessoal e absolutamente intransferível, configurando infração de Segurança da Informação o fornecimento de senhas a terceiros ou outros colaboradores.
              </p>
            </section>
          )}

          <section>
            <h4 className={titleClass}>{getNextNum()} ACEITE</h4>
            <p className={paraClass}>
              Declaro que li e aceito formalmente as condições estabelecidas nos itens acima.
            </p>
          </section>
        </>
      )}

      {/* OFFBOARDING */}
      {isOffboarding && (
        <>
          <section>
            <h4 className={titleClass}>{getNextNum()} FINALIDADE</h4>
            <p className={paraClass}>
              Este termo registra o encerramento dos acessos de TI e, quando aplicável, a devolução de equipamentos.
            </p>
          </section>

          {hasDigitalIdentity && (
            <section>
              <h4 className={titleClass}>{getNextNum()} ENCERRAMENTO DE ACESSOS</h4>
              <p className={paraClass}>
                Todos os acessos digitais corporativos serão encerrados pelo TI. O uso de qualquer credencial da empresa após essa data não é permitido.
              </p>
            </section>
          )}

          {hasHardware && (
            <section>
              <h4 className={titleClass}>{getNextNum()} DEVOLUÇÃO DE EQUIPAMENTOS</h4>
              <p className={paraClass}>
                Os equipamentos corporativos devem ser devolvidos em boas condições de uso, considerando desgaste natural, conforme prazo orientado pelo RH.
              </p>
            </section>
          )}

          <section>
            <h4 className={titleClass}>{getNextNum()} SIGILO</h4>
            <p className={paraClass}>
              O dever de sigilo sobre informações da empresa permanece após o desligamento.
            </p>
          </section>

          <section>
            <h4 className={titleClass}>{getNextNum()} ACEITE</h4>
            <p className={paraClass}>
              O encerramento dos acessos digitais entra em vigor nesta data. Referente à estrutura física, o colaborador toma ciência do checklist de coletas acima, bem como das eventuais ressalvas lançadas em caráter técnico pelo departamento de TI na ocasião deste recebimento. O TI atua apenas como registrador das devoluções. Condições incomuns documentadas serão encaminhadas para o RH e Diretoria para análise. Declaro ciência dos termos acima.
            </p>
          </section>
        </>
      )}

      {/* TREINAMENTO */}
      {isTraining && (
        <>
          <section>
            <h4 className={titleClass}>{getNextNum()} FINALIDADE</h4>
            <p className={paraClass}>
              Este termo registra a participação e a ciência do colaborador sobre o treinamento de TI realizado.
            </p>
          </section>

          {hasHardware && (
            <section>
              <h4 className={titleClass}>{getNextNum()} RECURSOS UTILIZADOS</h4>
              <p className={paraClass}>
                Os recursos de TI disponibilizados para este treinamento são de uso exclusivo para essa finalidade.
              </p>
            </section>
          )}

          <section>
            <h4 className={titleClass}>{getNextNum()} CIÊNCIA</h4>
            <p className={paraClass}>
              Declaro que participei do treinamento listado e estou ciente do conteúdo apresentado.
            </p>
          </section>
        </>
      )}

      <section className="mt-4 pt-3 border-t border-border/50">
        <h4 className={titleClass}>DADOS, PRIVACIDADE E RETENÇÃO</h4>
        <p className={paraClass}>
          Este registro digital será mantido pela PQVIRK pelo prazo mínimo de 5 (cinco) anos, para fins de controle de ativos, rastreabilidade e conformidade, conforme boas práticas de gestão de TI e legislação aplicável (LGPD Art. 9, §1).
        </p>
        <p className={`${paraClass} mt-1`}>
          Os dados registrados neste sistema — nome, setor, assinatura digital e ativos de TI associados — são utilizados exclusivamente para fins de gestão de equipamentos e acessos corporativos. O titular pode solicitar acesso, correção ou exclusão desses registros diretamente ao responsável de TI da PQVIRK (LGPD Art. 18).
        </p>
      </section>
    </div>
  );
}
