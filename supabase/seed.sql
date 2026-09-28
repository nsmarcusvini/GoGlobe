-- =============================================================================
-- GoGlobe seed: pathways verified on official government sites on 2026-09-28.
-- Rules: every requirement / step / document / cost has its official source URL.
-- Nothing here is advice: texts describe published criteria only.
-- Government fees are "from" values for the main applicant, as published.
-- Typical (non-government) costs are NOT seeded: no official source to verify them.
-- =============================================================================

-- Seed inserts children into pathways that start as drafts and are published at
-- the end, so the version stays 1 and the change log starts clean.

-- ---------------------------------------------------------------- countries --
insert into public.countries (code, name_pt, currency, official_site_url) values
  ('AU', 'Austrália', 'AUD', 'https://immi.homeaffairs.gov.au/'),
  ('NZ', 'Nova Zelândia', 'NZD', 'https://www.immigration.govt.nz/'),
  ('CA', 'Canadá', 'CAD', 'https://www.canada.ca/en/immigration-refugees-citizenship.html');

-- ----------------------------------------------------------- exchange rates --
-- Banco Central do Brasil, PTAX closing (sell) rate of 2026-09-25.
-- NZD is not part of PTAX: left out until an official rate is chosen (see README).
insert into public.exchange_rates (currency, brl_rate, source, fetched_at) values
  ('AUD', 3.6565, 'Banco Central do Brasil — PTAX fechamento (venda)', '2026-09-25 13:10:17-03'),
  ('CAD', 3.6771, 'Banco Central do Brasil — PTAX fechamento (venda)', '2026-09-25 13:10:17-03');

-- ------------------------------------------------------------------ helpers --
create temporary table _p (slug text primary key, id uuid);

create or replace function pg_temp.pw(p_slug text) returns uuid
language sql stable as $$ select id from _p where slug = p_slug $$;

create or replace function pg_temp.add_pathway(
  p_country text, p_slug text, p_official text, p_name text,
  p_category public.pathway_category, p_summary text, p_duration text,
  p_residence boolean, p_url text, p_calc text default null
) returns void language plpgsql as $$
declare new_id uuid;
begin
  insert into public.pathways (
    country_id, slug, official_name, name_pt, category, summary_pt,
    typical_duration_text, leads_to_residence, official_url, points_calculator_url,
    status, last_verified_at
  ) values (
    (select id from public.countries where code = p_country), p_slug, p_official, p_name,
    p_category, p_summary, p_duration, p_residence, p_url, p_calc,
    'draft', '2026-09-28 12:00:00-03'
  ) returning id into new_id;
  insert into _p values (p_slug, new_id);
end $$;

-- =============================================================== AUSTRALIA ===

select pg_temp.add_pathway('AU', 'skilled-independent-189',
  'Skilled Independent visa (subclass 189) – Points-tested stream',
  'Visto de trabalho qualificado independente (subclasse 189)', 'residence',
  'Visto permanente para trabalhadores qualificados convidados pelo governo australiano, sem necessidade de empregador ou estado patrocinador. Exige ocupação na lista de ocupações qualificadas, avaliação de habilidades, convite após manifestação de interesse (EOI) no SkillSelect e pontuação mínima no teste de pontos.',
  'Permanente (viagens livres por 5 anos após a concessão)', true,
  'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested',
  'https://immi.homeaffairs.gov.au/help-support/departmental-forms/online-forms/points-calculator');

select pg_temp.add_pathway('AU', 'skilled-nominated-190',
  'Skilled Nominated visa (subclass 190)',
  'Visto de trabalho qualificado com nomeação estadual (subclasse 190)', 'residence',
  'Visto permanente para trabalhadores qualificados nomeados por um governo estadual ou territorial australiano. Cada estado tem critérios próprios de nomeação. Também exige ocupação elegível, avaliação de habilidades, convite e pontuação mínima.',
  'Permanente (viagens livres por 5 anos após a concessão)', true,
  'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190',
  'https://immi.homeaffairs.gov.au/help-support/departmental-forms/online-forms/points-calculator');

select pg_temp.add_pathway('AU', 'skilled-work-regional-491',
  'Skilled Work Regional (Provisional) visa (subclass 491)',
  'Visto provisório de trabalho qualificado regional (subclasse 491)', 'work',
  'Visto provisório de 5 anos para viver, trabalhar e estudar em áreas regionais designadas da Austrália, com nomeação estadual ou patrocínio de parente elegível. Segundo o governo, permite pedir residência permanente após 3 anos da concessão, se cumpridos os requisitos.',
  '5 anos', true,
  'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491/application',
  'https://immi.homeaffairs.gov.au/help-support/departmental-forms/online-forms/points-calculator');

select pg_temp.add_pathway('AU', 'skills-in-demand-482',
  'Skills in Demand visa (subclass 482) – Core Skills stream',
  'Visto de trabalho patrocinado por empregador — Skills in Demand (subclasse 482)', 'work',
  'Visto temporário em que um empregador aprovado patrocina um trabalhador qualificado para uma vaga que não conseguiu preencher localmente. A ocupação precisa estar na Core Skills Occupation List (CSOL) e o salário deve respeitar os limites mínimos oficiais.',
  'Até 4 anos', true,
  'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482/core-skills-stream');

select pg_temp.add_pathway('AU', 'student-500',
  'Student visa (subclass 500)',
  'Visto de estudante (subclasse 500)', 'study',
  'Visto para estudar em tempo integral em curso registrado no CRICOS, com Confirmação de Matrícula (CoE), seguro saúde de estudante (OSHC) e comprovação de recursos para a estadia.',
  'Até 6 anos, de acordo com a matrícula', false,
  'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500');

select pg_temp.add_pathway('AU', 'work-and-holiday-462',
  'Work and Holiday visa (subclass 462) – First Work and Holiday visa',
  'Work and Holiday — primeiro visto (subclasse 462)', 'working_holiday',
  'Visto de 12 meses para pessoas de 18 a 30 anos de países com acordo — o Brasil está na lista oficial — que querem viajar pela Austrália e trabalhar para ajudar a custear a viagem. O pedido é individual e feito de fora da Austrália.',
  '12 meses', false,
  'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462/first-work-holiday-462');

-- ============================================================= NEW ZEALAND ===

select pg_temp.add_pathway('NZ', 'skilled-migrant-category',
  'Skilled Migrant Category Resident Visa',
  'Residência por qualificação — Skilled Migrant Category', 'residence',
  'Visto de residente para quem tem emprego qualificado ou oferta de emprego com empregador credenciado na Nova Zelândia e soma 6 pontos pelos critérios oficiais (qualificação, registro profissional ou renda, mais experiência de trabalho qualificado na Nova Zelândia). O processo começa com uma manifestação de interesse (EOI).',
  'Residente (condições de viagem por 2 anos após a chegada)', true,
  'https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/');

select pg_temp.add_pathway('NZ', 'accredited-employer-work-visa',
  'Accredited Employer Work Visa (AEWV)',
  'Visto de trabalho com empregador credenciado (AEWV)', 'work',
  'Visto de trabalho para quem recebeu oferta de emprego em tempo integral de um empregador credenciado, com verificação de vaga (job check) aprovada. Segundo o governo, pode levar a um visto de residente.',
  'Até 5 anos, conforme a vaga (3 anos para ocupações ANZSCO nível 4 ou 5)', true,
  'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/');

select pg_temp.add_pathway('NZ', 'fee-paying-student-visa',
  'Fee Paying Student Visa',
  'Visto de estudante (Fee Paying Student Visa)', 'study',
  'Visto para estudar em instituição de ensino aprovada na Nova Zelândia, com comprovação de pagamento das mensalidades, recursos para o custo de vida e passagem de saída. Permite trabalho em meio período durante as aulas, com as condições oficiais.',
  'Até 4 anos', false,
  'https://www.immigration.govt.nz/visas/fee-paying-student-visa/');

select pg_temp.add_pathway('NZ', 'brazil-working-holiday-visa',
  'Brazil Working Holiday Visa',
  'Working Holiday para brasileiros', 'working_holiday',
  'Visto de até 12 meses para cidadãos brasileiros de 18 a 30 anos que querem passar férias, estudar e trabalhar na Nova Zelândia. São 300 vagas por ano, abertas em data divulgada pelo governo. Não permite emprego permanente.',
  'Até 12 meses', false,
  'https://www.immigration.govt.nz/visas/brazil-working-holiday-visa/');

-- ================================================================== CANADA ===

select pg_temp.add_pathway('CA', 'federal-skilled-worker',
  'Express Entry – Federal Skilled Worker Program',
  'Express Entry — Federal Skilled Worker (trabalhador qualificado)', 'residence',
  'Programa de residência permanente gerido pelo Express Entry para trabalhadores qualificados com experiência no exterior ou no Canadá. Exige experiência em ocupação TEER 0 a 3, teste de idioma, educação comprovada e 67 pontos nos fatores de seleção; os candidatos no pool são ranqueados pelo CRS.',
  'Residência permanente', true,
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-workers.html',
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score.html');

select pg_temp.add_pathway('CA', 'canadian-experience-class',
  'Express Entry – Canadian Experience Class',
  'Express Entry — Canadian Experience Class (experiência no Canadá)', 'residence',
  'Programa de residência permanente para quem já tem experiência de trabalho qualificado no Canadá, obtida com autorização como residente temporário. Costuma ser uma etapa posterior para quem estudou ou trabalhou no país.',
  'Residência permanente', true,
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/canadian-experience-class.html',
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score.html');

select pg_temp.add_pathway('CA', 'federal-skilled-trades',
  'Express Entry – Federal Skilled Trades Program',
  'Express Entry — Federal Skilled Trades (ofícios qualificados)', 'residence',
  'Programa de residência permanente para profissionais de ofícios qualificados, com 2 anos de experiência no ofício e oferta de emprego ou certificado de qualificação canadense.',
  'Residência permanente', true,
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-trades.html',
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score.html');

select pg_temp.add_pathway('CA', 'provincial-nominee-program',
  'Provincial Nominee Program (PNP)',
  'Programa de Nomeação Provincial (PNP) — visão geral', 'residence',
  'Províncias e territórios nomeiam pessoas com habilidades, educação e experiência para a economia local. Há rotas ligadas ao Express Entry (a nomeação soma 600 pontos no CRS) e rotas fora dele. Os critérios variam por província e por programa — consulte o site de cada província.',
  'Residência permanente', true,
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html');

select pg_temp.add_pathway('CA', 'study-permit',
  'Study permit',
  'Permissão de estudo (study permit)', 'study',
  'Permissão para estudar em instituição de ensino designada (DLI) no Canadá. Exige carta de aceitação, carta de atestado provincial/territorial (PAL/TAL) quando aplicável e comprovação de recursos para mensalidades e custo de vida.',
  'Duração do curso', false,
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html');

select pg_temp.add_pathway('CA', 'post-graduation-work-permit',
  'Post-Graduation Work Permit (PGWP)',
  'Permissão de trabalho pós-graduação (PGWP)', 'work',
  'Permissão de trabalho aberta para quem concluiu programa elegível de pelo menos 8 meses em instituição designada no Canadá. É uma etapa pós-estudo; a experiência de trabalho qualificado obtida no Canadá é um dos requisitos da Canadian Experience Class.',
  'Varia conforme o programa de estudo concluído', false,
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html');

-- ============================================================ REQUIREMENTS ===
-- Hard (is_hard) = eliminatory per the official page. Manual = cannot be assessed
-- automatically from the profile.

insert into public.requirements (pathway_id, key, label_pt, description_pt, rule, is_hard, source_url, last_verified_at, sort_order)
select pg_temp.pw(r.slug), r.key, r.label, r.descr, r.rule::jsonb, r.hard, r.src, '2026-09-28 12:00:00-03', r.ord
from (values
  -- AU 189
  ('skilled-independent-189', 'age', 'Ter menos de 45 anos no convite', 'É preciso ter menos de 45 anos quando o governo envia o convite para aplicar.', '{"op":"age_max","value":44}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested', 1),
  ('skilled-independent-189', 'english', 'Inglês "competent" no convite', 'Pelo menos inglês "competent" na data do convite. Por exemplo: IELTS nota 6 em cada uma das 4 habilidades, ou CELPIP 7 em cada. Outros testes (PTE, TOEFL, OET, Cambridge, MET, LanguageCert) têm notas mínimas por habilidade na tabela oficial. Testes feitos 100% online não são aceitos.', '{"op":"english_min","tests":[{"test":"IELTS","min_score":6,"scope":"each_component"},{"test":"CELPIP","min_score":7,"scope":"each_component"}]}', true, 'https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language/competent-english', 2),
  ('skilled-independent-189', 'occupation', 'Ocupação na lista de ocupações qualificadas', 'A ocupação precisa estar na lista oficial de ocupações elegíveis para este visto.', '{"op":"manual","reason":"Confira sua ocupação na lista oficial"}', true, 'https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list', 3),
  ('skilled-independent-189', 'skills_assessment', 'Avaliação de habilidades adequada', 'Avaliação de habilidades (skills assessment) válida para a ocupação, feita pelo órgão avaliador competente.', '{"op":"manual","reason":"Feita por órgão avaliador da ocupação"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested', 4),
  ('skilled-independent-189', 'points', 'Pontuação de 65 pontos ou mais', 'É um visto com teste de pontos: sem 65 pontos não há convite. Use a calculadora oficial — o GoGlobe não recalcula a pontuação.', '{"op":"manual","reason":"Use a calculadora oficial de pontos"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested', 5),
  ('skilled-independent-189', 'invitation', 'Convite para aplicar', 'Só é possível aplicar após receber convite por meio da manifestação de interesse (EOI) no SkillSelect.', '{"op":"manual","reason":"Depende de convite do governo"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested', 6),
  ('skilled-independent-189', 'health_character', 'Requisitos de saúde e caráter', 'Você e os familiares incluídos precisam cumprir os requisitos de saúde e de caráter (antecedentes).', '{"op":"manual"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested', 7),

  -- AU 190
  ('skilled-nominated-190', 'age', 'Ter menos de 45 anos no convite', 'É preciso ter menos de 45 anos quando o governo envia o convite para aplicar.', '{"op":"age_max","value":44}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190', 1),
  ('skilled-nominated-190', 'english', 'Inglês "competent" no convite', 'Pelo menos inglês "competent" na data do convite. Por exemplo: IELTS 6 em cada habilidade, ou CELPIP 7 em cada. Veja a tabela oficial para os demais testes.', '{"op":"english_min","tests":[{"test":"IELTS","min_score":6,"scope":"each_component"},{"test":"CELPIP","min_score":7,"scope":"each_component"}]}', true, 'https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language/competent-english', 2),
  ('skilled-nominated-190', 'nomination', 'Nomeação por estado ou território', 'É preciso ser nomeado por uma agência de governo estadual ou territorial australiano. Cada estado define seus próprios critérios.', '{"op":"manual","reason":"Critérios definidos por cada estado"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190', 3),
  ('skilled-nominated-190', 'occupation', 'Ocupação na lista de ocupações qualificadas', 'A ocupação precisa estar na lista oficial de ocupações elegíveis para o visto 190.', '{"op":"manual","reason":"Confira sua ocupação na lista oficial"}', true, 'https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list', 4),
  ('skilled-nominated-190', 'skills_assessment', 'Avaliação de habilidades adequada', 'Avaliação de habilidades (skills assessment) válida para a ocupação.', '{"op":"manual"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190', 5),
  ('skilled-nominated-190', 'points', 'Pontuação de 65 pontos ou mais', 'Visto com teste de pontos. Use a calculadora oficial — o GoGlobe não recalcula a pontuação.', '{"op":"manual","reason":"Use a calculadora oficial de pontos"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190', 6),

  -- AU 491
  ('skilled-work-regional-491', 'age', 'Ter menos de 45 anos no convite', 'É preciso ter menos de 45 anos para ser convidado a aplicar.', '{"op":"age_max","value":44}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491/application', 1),
  ('skilled-work-regional-491', 'english', 'Inglês "competent" no convite', 'Pelo menos inglês "competent" na data do convite. Por exemplo: IELTS 6 em cada habilidade, ou CELPIP 7 em cada.', '{"op":"english_min","tests":[{"test":"IELTS","min_score":6,"scope":"each_component"},{"test":"CELPIP","min_score":7,"scope":"each_component"}]}', true, 'https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language/competent-english', 2),
  ('skilled-work-regional-491', 'nomination', 'Nomeação estadual ou patrocínio de parente', 'Nomeação por governo estadual/territorial ou patrocínio de parente elegível que viva em área regional designada.', '{"op":"manual"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491/application', 3),
  ('skilled-work-regional-491', 'occupation', 'Ocupação em lista relevante', 'A ocupação precisa estar em uma lista relevante de ocupações qualificadas, com avaliação de habilidades adequada.', '{"op":"manual","reason":"Confira sua ocupação na lista oficial"}', true, 'https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list', 4),
  ('skilled-work-regional-491', 'points', 'Pontuação de 65 pontos ou mais', 'Visto com teste de pontos. Use a calculadora oficial.', '{"op":"manual","reason":"Use a calculadora oficial de pontos"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491/application', 5),

  -- AU 482 Core Skills
  ('skills-in-demand-482', 'sponsor', 'Nomeação por empregador aprovado', 'O empregador precisa ser patrocinador aprovado e nomear você para uma ocupação da Core Skills Occupation List (CSOL).', '{"op":"manual","reason":"Depende de oferta e nomeação do empregador"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482/core-skills-stream', 1),
  ('skills-in-demand-482', 'experience', 'Pelo menos 1 ano de experiência', 'Pelo menos 1 ano de experiência de trabalho relevante na ocupação nomeada ou em área relacionada.', '{"op":"experience_min_years","value":1}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482/core-skills-stream', 2),
  ('skills-in-demand-482', 'salary', 'Salário de mercado e acima do limite oficial', 'Receber o salário anual de mercado da ocupação (AMSR) e não menos que o Core Skills Income Threshold (CSIT), atualizado anualmente.', '{"op":"manual"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482/core-skills-stream', 3),
  ('skills-in-demand-482', 'english', 'Padrão mínimo de inglês', 'Cumprir os padrões mínimos de inglês definidos para o visto, salvo isenções. Consulte as notas exigidas na página oficial.', '{"op":"manual","reason":"Notas definidas na página oficial do visto"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482/core-skills-stream', 4),
  ('skills-in-demand-482', 'skills_assessment', 'Avaliação de habilidades, se exigida', 'Avaliação de habilidades relevante, quando exigida para a ocupação.', '{"op":"manual"}', false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482/core-skills-stream', 5),

  -- AU 500
  ('student-500', 'goal', 'Objetivo de estudo', 'Este visto é para estudar em tempo integral na Austrália.', '{"op":"goal_in","goals":["study"]}', false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', 1),
  ('student-500', 'enrolment', 'Matrícula com Confirmação de Matrícula (CoE)', 'Matrícula em curso de tempo integral registrado no CRICOS, com CoE válida quando o visto for decidido.', '{"op":"manual","reason":"Depende da matrícula na instituição"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', 2),
  ('student-500', 'funds', 'Recursos suficientes para a estadia', 'Comprovar recursos para custo de vida (AUD 29.710 por 12 meses para o estudante), mensalidades do primeiro ano e viagem. Os valores para familiares são adicionais.', '{"op":"manual","reason":"Depende do curso escolhido"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', 3),
  ('student-500', 'oshc', 'Seguro saúde de estudante (OSHC)', 'Ter e manter o Overseas Student Health Cover durante toda a estadia, salvo isenções.', '{"op":"manual"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', 4),
  ('student-500', 'genuine_student', 'Requisito de estudante genuíno', 'Cumprir o requisito de estudante genuíno (Genuine Student requirement).', '{"op":"manual"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', 5),
  ('student-500', 'english', 'Evidência de inglês, se exigida', 'Pode ser necessário comprovar inglês. A ferramenta Document Checklist do governo indica o que apresentar.', '{"op":"manual","reason":"Varia conforme curso e país"}', false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', 6),

  -- AU 462
  ('work-and-holiday-462', 'age_min', 'Ter pelo menos 18 anos', 'Ter entre 18 e 30 anos (inclusive) ao aplicar.', '{"op":"age_min","value":18}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462/first-work-holiday-462', 1),
  ('work-and-holiday-462', 'age_max', 'Ter no máximo 30 anos ao aplicar', 'O pedido precisa ser feito antes de completar 31 anos (horário de Canberra).', '{"op":"age_max","value":30}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462/first-work-holiday-462', 2),
  ('work-and-holiday-462', 'education', 'Pelo menos 2 anos de estudo pós-ensino médio', 'Para brasileiros: ter concluído pelo menos 2 anos de estudo após o ensino médio.', '{"op":"manual","reason":"Anos de estudo superior concluídos"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462/first-work-holiday-462', 3),
  ('work-and-holiday-462', 'english', 'Inglês "functional"', 'Comprovar inglês "functional" — por exemplo, IELTS com média de pelo menos 4,5 ou CELPIP geral 5, com teste de até 12 meses.', '{"op":"english_min","tests":[{"test":"IELTS","min_score":4.5,"scope":"overall"},{"test":"CELPIP","min_score":5,"scope":"overall"}]}', true, 'https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language/functional-english', 4),
  ('work-and-holiday-462', 'funds', 'Recursos para a estadia e saída', 'Normalmente cerca de AUD 5.000 para a estadia inicial, mais o valor da passagem de saída (ou a passagem já comprada).', '{"op":"manual"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462/first-work-holiday-462', 5),
  ('work-and-holiday-462', 'no_dependants', 'Sem filhos dependentes acompanhando', 'Não pode viajar acompanhado de filhos dependentes; o pedido é individual.', '{"op":"manual"}', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462/first-work-holiday-462', 6),

  -- NZ SMC
  ('skilled-migrant-category', 'age', 'Ter 55 anos ou menos ao aplicar', 'É preciso ter 55 anos ou menos na data do pedido.', '{"op":"age_max","value":55}', true, 'https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/', 1),
  ('skilled-migrant-category', 'english', 'Inglês comprovado', 'Por exemplo: IELTS nota geral 6,5 ou mais, TOEFL iBT 79 ou mais, ou PTE Academic 58 ou mais. Resultados com no máximo 2 anos.', '{"op":"english_min","tests":[{"test":"IELTS","min_score":6.5,"scope":"overall"},{"test":"TOEFL","min_score":79,"scope":"overall"},{"test":"PTE","min_score":58,"scope":"overall"}]}', true, 'https://www.immigration.govt.nz/process-to-apply/applying-for-a-visa/providing-evidence-and-documents-to-support-your-visa-application/english-language-requirements/english-language-requirements-for-skilled-residence-visas/', 2),
  ('skilled-migrant-category', 'job', 'Emprego qualificado com empregador credenciado', 'Emprego ou oferta de emprego qualificado na Nova Zelândia com empregador credenciado, com pelo menos 30 horas semanais.', '{"op":"manual","reason":"Depende de emprego na Nova Zelândia"}', true, 'https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/', 3),
  ('skilled-migrant-category', 'points', '6 pontos de residência qualificada', 'Somar 6 pontos por qualificação, registro profissional ou renda, e experiência de trabalho qualificado na Nova Zelândia.', '{"op":"manual","reason":"Pontos definidos pelos critérios oficiais"}', true, 'https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/', 4),

  -- NZ AEWV
  ('accredited-employer-work-visa', 'job_offer', 'Oferta de emprego de empregador credenciado', 'Oferta de trabalho em tempo integral de empregador credenciado, com job check aprovado e salário no mínimo exigido para a vaga.', '{"op":"manual","reason":"Depende de oferta de emprego"}', true, 'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/', 1),
  ('accredited-employer-work-visa', 'experience_or_qualification', '2 anos de experiência ou qualificação nível 4+', 'Ter 2 anos ou mais de experiência relevante, ou qualificação de nível 4 ou superior no quadro de qualificações da Nova Zelândia.', '{"op":"manual","reason":"Experiência OU qualificação"}', true, 'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/', 2),
  ('accredited-employer-work-visa', 'english', 'Inglês, para ocupações de nível 3 a 5', 'Se a vaga for ANZSCO/NOL nível 3 a 5, é preciso comprovar inglês.', '{"op":"manual","reason":"Depende do nível da ocupação"}', false, 'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/', 3),

  -- NZ Student
  ('fee-paying-student-visa', 'goal', 'Objetivo de estudo', 'Este visto é para estudar na Nova Zelândia.', '{"op":"goal_in","goals":["study"]}', false, 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/', 1),
  ('fee-paying-student-visa', 'offer_of_place', 'Oferta de vaga de instituição aprovada', 'Ter oferta de vaga de uma instituição de ensino aprovada e comprovante de pagamento das mensalidades ou bolsa.', '{"op":"manual"}', true, 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/', 2),
  ('fee-paying-student-visa', 'funds', 'Recursos para o custo de vida', 'NZD 20.000 por ano para ensino superior ou de inglês (ou NZD 1.667 por mês em cursos curtos).', '{"op":"manual","reason":"Valor depende da duração do curso"}', true, 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/', 3),
  ('fee-paying-student-visa', 'return_ticket', 'Passagem de saída e seguro', 'Passagem de saída da Nova Zelândia ao fim da estadia e seguro médico e de viagem.', '{"op":"manual"}', true, 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/', 4),

  -- NZ WHV Brazil
  ('brazil-working-holiday-visa', 'age_min', 'Ter pelo menos 18 anos', 'Ter entre 18 e 30 anos.', '{"op":"age_min","value":18}', true, 'https://www.immigration.govt.nz/visas/brazil-working-holiday-visa/', 1),
  ('brazil-working-holiday-visa', 'age_max', 'Ter no máximo 30 anos', 'Ter entre 18 e 30 anos.', '{"op":"age_max","value":30}', true, 'https://www.immigration.govt.nz/visas/brazil-working-holiday-visa/', 2),
  ('brazil-working-holiday-visa', 'citizenship', 'Cidadania brasileira', 'Ser cidadão da República Federativa do Brasil.', '{"op":"manual"}', true, 'https://www.immigration.govt.nz/visas/brazil-working-holiday-visa/', 3),
  ('brazil-working-holiday-visa', 'funds', 'Pelo menos NZD 4.200 para o custo de vida', 'Ter pelo menos NZD 4.200 e a passagem de saída (ou recursos para comprá-la).', '{"op":"manual"}', true, 'https://www.immigration.govt.nz/visas/brazil-working-holiday-visa/', 4),
  ('brazil-working-holiday-visa', 'insurance', 'Seguro médico completo', 'Seguro médico completo durante toda a estadia.', '{"op":"manual"}', true, 'https://www.immigration.govt.nz/visas/brazil-working-holiday-visa/', 5),
  ('brazil-working-holiday-visa', 'quota', 'Vaga na cota anual (300)', 'São 300 vagas por ano. As inscrições abrem em data divulgada pelo governo (edição atual: 8 de outubro de 2026, 10h no horário da Nova Zelândia).', '{"op":"manual","reason":"Depende de vaga na abertura"}', true, 'https://www.immigration.govt.nz/visas/brazil-working-holiday-visa/', 6),

  -- CA FSW
  ('federal-skilled-worker', 'experience', 'Pelo menos 1 ano de experiência qualificada', 'Pelo menos 1 ano contínuo (ou 1.560 horas) de trabalho em ocupação TEER 0, 1, 2 ou 3, nos últimos 10 anos, no Canadá ou no exterior.', '{"op":"experience_min_years","value":1}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-workers.html', 1),
  ('federal-skilled-worker', 'teer', 'Experiência em ocupação TEER 0 a 3', 'A experiência precisa ser em ocupação das categorias TEER 0, 1, 2 ou 3 da classificação canadense.', '{"op":"manual","reason":"Confira a categoria TEER da sua ocupação"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-workers.html', 2),
  ('federal-skilled-worker', 'language', 'Idioma: CLB 7 nas 4 habilidades', 'Nota mínima CLB 7 em escrita, leitura, compreensão e fala. Equivale a IELTS General Training 6,0 em cada habilidade ou CELPIP-General 7 em cada.', '{"op":"english_min","tests":[{"test":"IELTS","min_score":6,"scope":"each_component"},{"test":"CELPIP","min_score":7,"scope":"each_component"}]}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/language-testing.html', 3),
  ('federal-skilled-worker', 'education', 'Educação comprovada', 'Diploma canadense, ou diploma estrangeiro concluído com avaliação de credenciais educacionais (ECA) para fins de imigração.', '{"op":"education_min","level":"high_school"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-workers.html', 4),
  ('federal-skilled-worker', 'points', '67 pontos nos fatores de seleção', 'Somar 67 pontos ou mais em idioma, educação, experiência, idade, emprego arranjado e adaptabilidade. Depois, o CRS define a posição no pool — use a ferramenta oficial.', '{"op":"manual","reason":"Use a ferramenta oficial"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-workers.html', 5),
  ('federal-skilled-worker', 'funds', 'Comprovação de recursos', 'CAD 15.263 para 1 pessoa (valores maiores por familiar), salvo se tiver oferta de emprego válida e autorização para trabalhar no Canadá.', '{"op":"manual","reason":"Valor depende do tamanho da família"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html', 6),

  -- CA CEC
  ('canadian-experience-class', 'canadian_experience', '1 ano de experiência qualificada no Canadá', 'Pelo menos 1 ano (ou 1.560 horas) de trabalho qualificado TEER 0 a 3 no Canadá, nos 3 anos antes do pedido, com autorização como residente temporário.', '{"op":"manual","reason":"Experiência precisa ser no Canadá"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/canadian-experience-class.html', 1),
  ('canadian-experience-class', 'language', 'Idioma: CLB 7 ou CLB 5, conforme a ocupação', 'CLB 7 para ocupações TEER 0 ou 1; CLB 5 para TEER 2 ou 3, nas 4 habilidades.', '{"op":"manual","reason":"Nível depende da categoria TEER"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/language-testing.html', 2),

  -- CA FST
  ('federal-skilled-trades', 'experience', 'Pelo menos 2 anos de experiência no ofício', 'Pelo menos 2 anos de trabalho em tempo integral (ou 3.120 horas) em um ofício qualificado, nos 5 anos antes do pedido.', '{"op":"experience_min_years","value":2}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-trades.html', 1),
  ('federal-skilled-trades', 'job_or_certificate', 'Oferta de emprego ou certificado de qualificação', 'Oferta válida de emprego em tempo integral por pelo menos 1 ano, ou certificado de qualificação no ofício emitido por autoridade canadense.', '{"op":"manual"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-trades.html', 2),
  ('federal-skilled-trades', 'language', 'Idioma: CLB 5 (fala e compreensão) e CLB 4 (leitura e escrita)', 'Notas mínimas diferentes por habilidade — consulte a tabela oficial de equivalência.', '{"op":"manual","reason":"Notas diferentes por habilidade"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/language-testing.html', 3),
  ('federal-skilled-trades', 'funds', 'Comprovação de recursos', 'Mostrar recursos para você e sua família se estabelecerem (tabela oficial), salvo se já trabalhar legalmente no Canadá com oferta válida.', '{"op":"manual"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html', 4),

  -- CA PNP
  ('provincial-nominee-program', 'nomination', 'Nomeação por província ou território', 'É preciso ser nomeado por uma província ou território. Cada um tem programas e critérios próprios.', '{"op":"manual","reason":"Critérios de cada província"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html', 1),
  ('provincial-nominee-program', 'goal', 'Intenção de viver na província', 'Os programas são para quem quer viver na província ou território que nomeia e se tornar residente permanente.', '{"op":"goal_in","goals":["work","residence"]}', false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html', 2),

  -- CA Study permit
  ('study-permit', 'goal', 'Objetivo de estudo', 'Permissão para estudar no Canadá.', '{"op":"goal_in","goals":["study"]}', false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html', 1),
  ('study-permit', 'acceptance', 'Carta de aceitação e PAL/TAL', 'Carta de aceitação da instituição e carta de atestado provincial/territorial (PAL/TAL), quando exigida.', '{"op":"manual"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html', 2),
  ('study-permit', 'funds', 'Recursos para mensalidades e custo de vida', 'Fora de Quebec, a partir de 1º de setembro de 2026: CAD 23.448 por ano para 1 estudante, além das mensalidades e da viagem.', '{"op":"manual","reason":"Soma depende das mensalidades"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html', 3),

  -- CA PGWP
  ('post-graduation-work-permit', 'program', 'Programa elegível de pelo menos 8 meses', 'Ter concluído programa de pelo menos 8 meses em instituição designada elegível para PGWP, estudando em tempo integral.', '{"op":"manual","reason":"Etapa posterior ao estudo no Canadá"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html', 1),
  ('post-graduation-work-permit', 'deadline', 'Pedido em até 180 dias', 'Aplicar em até 180 dias após a confirmação de conclusão do programa.', '{"op":"manual"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html', 2),
  ('post-graduation-work-permit', 'language', 'Idioma: CLB 7 (universidade) ou CLB 5 (college)', 'CLB 7 para bacharelado, mestrado, doutorado e outros programas universitários; CLB 5 para programas de college/politécnico.', '{"op":"manual","reason":"Nível depende do tipo de programa"}', true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html', 3),
  ('post-graduation-work-permit', 'field_of_study', 'Área de estudo, quando exigida', 'Alguns programas exigem área de estudo ligada a ocupações com escassez de longo prazo.', '{"op":"manual"}', false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html', 4)
) as r(slug, key, label, descr, rule, hard, src, ord);

-- ================================================================= STEPS ===

insert into public.pathway_steps (pathway_id, step_order, title_pt, description_pt, source_url)
select pg_temp.pw(s.slug), s.ord, s.title, s.descr, s.src
from (values
  ('skilled-independent-189', 1, 'Confira sua ocupação e faça a avaliação de habilidades', 'Verifique se a ocupação está na lista elegível e obtenha a avaliação de habilidades.', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested'),
  ('skilled-independent-189', 2, 'Calcule seus pontos', 'Use a calculadora oficial para estimar sua pontuação.', 'https://immi.homeaffairs.gov.au/help-support/departmental-forms/online-forms/points-calculator'),
  ('skilled-independent-189', 3, 'Envie a manifestação de interesse (EOI) no SkillSelect', 'A EOI não é um pedido de visto. Mantenha sua situação regular enquanto aguarda.', 'https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect'),
  ('skilled-independent-189', 4, 'Receba o convite e reúna os documentos', 'Traduza para o inglês os documentos em outros idiomas.', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested'),
  ('skilled-independent-189', 5, 'Aplique online no ImmiAccount', 'Faça exames de saúde e biometria quando solicitados e acompanhe o pedido.', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested'),

  ('skilled-nominated-190', 1, 'Confira ocupação, avaliação de habilidades e pontos', 'Verifique a lista elegível e os critérios do estado de interesse.', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190'),
  ('skilled-nominated-190', 2, 'Envie a manifestação de interesse (EOI) no SkillSelect', 'Os estados podem ver sua EOI e nomear você.', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190'),
  ('skilled-nominated-190', 3, 'Seja nomeado e receba o convite', 'Com a nomeação, o governo federal envia o convite para aplicar.', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190'),
  ('skilled-nominated-190', 4, 'Aplique online no ImmiAccount', 'Anexe os documentos traduzidos e acompanhe o pedido.', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190'),

  ('skilled-work-regional-491', 1, 'Confira ocupação, avaliação de habilidades e pontos', null, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491/application'),
  ('skilled-work-regional-491', 2, 'Envie a EOI no SkillSelect', 'Indique nomeação estadual ou patrocínio de parente elegível.', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491/application'),
  ('skilled-work-regional-491', 3, 'Receba o convite e aplique online', null, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491/application'),

  ('skills-in-demand-482', 1, 'Consiga oferta de um empregador patrocinador', 'O empregador precisa ser patrocinador aprovado (ou ter pedido a aprovação).', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482/core-skills-stream'),
  ('skills-in-demand-482', 2, 'Empregador envia a nomeação', 'A nomeação precisa ser para ocupação da CSOL.', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482/core-skills-stream'),
  ('skills-in-demand-482', 3, 'Aplique para o visto', 'Envie os documentos de experiência, inglês e identidade.', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482/core-skills-stream'),

  ('student-500', 1, 'Matricule-se e obtenha a CoE', 'Curso de tempo integral registrado no CRICOS.', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500'),
  ('student-500', 2, 'Contrate o OSHC e reúna comprovação de recursos', null, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500'),
  ('student-500', 3, 'Aplique online', 'Use a Document Checklist oficial para saber quais evidências enviar.', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500'),

  ('work-and-holiday-462', 1, 'Confira idade, estudo e inglês', null, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462/first-work-holiday-462'),
  ('work-and-holiday-462', 2, 'Reúna documentos e comprovação de recursos', null, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462/first-work-holiday-462'),
  ('work-and-holiday-462', 3, 'Aplique online de fora da Austrália', 'Não compre passagens antes da concessão do visto.', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462/first-work-holiday-462'),

  ('skilled-migrant-category', 1, 'Envie a manifestação de interesse (EOI)', null, 'https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/'),
  ('skilled-migrant-category', 2, 'Receba o convite para aplicar', 'Há prazo de 4 meses para aplicar após o convite.', 'https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/'),
  ('skilled-migrant-category', 3, 'Reúna os documentos', 'Documentos em português precisam de tradução certificada para o inglês.', 'https://www.immigration.govt.nz/process-to-apply/applying-for-a-visa/providing-evidence-and-documents-to-support-your-visa-application/providing-english-translations-of-supporting-documents/'),
  ('skilled-migrant-category', 4, 'Envie o pedido, pague a taxa e aguarde a decisão', 'O visto é emitido como eVisa.', 'https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/'),

  ('accredited-employer-work-visa', 1, 'Receba a oferta de emprego', 'O empregador credenciado envia oferta, contrato, descrição da vaga e link de aplicação.', 'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/'),
  ('accredited-employer-work-visa', 2, 'Reúna os documentos', null, 'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/'),
  ('accredited-employer-work-visa', 3, 'Aplique online e pague a taxa', null, 'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/'),
  ('accredited-employer-work-visa', 4, 'Acompanhe e receba o eVisa', null, 'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/'),

  ('fee-paying-student-visa', 1, 'Obtenha a oferta de vaga', null, 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/'),
  ('fee-paying-student-visa', 2, 'Pague as mensalidades e reúna comprovação de recursos', null, 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/'),
  ('fee-paying-student-visa', 3, 'Aplique online', null, 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/'),

  ('brazil-working-holiday-visa', 1, 'Prepare-se antes da abertura', 'Separe passaporte, comprovação de recursos e seguro.', 'https://www.immigration.govt.nz/visas/brazil-working-holiday-visa/'),
  ('brazil-working-holiday-visa', 2, 'Aplique online, em inglês, na abertura das vagas', 'São 300 vagas por ano.', 'https://www.immigration.govt.nz/visas/brazil-working-holiday-visa/'),

  ('federal-skilled-worker', 1, 'Faça o teste de idioma e a avaliação de diploma (ECA)', null, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-workers.html'),
  ('federal-skilled-worker', 2, 'Confira os 67 pontos e estime o CRS', null, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score.html'),
  ('federal-skilled-worker', 3, 'Crie o perfil no Express Entry', 'Os perfis elegíveis entram no pool e são ranqueados pelo CRS.', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-workers.html'),
  ('federal-skilled-worker', 4, 'Receba o convite (ITA) e envie o pedido de residência', 'Documentos fora do inglês/francês exigem tradução por tradutor certificado.', 'https://ircc.canada.ca/english/helpcentre/answer.asp?qnum=018&top=4'),

  ('canadian-experience-class', 1, 'Acumule a experiência qualificada no Canadá', null, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/canadian-experience-class.html'),
  ('canadian-experience-class', 2, 'Faça o teste de idioma e crie o perfil no Express Entry', null, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/canadian-experience-class.html'),

  ('federal-skilled-trades', 1, 'Obtenha oferta de emprego ou certificado de qualificação', null, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-trades.html'),
  ('federal-skilled-trades', 2, 'Faça o teste de idioma e crie o perfil no Express Entry', null, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-trades.html'),

  ('provincial-nominee-program', 1, 'Escolha a província e o programa', 'Consulte os critérios no site da província ou território.', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html'),
  ('provincial-nominee-program', 2, 'Obtenha a nomeação', null, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html'),
  ('provincial-nominee-program', 3, 'Aplique para residência permanente', 'Pelo Express Entry (se elegível) ou pela rota fora dele.', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html'),

  ('study-permit', 1, 'Obtenha a carta de aceitação e a PAL/TAL', null, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html'),
  ('study-permit', 2, 'Reúna comprovação de recursos e documentos de identidade', null, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html'),
  ('study-permit', 3, 'Aplique online e faça a biometria', null, 'https://ircc.canada.ca/english/information/fees/fees.asp'),

  ('post-graduation-work-permit', 1, 'Conclua o programa elegível', null, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html'),
  ('post-graduation-work-permit', 2, 'Aplique em até 180 dias', null, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html')
) as s(slug, ord, title, descr, src);

-- ============================================================= DOCUMENTS ===
-- needs_translation: Brazilian documents are in Portuguese; all three countries
-- require English (or French, Canada) translations. No official page consulted
-- requires an apostille, so none is flagged.

insert into public.documents (pathway_id, name_pt, description_pt, needs_translation, needs_apostille, source_url, sort_order)
select pg_temp.pw(d.slug), d.name, d.descr, d.tr, false, d.src, d.ord
from (values
  ('skilled-independent-189', 'Documentos de identidade', 'Passaporte e demais documentos de identidade.', false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested', 1),
  ('skilled-independent-189', 'Avaliação de habilidades', null, false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested', 2),
  ('skilled-independent-189', 'Comprovante de inglês "competent"', 'Resultado de teste aceito, feito presencialmente.', false, 'https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language/competent-english', 3),
  ('skilled-independent-189', 'Documentos de emprego', 'Comprovação da experiência declarada na EOI.', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested', 4),
  ('skilled-independent-189', 'Documentos de caráter (antecedentes)', 'Certidões de antecedentes criminais.', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested', 5),
  ('skilled-independent-189', 'Documentos de relacionamento e dependentes', 'Se incluir parceiro(a) ou filhos: certidões de casamento/união e nascimento.', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested', 6),

  ('skilled-nominated-190', 'Documentos de identidade', null, false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190', 1),
  ('skilled-nominated-190', 'Avaliação de habilidades', null, false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190', 2),
  ('skilled-nominated-190', 'Comprovante de inglês "competent"', null, false, 'https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language/competent-english', 3),
  ('skilled-nominated-190', 'Documentos de emprego', null, true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190', 4),
  ('skilled-nominated-190', 'Documentos de caráter (antecedentes)', null, true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190', 5),

  ('skilled-work-regional-491', 'Documentos de identidade', null, false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491/application', 1),
  ('skilled-work-regional-491', 'Avaliação de habilidades', null, false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491/application', 2),
  ('skilled-work-regional-491', 'Comprovante de inglês "competent"', null, false, 'https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language/competent-english', 3),
  ('skilled-work-regional-491', 'Documentos de emprego e antecedentes', null, true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491/application', 4),

  ('skills-in-demand-482', 'Documentos de identidade', null, false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482/core-skills-stream', 1),
  ('skills-in-demand-482', 'Comprovação de experiência de trabalho', 'Pelo menos 1 ano relevante.', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482/core-skills-stream', 2),
  ('skills-in-demand-482', 'Comprovante de inglês', null, false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482/core-skills-stream', 3),

  ('student-500', 'Confirmação de Matrícula (CoE)', null, false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', 1),
  ('student-500', 'Comprovante de seguro OSHC', null, false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', 2),
  ('student-500', 'Comprovação de recursos', 'Extratos e documentos financeiros.', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', 3),
  ('student-500', 'Documentos de identidade', null, false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', 4),

  ('work-and-holiday-462', 'Passaporte brasileiro válido', null, false, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462/first-work-holiday-462', 1),
  ('work-and-holiday-462', 'Comprovante de estudo pós-ensino médio', 'Pelo menos 2 anos concluídos.', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462/first-work-holiday-462', 2),
  ('work-and-holiday-462', 'Comprovante de inglês "functional"', null, false, 'https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language/functional-english', 3),
  ('work-and-holiday-462', 'Comprovação de recursos', 'Cerca de AUD 5.000 mais a passagem de saída.', true, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462/first-work-holiday-462', 4),

  ('skilled-migrant-category', 'Passaporte', null, false, 'https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/', 1),
  ('skilled-migrant-category', 'Comprovante de inglês', 'Teste com no máximo 2 anos.', false, 'https://www.immigration.govt.nz/process-to-apply/applying-for-a-visa/providing-evidence-and-documents-to-support-your-visa-application/english-language-requirements/english-language-requirements-for-skilled-residence-visas/', 2),
  ('skilled-migrant-category', 'Contrato e oferta de emprego', null, false, 'https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/', 3),
  ('skilled-migrant-category', 'Diplomas, registro profissional e comprovação de renda', 'Conforme a forma de somar os pontos.', true, 'https://www.immigration.govt.nz/process-to-apply/applying-for-a-visa/providing-evidence-and-documents-to-support-your-visa-application/providing-english-translations-of-supporting-documents/', 4),

  ('accredited-employer-work-visa', 'Oferta de emprego, contrato e descrição da vaga', null, false, 'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/', 1),
  ('accredited-employer-work-visa', 'Passaporte e foto', null, false, 'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/', 2),
  ('accredited-employer-work-visa', 'Comprovação de experiência, habilidades e qualificações', null, true, 'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/', 3),
  ('accredited-employer-work-visa', 'Certidões de antecedentes e exames médicos, se exigidos', null, true, 'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/', 4),

  ('fee-paying-student-visa', 'Oferta de vaga da instituição', null, false, 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/', 1),
  ('fee-paying-student-visa', 'Comprovante de pagamento das mensalidades', null, false, 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/', 2),
  ('fee-paying-student-visa', 'Comprovação de recursos', null, true, 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/', 3),
  ('fee-paying-student-visa', 'Passagem de saída e seguro', null, false, 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/', 4),

  ('brazil-working-holiday-visa', 'Passaporte brasileiro', null, false, 'https://www.immigration.govt.nz/visas/brazil-working-holiday-visa/', 1),
  ('brazil-working-holiday-visa', 'Comprovação de NZD 4.200', null, true, 'https://www.immigration.govt.nz/visas/brazil-working-holiday-visa/', 2),
  ('brazil-working-holiday-visa', 'Passagem de saída (ou recursos para comprá-la)', null, false, 'https://www.immigration.govt.nz/visas/brazil-working-holiday-visa/', 3),
  ('brazil-working-holiday-visa', 'Seguro médico completo', null, false, 'https://www.immigration.govt.nz/visas/brazil-working-holiday-visa/', 4),

  ('federal-skilled-worker', 'Resultado do teste de idioma', null, false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/language-testing.html', 1),
  ('federal-skilled-worker', 'Avaliação de credenciais educacionais (ECA)', null, false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-workers.html', 2),
  ('federal-skilled-worker', 'Comprovação de recursos', null, true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html', 3),
  ('federal-skilled-worker', 'Documentos em português com tradução certificada', 'Tradução para inglês ou francês por tradutor certificado, com declaração juramentada quando exigida. Familiares não podem traduzir.', true, 'https://ircc.canada.ca/english/helpcentre/answer.asp?qnum=018&top=4', 4),

  ('canadian-experience-class', 'Resultado do teste de idioma', null, false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/language-testing.html', 1),
  ('canadian-experience-class', 'Comprovação da experiência no Canadá', null, false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/canadian-experience-class.html', 2),

  ('federal-skilled-trades', 'Oferta de emprego ou certificado de qualificação', null, false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-trades.html', 1),
  ('federal-skilled-trades', 'Resultado do teste de idioma', null, false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/language-testing.html', 2),
  ('federal-skilled-trades', 'Documentos em português com tradução certificada', null, true, 'https://ircc.canada.ca/english/helpcentre/answer.asp?qnum=018&top=4', 3),

  ('provincial-nominee-program', 'Certificado de nomeação provincial', null, false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html', 1),

  ('study-permit', 'Carta de aceitação', null, false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html', 1),
  ('study-permit', 'Carta PAL/TAL', null, false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html', 2),
  ('study-permit', 'Passaporte e 2 fotos recentes', null, false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents.html', 3),
  ('study-permit', 'Comprovação de recursos', null, true, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html', 4),

  ('post-graduation-work-permit', 'Confirmação de conclusão do programa', null, false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html', 1),
  ('post-graduation-work-permit', 'Resultado do teste de idioma', null, false, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html', 2)
) as d(slug, name, descr, tr, src, ord);

-- ================================================================= COSTS ===
-- Government fees only ("from" values for the main applicant).

insert into public.cost_items (pathway_id, label_pt, amount_min, currency, is_mandatory, is_estimate, source_url, last_verified_at, sort_order)
select pg_temp.pw(c.slug), c.label, c.amount, c.cur, true, false, c.src, '2026-09-28 12:00:00-03', c.ord
from (values
  ('skilled-independent-189', 'Taxa do visto (candidato principal, a partir de)', 6135.00, 'AUD', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189/points-tested', 1),
  ('skilled-nominated-190', 'Taxa do visto (candidato principal, a partir de)', 6140.00, 'AUD', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-nominated-190', 1),
  ('skilled-work-regional-491', 'Taxa do visto (candidato principal, a partir de)', 6140.00, 'AUD', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-work-regional-provisional-491', 1),
  ('skills-in-demand-482', 'Taxa do visto (candidato principal, a partir de)', 4015.00, 'AUD', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482/core-skills-stream', 1),
  ('student-500', 'Taxa do visto (candidato principal, a partir de)', 2500.00, 'AUD', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500', 1),
  ('work-and-holiday-462', 'Taxa do visto', 840.00, 'AUD', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462/first-work-holiday-462', 1),
  ('skilled-migrant-category', 'Taxa do pedido (a partir de)', 6450.00, 'NZD', 'https://www.immigration.govt.nz/visas/skilled-migrant-category-resident-visa/', 1),
  ('accredited-employer-work-visa', 'Taxa do pedido (a partir de)', 1540.00, 'NZD', 'https://www.immigration.govt.nz/visas/accredited-employer-work-visa/', 1),
  ('fee-paying-student-visa', 'Taxa do pedido (a partir de)', 850.00, 'NZD', 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/', 1),
  ('brazil-working-holiday-visa', 'Taxa do pedido (a partir de)', 770.00, 'NZD', 'https://www.immigration.govt.nz/visas/brazil-working-holiday-visa/', 1),
  ('federal-skilled-worker', 'Taxa de processamento + direito de residência permanente', 1590.00, 'CAD', 'https://ircc.canada.ca/english/information/fees/fees.asp', 1),
  ('federal-skilled-worker', 'Biometria (por pessoa)', 85.00, 'CAD', 'https://ircc.canada.ca/english/information/fees/fees.asp', 2),
  ('canadian-experience-class', 'Taxa de processamento + direito de residência permanente', 1590.00, 'CAD', 'https://ircc.canada.ca/english/information/fees/fees.asp', 1),
  ('canadian-experience-class', 'Biometria (por pessoa)', 85.00, 'CAD', 'https://ircc.canada.ca/english/information/fees/fees.asp', 2),
  ('federal-skilled-trades', 'Taxa de processamento + direito de residência permanente', 1590.00, 'CAD', 'https://ircc.canada.ca/english/information/fees/fees.asp', 1),
  ('federal-skilled-trades', 'Biometria (por pessoa)', 85.00, 'CAD', 'https://ircc.canada.ca/english/information/fees/fees.asp', 2),
  ('provincial-nominee-program', 'Taxa federal de residência (processamento + direito de RP)', 1590.00, 'CAD', 'https://ircc.canada.ca/english/information/fees/fees.asp', 1),
  ('study-permit', 'Taxa da permissão de estudo', 150.00, 'CAD', 'https://ircc.canada.ca/english/information/fees/fees.asp', 1),
  ('study-permit', 'Biometria (por pessoa)', 85.00, 'CAD', 'https://ircc.canada.ca/english/information/fees/fees.asp', 2),
  ('post-graduation-work-permit', 'Taxa da permissão de trabalho', 155.00, 'CAD', 'https://ircc.canada.ca/english/information/fees/fees.asp', 1),
  ('post-graduation-work-permit', 'Taxa de titular de permissão aberta', 100.00, 'CAD', 'https://ircc.canada.ca/english/information/fees/fees.asp', 2)
) as c(slug, label, amount, cur, src, ord);

-- ================================================================ PUBLISH ===
-- Every pathway above was verified on 2026-09-28. The change log starts clean.
update public.pathways set status = 'published';
delete from public.content_changes;
